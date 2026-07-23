"use client";

import { useState, useEffect } from "react";

export default function PosVendaTab() {
  const [despesas, setDespesas] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  // Modal de Lançamento Pós Venda
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formExpense, setFormExpense] = useState({
    veiculoId: "",
    categoria: "Mecânica",
    valor: "",
    dataDespesa: new Date().toISOString().split("T")[0],
  });

  async function fetchPosVendaData() {
    setLoading(true);
    setError("");
    try {
      const [despesasRes, veiculosRes] = await Promise.all([
        fetch("/api/admin/erp/despesas-veiculos"),
        fetch("/api/admin/erp/veiculos"),
      ]);

      if (despesasRes.ok && veiculosRes.ok) {
        const despesasData = await despesasRes.json();
        const veiculosData = await veiculosRes.json();
        setDespesas(despesasData);
        setVeiculos(veiculosData);
      } else {
        setError("Erro ao carregar dados de Pós Venda.");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosVendaData();
  }, []);

  const handlePriceChange = (val) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return setFormExpense(prev => ({ ...prev, valor: "" }));
    const formatted = "R$ " + Number(clean).toLocaleString("pt-BR");
    setFormExpense(prev => ({ ...prev, valor: formatted }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    if (!formExpense.veiculoId) {
      setFormError("Por favor, selecione um veículo.");
      setFormLoading(false);
      return;
    }

    const valorNum = parseFloat(formExpense.valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());
    if (isNaN(valorNum) || valorNum <= 0) {
      setFormError("Informe um valor válido.");
      setFormLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/erp/despesas-veiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          veiculoId: formExpense.veiculoId,
          categoria: formExpense.categoria,
          valor: valorNum,
          dataDespesa: formExpense.dataDespesa,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowModal(false);
        setFormExpense({
          veiculoId: "",
          categoria: "Mecânica",
          valor: "",
          dataDespesa: new Date().toISOString().split("T")[0],
        });
        fetchPosVendaData();
      } else {
        setFormError(data.error || "Erro ao registrar custo de pós venda.");
      }
    } catch (err) {
      setFormError("Erro de comunicação com o servidor.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este lançamento de Pós Venda? O valor também será abatido do financeiro geral.")) return;
    try {
      const res = await fetch("/api/admin/erp/despesas-veiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id,
        }),
      });

      if (res.ok) {
        fetchPosVendaData();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao excluir lançamento.");
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  // Filtragem de despesas
  const despesasFiltradas = despesas.filter(d => {
    const termo = busca.toLowerCase().trim();
    const matchBusca = !termo || 
      (d.veiculo?.placa && d.veiculo.placa.toLowerCase().includes(termo)) ||
      (d.veiculo?.modelo && d.veiculo.modelo.toLowerCase().includes(termo)) ||
      (d.veiculo?.marca && d.veiculo.marca.toLowerCase().includes(termo)) ||
      (d.categoria && d.categoria.toLowerCase().includes(termo));

    const matchCategoria = !filtroCategoria || d.categoria === filtroCategoria;

    return matchBusca && matchCategoria;
  });

  // Métricas
  const totalPosVenda = despesasFiltradas.reduce((acc, d) => acc + Number(d.valor), 0);
  const totalLancamentos = despesasFiltradas.length;
  const veiculosUnicos = new Set(despesasFiltradas.map(d => d.veiculoId)).size;

  return (
    <div className="space-y-6 text-gray-800 animate-fade-in">
      {/* Top Banner / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            🛠️ Total Custos Pós Venda
          </span>
          <p className="text-2xl font-extrabold text-red-600">
            R$ {totalPosVenda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-gray-400 mt-1 block">Somado automaticamente no Financeiro Geral</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            📝 Lançamentos Realizados
          </span>
          <p className="text-2xl font-extrabold text-brand-blue">
            {totalLancamentos}
          </p>
          <span className="text-[10px] text-gray-400 mt-1 block">Registros de peças, revisões e serviços</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            🚗 Veículos Com Pós Venda
          </span>
          <p className="text-2xl font-extrabold text-purple-600">
            {veiculosUnicos}
          </p>
          <span className="text-[10px] text-gray-400 mt-1 block">Carros atendidos no centro de custos</span>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-grow max-w-2xl">
          {/* Busca */}
          <div className="flex-grow">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              🔍 Buscar por Placa / Veículo / Categoria
            </label>
            <input
              type="text"
              placeholder="Digite a placa, modelo ou serviço..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white text-slate-900 font-semibold placeholder-gray-400 focus:outline-none focus:border-brand-blue"
            />
          </div>

          {/* Filtro Categoria */}
          <div className="w-full sm:w-48">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Categoria
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
            >
              <option value="">Todas</option>
              <option value="Mecânica">Mecânica</option>
              <option value="Funilaria">Funilaria</option>
              <option value="Lavagem">Lavagem</option>
              <option value="IPVA">IPVA</option>
              <option value="Detalhamento">Detalhamento</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            setFormExpense({
              veiculoId: "",
              categoria: "Mecânica",
              valor: "",
              dataDespesa: new Date().toISOString().split("T")[0],
            });
            setFormError("");
            setShowModal(true);
          }}
          className="bg-brand-blue hover:opacity-90 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap self-stretch sm:self-auto flex items-center justify-center gap-2"
        >
          <span>➕ Novo Custo por Veículo</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h4 className="text-xs font-bold text-brand-blue uppercase tracking-wider">
            📋 Histórico de Custos por Veículo (Pós Venda)
          </h4>
          <span className="text-[10px] text-gray-400 font-medium">
            Exibindo {despesasFiltradas.length} de {despesas.length} lançamentos
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm font-medium">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue mx-auto mb-2"></div>
            Carregando lançamentos de pós venda...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 text-xs font-semibold bg-red-50">{error}</div>
        ) : despesasFiltradas.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs font-medium">
            Nenhum custo por veículo encontrado no momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Placa / Veículo</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Categoria de Custo</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Data Lançamento</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Valor (R$)</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {despesasFiltradas.map((d) => {
                  const dataFmt = d.dataDespesa ? new Date(d.dataDespesa).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "-";
                  return (
                    <tr key={d.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-brand-blue text-xs flex items-center gap-2">
                          <span className="bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded font-mono text-[11px] font-bold">
                            {d.veiculo?.placa || "Sem Placa"}
                          </span>
                          <span>{d.veiculo?.marca} {d.veiculo?.modelo}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-semibold text-gray-700">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          {d.categoria}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-500 font-medium">
                        📅 {dataFmt}
                      </td>
                      <td className="p-4 text-xs font-extrabold text-red-600">
                        - R$ {Number(d.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteExpense(d.id)}
                          className="border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Excluir Custo"
                        >
                          ✕ Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Novo Custo Pós Venda */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 w-[95%] sm:w-full max-w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-brand-blue uppercase">
                🛠️ Registrar Custo por Veículo (Pós Venda)
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Veículo (Estoque)
                </label>
                <select
                  value={formExpense.veiculoId}
                  onChange={(e) => setFormExpense(prev => ({ ...prev, veiculoId: e.target.value }))}
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
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Categoria de Custo
                </label>
                <select
                  value={formExpense.categoria}
                  onChange={(e) => setFormExpense(prev => ({ ...prev, categoria: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                  required
                >
                  <option value="Mecânica">Mecânica</option>
                  <option value="Funilaria">Funilaria</option>
                  <option value="Lavagem">Lavagem</option>
                  <option value="IPVA">IPVA</option>
                  <option value="Detalhamento">Detalhamento</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="R$ 0"
                    value={formExpense.valor}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-extrabold placeholder-gray-400 focus:outline-none focus:border-brand-blue"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">
                    Data Despesa
                  </label>
                  <input
                    type="date"
                    value={formExpense.dataDespesa}
                    onChange={(e) => setFormExpense(prev => ({ ...prev, dataDespesa: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                    required
                  />
                </div>
              </div>

              {formError && (
                <p className="text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-100">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-brand-blue text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity"
                >
                  {formLoading ? "Confirmando..." : "Confirmar Custo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
