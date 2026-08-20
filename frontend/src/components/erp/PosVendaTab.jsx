"use client";
import { Wrench, Car, Search, Plus, Calendar, Eye, FileText, ClipboardList } from 'lucide-react';


import { useState, useEffect } from "react";

export default function PosVendaTab({ isAdmin = false }) {
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
  const [buscaPlacaModal, setBuscaPlacaModal] = useState("");
  const [formExpense, setFormExpense] = useState({
    veiculoId: "",
    categoria: "Mecânica",
    descricao: "",
    valor: "",
    dataDespesa: new Date().toISOString().split("T")[0],
  });

  // Modal Ver e Editar Custo Pós Venda
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [buscaPlacaEditModal, setBuscaPlacaEditModal] = useState("");
  const [editExpense, setEditExpense] = useState({
    id: "",
    veiculoId: "",
    categoria: "Mecânica",
    descricao: "",
    valor: "",
    dataDespesa: "",
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
          descricao: formExpense.descricao,
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
          descricao: "",
          valor: "",
          dataDespesa: new Date().toISOString().split("T")[0],
        });
        setBuscaPlacaModal("");
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

  const handleOpenViewModal = (d) => {
    setSelectedExpense(d);
    const dateFormatted = d.dataDespesa ? d.dataDespesa.split("T")[0] : new Date().toISOString().split("T")[0];
    const valorFormatted = "R$ " + Number(d.valor).toLocaleString("pt-BR");
    setEditExpense({
      id: d.id,
      veiculoId: d.veiculoId,
      categoria: d.categoria || "Mecânica",
      descricao: d.descricao || "",
      valor: valorFormatted,
      dataDespesa: dateFormatted,
    });
    setBuscaPlacaEditModal("");
    setEditError("");
    setShowViewModal(true);
  };

  const handleEditPriceChange = (val) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return setEditExpense(prev => ({ ...prev, valor: "" }));
    const formatted = "R$ " + Number(clean).toLocaleString("pt-BR");
    setEditExpense(prev => ({ ...prev, valor: formatted }));
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");

    if (!editExpense.veiculoId) {
      setEditError("Por favor, selecione um veículo.");
      setEditLoading(false);
      return;
    }

    const valorNum = parseFloat(editExpense.valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());
    if (isNaN(valorNum) || valorNum <= 0) {
      setEditError("Informe um valor válido.");
      setEditLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/erp/despesas-veiculos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editExpense.id,
          veiculoId: editExpense.veiculoId,
          categoria: editExpense.categoria,
          descricao: editExpense.descricao,
          valor: valorNum,
          dataDespesa: editExpense.dataDespesa,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowViewModal(false);
        setSelectedExpense(null);
        fetchPosVendaData();
      } else {
        setEditError(data.error || "Erro ao salvar alterações no custo.");
      }
    } catch (err) {
      setEditError("Erro de comunicação com o servidor.");
    } finally {
      setEditLoading(false);
    }
  };

  // Filtragem de despesas na tabela
  const despesasFiltradas = despesas.filter(d => {
    const termo = busca.toLowerCase().trim();
    const matchBusca = !termo || 
      (d.veiculo?.placa && d.veiculo.placa.toLowerCase().includes(termo)) ||
      (d.veiculo?.modelo && d.veiculo.modelo.toLowerCase().includes(termo)) ||
      (d.veiculo?.marca && d.veiculo.marca.toLowerCase().includes(termo)) ||
      (d.categoria && d.categoria.toLowerCase().includes(termo)) ||
      (d.descricao && d.descricao.toLowerCase().includes(termo));

    const matchCategoria = !filtroCategoria || d.categoria === filtroCategoria;

    return matchBusca && matchCategoria;
  });

  // Veículos filtrados na busca do Modal de lançamento
  const veiculosFiltradosModal = veiculos.filter(v => {
    const term = buscaPlacaModal.toLowerCase().trim();
    if (!term) return true;
    return (
      (v.placa && v.placa.toLowerCase().includes(term)) ||
      (v.marca && v.marca.toLowerCase().includes(term)) ||
      (v.modelo && v.modelo.toLowerCase().includes(term))
    );
  });

  // Veículos filtrados na busca do Modal de edição
  const veiculosFiltradosEditModal = veiculos.filter(v => {
    const term = buscaPlacaEditModal.toLowerCase().trim();
    if (!term) return true;
    return (
      (v.placa && v.placa.toLowerCase().includes(term)) ||
      (v.marca && v.marca.toLowerCase().includes(term)) ||
      (v.modelo && v.modelo.toLowerCase().includes(term))
    );
  });

  // Métricas
  const totalPosVenda = despesasFiltradas.reduce((acc, d) => acc + Number(d.valor), 0);
  const totalLancamentos = despesasFiltradas.length;
  const veiculosUnicos = new Set(despesasFiltradas.map(d => d.veiculoId)).size;

  return (
    <div className="space-y-6 text-gray-800 animate-fade-in">
      {/* Top Banner / Cards */}
      <div className={`grid ${isAdmin ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"} gap-4`}>
        {isAdmin && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              <Wrench className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Total Custos Pós Venda
            </span>
            <p className="text-2xl font-extrabold text-red-600">
              R$ {totalPosVenda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-gray-400 mt-1 block">Somado automaticamente no Financeiro Geral</span>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            <ClipboardList className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Lançamentos Realizados
          </span>
          <p className="text-2xl font-extrabold text-brand-blue">
            {totalLancamentos}
          </p>
          <span className="text-[10px] text-gray-400 mt-1 block">Registros de peças, revisões, IPVA e documentos</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            <Car className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Veículos Com Pós Venda
          </span>
          <p className="text-2xl font-extrabold text-purple-600">
            {veiculosUnicos}
          </p>
          <span className="text-[10px] text-gray-400 mt-1 block">Carros atendidos no centro de custos</span>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-end justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-grow max-w-2xl">
          {/* Busca */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1 whitespace-nowrap truncate h-5">
              <Search className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Buscar
            </label>
            <input
              type="text"
              placeholder="Digite a placa, modelo ou descrição do serviço..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white text-slate-900 font-semibold placeholder-gray-400 focus:outline-none focus:border-brand-blue"
            />
          </div>

          {/* Filtro Categoria */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1 whitespace-nowrap truncate h-5">
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
              <option value="Documento">Documento</option>
              <option value="Licenciamento">Licenciamento</option>
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
              descricao: "",
              valor: "",
              dataDespesa: new Date().toISOString().split("T")[0],
            });
            setBuscaPlacaModal("");
            setFormError("");
            setShowModal(true);
          }}
          className="bg-brand-blue hover:opacity-90 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 h-[41px] shrink-0"
        >
          <Plus className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" />
          <span>Novo Custo por Veículo</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h4 className="text-xs font-bold text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" />
            <span>Histórico de Custos por Veículo (Pós Venda)</span>
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
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Categoria</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Descrição / Observação</th>
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
                      <td className="p-4 text-xs text-gray-600 font-medium max-w-xs truncate" title={d.descricao || ""}>
                        {d.descricao ? (
                          <span>{d.descricao}</span>
                        ) : (
                          <span className="text-gray-300 italic">Sem descrição</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-gray-500 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> {dataFmt}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-extrabold text-red-600 whitespace-nowrap">
                        - R$ {Number(d.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenViewModal(d)}
                            className="border border-brand-blue/40 text-brand-blue hover:bg-brand-blue hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-w-[85px] h-8 shadow-2xs"
                            title="Ver e Editar Custo"
                          >
                            <Eye className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px]" />
                            <span>Ver</span>
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(d.id)}
                            className="border border-red-200 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-w-[85px] h-8 shadow-2xs"
                            title="Excluir Custo"
                          >
                            <span className="text-sm font-black leading-none">✕</span>
                            <span>Excluir</span>
                          </button>
                        </div>
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
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 w-[95%] sm:w-full max-w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-brand-blue uppercase">
                <Wrench className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Registrar Custo por Veículo (Pós Venda)
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Pesquisa rápida por placa */}
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  🔎 Procurar Veículo pela Placa / Modelo
                </label>
                <input
                  type="text"
                  placeholder="Digite a placa (ex: ABC1D23) ou modelo..."
                  value={buscaPlacaModal}
                  onChange={(e) => setBuscaPlacaModal(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 text-slate-900 font-semibold focus:outline-none focus:border-brand-blue mb-2"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Veículo Selecionado *
                </label>
                <select
                  value={formExpense.veiculoId}
                  onChange={(e) => setFormExpense(prev => ({ ...prev, veiculoId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                  required
                >
                  <option value="">Selecione o veículo...</option>
                  
                  {veiculosFiltradosModal.map(v => {
                    const isVendido = v.status === "Vendido" || (v.vendas && v.vendas.length > 0);
                    const dataVendaStr = (v.vendas && v.vendas.length > 0 && v.vendas[0].dataVenda)
                      ? new Date(v.vendas[0].dataVenda).toLocaleDateString("pt-BR", { timeZone: "UTC" })
                      : null;
                    return (
                      <option key={v.id} value={v.id}>
                        [{v.placa || "SEM PLACA"}] {v.marca} {v.modelo} ({isVendido ? `Vendido${dataVendaStr ? ` em ${dataVendaStr}` : ""}` : `Em Estoque`})
                      </option>
                    );
                  })}
                </select>
                {veiculosFiltradosModal.length === 0 && (
                  <p className="text-[10px] text-amber-600 font-medium mt-1">
                    Nenhum veículo encontrado com o termo "{buscaPlacaModal}".
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Categoria de Custo *
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
                  <option value="Documento">Documento</option>
                  <option value="Licenciamento">Licenciamento</option>
                  <option value="Detalhamento">Detalhamento</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  📝 Descrição / Observação do Custo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Troca de óleo, reparo no para-choque, IPVA 2026 parcela 1..."
                  value={formExpense.descricao}
                  onChange={(e) => setFormExpense(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-medium placeholder-gray-400 focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">
                    Valor (R$) *
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
                    Data Despesa *
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
      {/* Modal Ver e Editar Custo Pós Venda */}
      {showViewModal && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 w-[95%] sm:w-full max-w-[550px] max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-brand-blue uppercase flex items-center gap-2">
                <Search className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Detalhes e Edição do Custo
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedExpense(null);
                }}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Banner de informações do veículo vinculado */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4 text-xs">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded font-mono text-xs font-bold mr-2">
                    {selectedExpense.veiculo?.placa || "SEM PLACA"}
                  </span>
                  <span className="font-extrabold text-slate-800">
                    {selectedExpense.veiculo?.marca} {selectedExpense.veiculo?.modelo}
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  selectedExpense.veiculo?.status === "Vendido" || (selectedExpense.veiculo?.vendas && selectedExpense.veiculo.vendas.length > 0)
                    ? "bg-purple-100 text-purple-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}>
                  {selectedExpense.veiculo?.status === "Vendido" || (selectedExpense.veiculo?.vendas && selectedExpense.veiculo.vendas.length > 0)
                    ? (<><Car className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm inline" /> Vendido</>)
                    : "🚘 Em Estoque"}
                </span>
              </div>
              <div className="text-[11px] text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  🗓️ Lançado em: <b>{selectedExpense.createdAt ? new Date(selectedExpense.createdAt).toLocaleDateString("pt-BR") : "-"}</b>
                </span>
                <span>
                  💼 Vinculado ao Financeiro Geral: <b className="text-emerald-600">Sincronizado</b>
                </span>
              </div>
            </div>

            <form onSubmit={handleEditFormSubmit} className="space-y-4 text-xs">
              {/* Pesquisa rápida por placa no modal de edição */}
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  🔎 Trocar Veículo (Placa / Modelo)
                </label>
                <input
                  type="text"
                  placeholder="Filtrar veículos pela placa ou modelo..."
                  value={buscaPlacaEditModal}
                  onChange={(e) => setBuscaPlacaEditModal(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 text-slate-900 font-semibold focus:outline-none focus:border-brand-blue mb-2"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Veículo *
                </label>
                <select
                  value={editExpense.veiculoId}
                  onChange={(e) => setEditExpense(prev => ({ ...prev, veiculoId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                  required
                >
                  <option value="">Selecione o veículo...</option>
                  {veiculosFiltradosEditModal.map(v => {
                    const isVendido = v.status === "Vendido" || (v.vendas && v.vendas.length > 0);
                    const dataVendaStr = (v.vendas && v.vendas.length > 0 && v.vendas[0].dataVenda)
                      ? new Date(v.vendas[0].dataVenda).toLocaleDateString("pt-BR", { timeZone: "UTC" })
                      : null;
                    return (
                      <option key={v.id} value={v.id}>
                        [{v.placa || "SEM PLACA"}] {v.marca} {v.modelo} ({isVendido ? `Vendido${dataVendaStr ? ` em ${dataVendaStr}` : ""}` : `Em Estoque`})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Categoria de Custo *
                </label>
                <select
                  value={editExpense.categoria}
                  onChange={(e) => setEditExpense(prev => ({ ...prev, categoria: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                  required
                >
                  <option value="Mecânica">Mecânica</option>
                  <option value="Funilaria">Funilaria</option>
                  <option value="Lavagem">Lavagem</option>
                  <option value="IPVA">IPVA</option>
                  <option value="Documento">Documento</option>
                  <option value="Licenciamento">Licenciamento</option>
                  <option value="Detalhamento">Detalhamento</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  📝 Descrição / Observação do Custo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Troca de óleo, reparo no para-choque..."
                  value={editExpense.descricao}
                  onChange={(e) => setEditExpense(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-medium placeholder-gray-400 focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="text"
                    placeholder="R$ 0"
                    value={editExpense.valor}
                    onChange={(e) => handleEditPriceChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-extrabold focus:outline-none focus:border-brand-blue"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">
                    Data Despesa *
                  </label>
                  <input
                    type="date"
                    value={editExpense.dataDespesa}
                    onChange={(e) => setEditExpense(prev => ({ ...prev, dataDespesa: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                    required
                  />
                </div>
              </div>

              {editError && (
                <p className="text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-100">
                  {editError}
                </p>
              )}

              <div className="flex gap-3 justify-between items-center pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteExpense(selectedExpense.id);
                    setShowViewModal(false);
                  }}
                  className="border border-red-200 text-red-600 hover:bg-red-50 px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer text-xs"
                >
                  ✕ Excluir Custo
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedExpense(null);
                    }}
                    className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="bg-brand-blue text-white px-5 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
                  >
                    {editLoading ? "Salvando..." : "💾 Salvar Alterações"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
