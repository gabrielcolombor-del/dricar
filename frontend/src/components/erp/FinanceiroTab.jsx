"use client";

import { useState, useEffect } from "react";

export default function FinanceiroTab() {
  const [custos, setCustos] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form Custo
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("geral"); // geral ou veiculo
  const [formCusto, setFormCusto] = useState({
    id: "",
    descricao: "",
    valor: "",
    dataVencimento: new Date().toISOString().split("T")[0],
    statusPagamento: "Pendente",
    tipo: "Fixo",
    // vehicle fields
    veiculoId: "",
    categoriaVeiculo: "Mecânica",
  });

  async function fetchData() {
    setLoading(true);
    try {
      const [custosRes, veiculosRes] = await Promise.all([
        fetch("/api/admin/erp/financeiro"),
        fetch("/api/admin/erp/veiculos")
      ]);

      if (custosRes.ok && veiculosRes.ok) {
        const custosData = await custosRes.json();
        const veiculosData = await veiculosRes.json();
        setCustos(custosData);
        setVeiculos(veiculosData);
      } else {
        setError("Erro ao carregar lançamentos financeiros.");
      }
    } catch (err) {
      setError("Erro ao se conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handlePriceChange = (val, field = "valor") => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return setFormCusto(prev => ({ ...prev, [field]: "" }));
    const formatted = "R$ " + Number(clean).toLocaleString("pt-BR");
    setFormCusto(prev => ({ ...prev, [field]: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const valorNum = parseFloat(formCusto.valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());
    if (isNaN(valorNum) || valorNum <= 0) {
      setFormError("Informe um valor válido.");
      setFormLoading(false);
      return;
    }

    try {
      let res;
      if (formMode === "veiculo") {
        if (!formCusto.veiculoId) {
          setFormError("Selecione um veículo.");
          setFormLoading(false);
          return;
        }

        res = await fetch("/api/admin/erp/despesas-veiculos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            veiculoId: formCusto.veiculoId,
            categoria: formCusto.categoriaVeiculo,
            valor: valorNum,
            dataDespesa: formCusto.dataVencimento,
          }),
        });
      } else {
        // Geral (Custo Fixo/Variável)
        res = await fetch("/api/admin/erp/financeiro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formCusto,
            valor: valorNum,
          }),
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setShowForm(false);
        setFormCusto({
          id: "",
          descricao: "",
          valor: "",
          dataVencimento: new Date().toISOString().split("T")[0],
          statusPagamento: "Pendente",
          tipo: "Fixo",
          veiculoId: "",
          categoriaVeiculo: "Mecânica",
        });
        setFormMode("geral");
        fetchData();
      } else {
        setFormError(data.error || "Erro ao salvar lançamento.");
      }
    } catch (err) {
      setFormError("Erro de rede.");
    } finally {
      setFormLoading(false);
    }
  };

  const startEditCusto = (c) => {
    setFormMode("geral");
    setFormCusto({
      id: c.id,
      descricao: c.descricao,
      valor: "R$ " + Number(c.valor).toLocaleString("pt-BR"),
      dataVencimento: c.dataVencimento.split("T")[0],
      statusPagamento: c.statusPagamento,
      tipo: c.tipo || "Fixo",
      veiculoId: "",
      categoriaVeiculo: "Mecânica",
    });
    setFormError("");
    setShowForm(true);
  };

  const handleDeleteCusto = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este lançamento? (Caso seja uma despesa de veículo, ela será excluída do centro de custos dele também)")) return;
    try {
      const res = await fetch("/api/admin/erp/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Erro ao excluir.");
      }
    } catch (err) {
      alert("Erro de rede.");
    }
  };

  const totalPago = custos
    .filter(c => c.statusPagamento === "Pago")
    .reduce((acc, curr) => acc + parseFloat(curr.valor), 0);

  const totalPendente = custos
    .filter(c => c.statusPagamento === "Pendente")
    .reduce((acc, curr) => acc + parseFloat(curr.valor), 0);

  return (
    <div className="space-y-6 text-gray-800 animate-fade-in">
      {/* Top Banner and Quick Add */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-extrabold text-brand-blue text-xs sm:text-sm uppercase tracking-wider">Custos Gerais da Operação</h4>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">Lançamento e controle de despesas gerais da empresa e custos particulares de preparação de veículos.</p>
        </div>
        <button
          onClick={() => {
            setFormCusto({
              id: "",
              descricao: "",
              valor: "",
              dataVencimento: new Date().toISOString().split("T")[0],
              statusPagamento: "Pago", // Despesas de preparação normalmente nascem pagas
              tipo: "Fixo",
              veiculoId: "",
              categoriaVeiculo: "Mecânica",
            });
            setFormMode("geral");
            setFormError("");
            setShowForm(true);
          }}
          className="bg-brand-blue hover:opacity-90 text-white font-bold text-xs px-5 py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto cursor-pointer"
        >
          💸 Registrar Custo
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white border border-gray-150 p-4 sm:p-5 rounded-2xl shadow-sm text-center">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Total Pago</span>
          <span className="text-lg font-extrabold text-green-600 block mt-1">
            R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="bg-white border border-gray-150 p-4 sm:p-5 rounded-2xl shadow-sm text-center">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Total Pendente</span>
          <span className="text-lg font-extrabold text-amber-600 block mt-1">
            R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="bg-white border border-gray-150 p-4 sm:p-5 rounded-2xl shadow-sm text-center bg-gray-50/50">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Total Lançado</span>
          <span className="text-lg font-extrabold text-gray-900 block mt-1">
            R$ {(totalPago + totalPendente).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Main Grid: Form and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Costs Table */}
        <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden ${showForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Descrição</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Tipo</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Data / Venc.</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Valor</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Status</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-400 text-xs">Carregando lançamentos...</td>
                  </tr>
                ) : custos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-400 text-xs">Nenhum custo operacional registrado.</td>
                  </tr>
                ) : (
                  custos.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-xs font-bold text-gray-900">
                        {c.descricao}
                      </td>
                      <td className="p-4 text-xs">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          c.tipo === "Fixo" ? "bg-indigo-100 text-indigo-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {c.tipo || "Fixo"}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {new Date(c.dataVencimento).toLocaleDateString("pt-BR", {timeZone: 'UTC'})}
                      </td>
                      <td className="p-4 text-xs font-bold text-gray-900">
                        R$ {Number(c.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-xs">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          c.statusPagamento === "Pago" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {c.statusPagamento}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          {/* Apenas permite editar se não for despesa de veículo para evitar dessincronização complexa */}
                          {!c.descricao.startsWith("Despesa Placa:") && (
                            <button
                              onClick={() => startEditCusto(c)}
                              className="border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white p-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                              title="Editar"
                            >
                              ✏️
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCusto(c.id)}
                            className="border border-red-200 text-red-500 hover:bg-red-50 p-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost Registration Form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-slide-in">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="font-extrabold text-sm text-brand-blue uppercase">
                {formCusto.id ? "Editar Lançamento" : "Novo Lançamento"}
              </h4>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form Mode Selector (Geral ou Veículo) */}
            {!formCusto.id && (
              <div className="flex bg-gray-100 rounded-lg p-1 text-[10px] font-bold border border-gray-200 select-none">
                <button
                  type="button"
                  onClick={() => { setFormMode("geral"); setFormError(""); }}
                  className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                    formMode === "geral" ? "bg-white text-brand-blue shadow-sm" : "text-gray-400"
                  }`}
                >
                  🏢 Custo Geral
                </button>
                <button
                  type="button"
                  onClick={() => { setFormMode("veiculo"); setFormError(""); }}
                  className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                    formMode === "veiculo" ? "bg-white text-brand-blue shadow-sm" : "text-gray-400"
                  }`}
                >
                  🚗 Custo por Veículo
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {formMode === "geral" ? (
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Aluguel do Showroom, Energia, Sistema..."
                    value={formCusto.descricao}
                    onChange={(e) => setFormCusto(prev => ({ ...prev, descricao: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold placeholder-gray-400 focus:outline-none focus:border-brand-blue"
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Veículo (Estoque / Pátio / Vendido)</label>
                    <select
                      value={formCusto.veiculoId}
                      onChange={(e) => setFormCusto(prev => ({ ...prev, veiculoId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                      required
                    >
                      <option value="">Selecione o veículo...</option>
                      {veiculos.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.marca} {v.modelo} - Placa: {v.placa} ({v.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Categoria de Custo</label>
                    <select
                      value={formCusto.categoriaVeiculo}
                      onChange={(e) => setFormCusto(prev => ({ ...prev, categoriaVeiculo: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                    >
                      <option value="IPVA">IPVA</option>
                      <option value="Licenciamento">Licenciamento</option>
                      <option value="Multas">Multas</option>
                      <option value="Transferências">Transferências</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Valor (R$)</label>
                  <input
                    type="text"
                    placeholder="R$ 0"
                    value={formCusto.valor}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-extrabold placeholder-gray-400 focus:outline-none focus:border-brand-blue"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">
                    {formMode === "veiculo" ? "Data Despesa" : "Data Vencimento"}
                  </label>
                  <input
                    type="date"
                    value={formCusto.dataVencimento}
                    onChange={(e) => setFormCusto(prev => ({ ...prev, dataVencimento: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold text-xs focus:outline-none focus:border-brand-blue"
                    required
                  />
                </div>
              </div>

              {formMode === "geral" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Classificação</label>
                    <select
                      value={formCusto.tipo}
                      onChange={(e) => setFormCusto(prev => ({ ...prev, tipo: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                    >
                      <option value="Fixo">Custo Fixo</option>
                      <option value="Variável">Custo Variável</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Status Pagamento</label>
                    <select
                      value={formCusto.statusPagamento}
                      onChange={(e) => setFormCusto(prev => ({ ...prev, statusPagamento: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Pago">Pago</option>
                    </select>
                  </div>
                </div>
              )}

              {formError && (
                <p className="text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg">{formError}</p>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-150 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-brand-blue text-white px-5 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity"
                >
                  {formLoading ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
