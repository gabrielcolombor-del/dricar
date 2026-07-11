"use client";

import { useState, useEffect } from "react";

export default function EstoqueTab() {
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVeiculo, setSelectedVeiculo] = useState(null);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroAno, setFiltroAno] = useState("");

  // Modal Novo Veículo
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formVeiculo, setFormVeiculo] = useState({
    id: "",
    placa: "",
    marca: "",
    modelo: "",
    anoFab: "",
    anoMod: "",
    valorCompra: "",
    dataEntrada: new Date().toISOString().split("T")[0],
    status: "Disponível",
    documentoPendente: false,
    renavam: "",
    chassi: "",
  });

  // Modal/Form Lançamento Despesa
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseError, setExpenseError] = useState("");
  const [formExpense, setFormExpense] = useState({
    categoria: "Mecânica",
    valor: "",
    dataDespesa: new Date().toISOString().split("T")[0],
  });

  async function fetchVeiculos() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/erp/veiculos");
      if (res.ok) {
        const data = await res.json();
        setVeiculos(data);
        // Atualizar veiculo selecionado se houver
        if (selectedVeiculo) {
          const updated = data.find(v => v.id === selectedVeiculo.id);
          setSelectedVeiculo(updated || null);
        }
      } else {
        setError("Erro ao carregar veículos.");
      }
    } catch (err) {
      setError("Erro ao se comunicar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVeiculos();
  }, []);

  const marcasUnicas = [...new Set(veiculos.map(v => v.marca))].sort();
  const anosUnicos = [...new Set(veiculos.map(v => v.anoMod))].sort((a,b) => b - a);

  // Filtragem
  const veiculosFiltrados = veiculos.filter(v => {
    const matchStatus = filtroStatus ? v.status === filtroStatus : true;
    const matchMarca = filtroMarca ? v.marca === filtroMarca : true;
    const matchAno = filtroAno ? v.anoMod === parseInt(filtroAno) : true;
    return matchStatus && matchMarca && matchAno;
  });

  // Formatador de placa
  const handlePlacaChange = (val) => {
    const formatted = val.toUpperCase().replace(/[^A-Z0-9-]/g, "").substring(0, 8);
    setFormVeiculo(prev => ({ ...prev, placa: formatted }));
  };

  // Mascaras
  const handlePriceChange = (val, field) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return setFormVeiculo(prev => ({ ...prev, [field]: "" }));
    const formatted = "R$ " + Number(clean).toLocaleString("pt-BR");
    setFormVeiculo(prev => ({ ...prev, [field]: formatted }));
  };

  const handleExpensePriceChange = (val) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return setFormExpense(prev => ({ ...prev, valor: "" }));
    const formatted = "R$ " + Number(clean).toLocaleString("pt-BR");
    setFormExpense(prev => ({ ...prev, valor: formatted }));
  };

  // Submeter cadastro/edição (Apenas dados ERP)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    // Limpar máscaras de preço de compra
    const valorNum = parseFloat(formVeiculo.valorCompra.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());
    if (isNaN(valorNum) || valorNum <= 0) {
      setFormError("Informe um valor de compra válido.");
      setFormLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/erp/veiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formVeiculo,
          valorCompra: valorNum,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowModal(false);
        fetchVeiculos();
      } else {
        setFormError(data.error || "Erro ao salvar veículo.");
      }
    } catch (err) {
      setFormError("Erro de rede.");
    } finally {
      setFormLoading(false);
    }
  };

  // Cadastrar Despesa no Centro de Custo
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVeiculo) return;
    setExpenseLoading(true);
    setExpenseError("");

    const valorNum = parseFloat(formExpense.valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());
    if (isNaN(valorNum) || valorNum <= 0) {
      setExpenseError("Informe um valor de despesa válido.");
      setExpenseLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/erp/despesas-veiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          veiculoId: selectedVeiculo.id,
          categoria: formExpense.categoria,
          valor: valorNum,
          dataDespesa: formExpense.dataDespesa,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFormExpense({
          categoria: "Mecânica",
          valor: "",
          dataDespesa: new Date().toISOString().split("T")[0],
        });
        setShowExpenseForm(false);
        fetchVeiculos();
      } else {
        setExpenseError(data.error || "Erro ao registrar despesa.");
      }
    } catch (err) {
      setExpenseError("Erro ao enviar dados.");
    } finally {
      setExpenseLoading(false);
    }
  };

  // Excluir Veículo do ERP
  const handleDeleteVeiculo = async (id) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este veículo do ERP e do catálogo do site?")) return;
    try {
      const res = await fetch("/api/admin/erp/veiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (res.ok) {
        if (selectedVeiculo && selectedVeiculo.id === id) {
          setSelectedVeiculo(null);
        }
        fetchVeiculos();
      } else {
        alert("Erro ao excluir veículo.");
      }
    } catch (err) {
      alert("Erro ao tentar excluir.");
    }
  };

  // Excluir Despesa
  const handleDeleteExpense = async (id) => {
    if (!confirm("Tem certeza que deseja remover esta despesa?")) return;
    try {
      const res = await fetch("/api/admin/erp/despesas-veiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (res.ok) {
        fetchVeiculos();
      } else {
        alert("Erro ao excluir despesa.");
      }
    } catch (err) {
      alert("Erro de rede.");
    }
  };

  // Abrir modal de edição com dados básicos do ERP
  const startEditVeiculo = (v) => {
    setFormVeiculo({
      id: v.id,
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      anoFab: v.anoFab.toString(),
      anoMod: v.anoMod.toString(),
      valorCompra: "R$ " + Number(v.valorCompra).toLocaleString("pt-BR"),
      dataEntrada: v.dataEntrada.split("T")[0],
      status: v.status,
      documentoPendente: v.documentoPendente,
      renavam: v.renavam || "",
      chassi: v.chassi || "",
    });
    setFormError("");
    setShowModal(true);
  };

  const calcularTotalDespesas = (veiculo) => {
    if (!veiculo || !veiculo.despesas) return 0;
    return veiculo.despesas.reduce((acc, curr) => acc + parseFloat(curr.valor), 0);
  };

  return (
    <div className="space-y-6 text-gray-800 animate-fade-in">
      {/* Top Filter and Actions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="border border-gray-200 rounded-lg py-2 px-3 text-xs bg-white focus:outline-none focus:border-brand-blue"
            >
              <option value="">Todos</option>
              <option value="Disponível">Disponível</option>
              <option value="Vendido">Vendido</option>
              <option value="Em Preparação">Em Preparação</option>
              <option value="Em processo de Transf.">Em processo de Transf.</option>
              <option value="Transferido">Transferido</option>
              <option value="Transferência em aberto">Transferência em aberto</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Marca</label>
            <select
              value={filtroMarca}
              onChange={(e) => setFiltroMarca(e.target.value)}
              className="border border-gray-200 rounded-lg py-2 px-3 text-xs bg-white focus:outline-none focus:border-brand-blue"
            >
              <option value="">Todas</option>
              {marcasUnicas.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ano</label>
            <select
              value={filtroAno}
              onChange={(e) => setFiltroAno(e.target.value)}
              className="border border-gray-200 rounded-lg py-2 px-3 text-xs bg-white focus:outline-none focus:border-brand-blue"
            >
              <option value="">Todos</option>
              {anosUnicos.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={() => {
            setFormVeiculo({
              id: "",
              placa: "",
              marca: "",
              modelo: "",
              anoFab: "",
              anoMod: "",
              valorCompra: "",
              dataEntrada: new Date().toISOString().split("T")[0],
              status: "Disponível",
              documentoPendente: false,
              renavam: "",
              chassi: "",
            });
            setFormError("");
            setShowModal(true);
          }}
          className="bg-brand-blue hover:opacity-90 text-white font-bold text-xs px-5 py-3 rounded-lg flex items-center justify-center gap-1.5 transition-all self-end md:self-auto cursor-pointer"
        >
          ➕ Novo Veículo
        </button>
      </div>

      {/* Main Grid: Table & Center of Cost */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Vehicles Table */}
        <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden ${selectedVeiculo ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Placa</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Veículo</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Ano</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Compra</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Status</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Doc.</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {veiculosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-400 text-xs">Nenhum veículo encontrado.</td>
                  </tr>
                ) : (
                  veiculosFiltrados.map(v => (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVeiculo(v)}
                      className={`hover:bg-gray-50/70 transition-colors cursor-pointer ${
                        selectedVeiculo && selectedVeiculo.id === v.id ? "bg-blue-50/30 font-semibold" : ""
                      }`}
                    >
                      <td className="p-4 font-mono text-xs font-bold text-brand-blue uppercase">
                        {v.placa}
                      </td>
                      <td className="p-4 text-xs font-bold">
                        {v.marca} {v.modelo}
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {v.anoFab}/{v.anoMod}
                      </td>
                      <td className="p-4 text-xs font-bold text-gray-900">
                        R$ {Number(v.valorCompra).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-xs">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          v.status === "Disponível" 
                            ? "bg-green-100 text-green-800" 
                            : v.status === "Vendido" 
                              ? "bg-blue-100 text-blue-800" 
                              : v.status === "Em processo de Transf."
                                ? "bg-purple-100 text-purple-800"
                                : v.status === "Transferido"
                                  ? "bg-teal-100 text-teal-800"
                                  : v.status === "Transferência em aberto"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs">
                        {v.documentoPendente ? (
                          <span className="text-red-600 font-bold text-[10px]">⚠️ Pendente</span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">Regular</span>
                        )}
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => startEditVeiculo(v)}
                            className="border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white p-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteVeiculo(v.id)}
                            className="border border-red-200 text-red-500 hover:bg-red-50 p-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer"
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

        {/* Center of Cost Panel */}
        {selectedVeiculo && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6 animate-slide-in">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Centro de Custo</span>
                <h4 className="font-extrabold text-sm text-brand-blue uppercase mt-1">
                  Placa: {selectedVeiculo.placa}
                </h4>
                <p className="text-xs font-semibold text-gray-600">{selectedVeiculo.marca} {selectedVeiculo.modelo}</p>
              </div>
              <button
                onClick={() => setSelectedVeiculo(null)}
                className="text-gray-400 hover:text-gray-650 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Cost breakdown cards */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-[9px] text-gray-400 uppercase font-bold block">Valor Compra</span>
                <span className="text-xs font-extrabold text-gray-900 block mt-1">
                  R$ {Number(selectedVeiculo.valorCompra).toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                <span className="text-[9px] text-amber-500 uppercase font-bold block">Total Despesas</span>
                <span className="text-xs font-extrabold text-amber-800 block mt-1">
                  R$ {calcularTotalDespesas(selectedVeiculo).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>

            <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50 text-center">
              <span className="text-[9px] text-brand-blue uppercase font-bold block">Custo Total de Aquisição</span>
              <span className="text-sm font-extrabold text-brand-blue block mt-1">
                R$ {(Number(selectedVeiculo.valorCompra) + calcularTotalDespesas(selectedVeiculo)).toLocaleString("pt-BR")}
              </span>
            </div>

            {/* List of Registered Expenses */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Despesas Registradas</h5>
                {!showExpenseForm && (
                  <button
                    onClick={() => setShowExpenseForm(true)}
                    className="text-[10px] text-brand-blue font-bold hover:underline cursor-pointer"
                  >
                    + Add Despesa
                  </button>
                )}
              </div>

              {/* Expense form */}
              {showExpenseForm && (
                <form onSubmit={handleExpenseSubmit} className="bg-gray-50 border border-gray-150 rounded-xl p-4 mb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Categoria</label>
                      <select
                        value={formExpense.categoria}
                        onChange={(e) => setFormExpense(prev => ({ ...prev, categoria: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white"
                      >
                        <option value="Mecânica">Mecânica</option>
                        <option value="Funilaria">Funilaria</option>
                        <option value="Lavagem">Lavagem</option>
                        <option value="IPVA">IPVA</option>
                        <option value="Detalhamento">Detalhamento</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Valor (R$)</label>
                      <input
                        type="text"
                        placeholder="R$ 0"
                        value={formExpense.valor}
                        onChange={(e) => handleExpensePriceChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Data</label>
                    <input
                      type="date"
                      value={formExpense.dataDespesa}
                      onChange={(e) => setFormExpense(prev => ({ ...prev, dataDespesa: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white"
                      required
                    />
                  </div>

                  {expenseError && (
                    <p className="text-[10px] text-red-600 font-semibold">{expenseError}</p>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowExpenseForm(false)}
                      className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-[10px] font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={expenseLoading}
                      className="bg-brand-blue text-white px-4 py-1.5 rounded-lg text-[10px] font-bold"
                    >
                      {expenseLoading ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </form>
              )}

              {selectedVeiculo.despesas && selectedVeiculo.despesas.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2 text-center">Nenhuma despesa para esta placa.</p>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {selectedVeiculo.despesas.map(d => (
                    <div key={d.id} className="flex justify-between items-center bg-gray-50 hover:bg-gray-100/70 p-2.5 rounded-lg text-xs transition-colors">
                      <div>
                        <span className="font-semibold text-gray-700 block">{d.categoria}</span>
                        <span className="text-[9px] text-gray-400">{new Date(d.dataDespesa).toLocaleDateString("pt-BR", {timeZone: 'UTC'})}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-600">
                          - R$ {Number(d.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        <button
                          onClick={() => handleDeleteExpense(d.id)}
                          className="text-gray-300 hover:text-red-500 text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Novo/Editar Veículo ERP (Dados Fiscais & Estoque) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-[650px] shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin text-gray-805">
            
            <div className="flex justify-between items-start border-b border-gray-100 pb-3.5 mb-5">
              <h3 className="text-md font-extrabold text-brand-blue uppercase">
                {formVeiculo.id ? `Editar Veículo ERP (Placa: ${formVeiculo.placa})` : "Cadastrar Entrada de Veículo"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-650 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6 text-xs text-gray-700">
              
              {/* SECTION: ERP & FISCAL */}
              <div className="bg-gray-50/50 border border-gray-150 rounded-xl p-5 space-y-4">
                <h4 className="text-[10px] font-bold text-brand-blue uppercase tracking-wider border-b border-gray-200 pb-2">
                  📝 Dados Fiscais & Entrada
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Placa</label>
                    <input
                      type="text"
                      placeholder="Ex: ABC-1234"
                      value={formVeiculo.placa}
                      onChange={(e) => handlePlacaChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white uppercase font-mono text-xs focus:border-brand-blue"
                      required
                      disabled={!!formVeiculo.id}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Renavam</label>
                    <input
                      type="text"
                      placeholder="Número Renavam..."
                      value={formVeiculo.renavam}
                      onChange={(e) => setFormVeiculo(prev => ({ ...prev, renavam: e.target.value.replace(/\D/g, "") }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white font-mono text-xs focus:border-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Chassi</label>
                    <input
                      type="text"
                      placeholder="Número do Chassi..."
                      value={formVeiculo.chassi}
                      onChange={(e) => setFormVeiculo(prev => ({ ...prev, chassi: e.target.value.toUpperCase().trim() }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white font-mono text-xs focus:border-brand-blue"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Marca</label>
                    <input
                      type="text"
                      placeholder="Ex: Chevrolet"
                      value={formVeiculo.marca}
                      onChange={(e) => setFormVeiculo(prev => ({ ...prev, marca: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:border-brand-blue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Modelo</label>
                    <input
                      type="text"
                      placeholder="Ex: Onix"
                      value={formVeiculo.modelo}
                      onChange={(e) => setFormVeiculo(prev => ({ ...prev, modelo: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:border-brand-blue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Ano Fab.</label>
                    <input
                      type="number"
                      placeholder="Ex: 2019"
                      value={formVeiculo.anoFab}
                      onChange={(e) => setFormVeiculo(prev => ({ ...prev, anoFab: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:border-brand-blue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Ano Mod.</label>
                    <input
                      type="number"
                      placeholder="Ex: 2020"
                      value={formVeiculo.anoMod}
                      onChange={(e) => setFormVeiculo(prev => ({ ...prev, anoMod: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:border-brand-blue"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="md:col-span-2">
                    <label className="block font-bold text-gray-700 uppercase mb-1">Valor de Compra (R$)</label>
                    <input
                      type="text"
                      placeholder="R$ 0"
                      value={formVeiculo.valorCompra}
                      onChange={(e) => handlePriceChange(e.target.value, "valorCompra")}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white font-bold focus:border-brand-blue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Data Entrada</label>
                    <input
                      type="date"
                      value={formVeiculo.dataEntrada}
                      onChange={(e) => setFormVeiculo(prev => ({ ...prev, dataEntrada: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Status Pátio</label>
                    <select
                      value={formVeiculo.status}
                      onChange={(e) => setFormVeiculo(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:border-brand-blue"
                    >
                      <option value="Disponível">Disponível</option>
                      <option value="Em Preparação">Em Preparação</option>
                      <option value="Vendido">Vendido</option>
                      <option value="Em processo de Transf.">Em processo de Transf.</option>
                      <option value="Transferido">Transferido</option>
                      <option value="Transferência em aberto">Transferência em aberto</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formVeiculo.documentoPendente}
                      onChange={(e) => setFormVeiculo(prev => ({ ...prev, documentoPendente: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-350 text-brand-blue focus:ring-brand-blue"
                    />
                    <span className="font-bold text-gray-700">⚠️ Pendência de Documentação</span>
                  </label>
                </div>
              </div>

              {formError && (
                <p className="text-red-600 font-semibold bg-red-50 p-3 rounded-lg border border-red-100">{formError}</p>
              )}

              <div className="flex gap-4 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="border border-gray-300 text-gray-650 px-5 py-2.5 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-brand-blue text-white px-8 py-2.5 rounded-lg font-bold hover:opacity-90 transition-opacity"
                >
                  {formLoading ? "Salvando..." : "Confirmar Entrada"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
