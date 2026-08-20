"use client";
import { CircleDollarSign, Plus, CheckCircle, Wrench, Car, BarChart2, Search, Handshake, Calendar, Pencil } from 'lucide-react';


import { useState, useEffect } from "react";

export default function FinanceiroTab() {
  const [custos, setCustos] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros de Busca
  const [busca, setBusca] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

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
    origem: "Operacional",
    categoria: "Geral",
    // vehicle fields
    veiculoId: "",
    categoriaVeiculo: "Mecânica",
  });

  async function fetchData() {
    setLoading(true);
    setError("");
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
            descricao: formCusto.descricao,
            valor: valorNum,
            dataDespesa: formCusto.dataVencimento,
            origem: "Estoque",
          }),
        });
      } else {
        // Geral (Custo Fixo/Variável/Operacional)
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
          origem: "Operacional",
          categoria: "Geral",
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
      dataVencimento: c.dataVencimento ? c.dataVencimento.split("T")[0] : new Date().toISOString().split("T")[0],
      statusPagamento: c.statusPagamento,
      tipo: c.tipo || "Fixo",
      origem: c.origem || "Operacional",
      categoria: c.categoria || "Geral",
      veiculoId: "",
      categoriaVeiculo: "Mecânica",
    });
    setFormError("");
    setShowForm(true);
  };

  const handleDeleteCusto = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este lançamento? (Caso seja uma despesa de veículo, ela também será removida do centro de custos dele)")) return;
    try {
      const res = await fetch("/api/admin/erp/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Erro ao excluir lançamento.");
      }
    } catch (err) {
      alert("Erro de rede.");
    }
  };

  // Função para inferir ou retornar a Origem amigável do Custo
  const getCustoOrigem = (c) => {
    if (c.origem) return c.origem;
    const desc = c.descricao?.toLowerCase() || "";
    if (desc.includes("pós venda") || desc.includes("pos venda")) return "Pós Venda";
    if (desc.startsWith("despesa placa:") || c.despesaVeiculo) return "Estoque";
    if (desc.includes("venda") || desc.includes("comissão") || desc.includes("retorno bancário")) return "Venda";
    return "Operacional";
  };

  // Função para inferir ou retornar a Categoria amigável do Custo
  const getCustoCategoria = (c) => {
    if (c.despesaVeiculo?.categoria) return c.despesaVeiculo.categoria;
    if (c.categoria && c.categoria !== "Geral") return c.categoria;
    
    const desc = c.descricao?.toLowerCase() || "";
    if (desc.includes("mecânica") || desc.includes("mecanica")) return "Mecânica";
    if (desc.includes("funilaria")) return "Funilaria";
    if (desc.includes("lavagem")) return "Lavagem";
    if (desc.includes("ipva")) return "IPVA";
    if (desc.includes("licenciamento")) return "Licenciamento";
    if (desc.includes("documento")) return "Documento";
    if (desc.includes("detalhamento")) return "Detalhamento";
    if (desc.includes("comissão") || desc.includes("venda")) return "Vendas / Comissões";
    return c.tipo ? `Operacional ${c.tipo}` : "Geral";
  };

  // Formatador de Data + Horário de Lançamento
  const formatDateTime = (isoString, fallbackDateStr) => {
    if (!isoString && !fallbackDateStr) return { date: "-", time: "-" };
    const dateObj = new Date(isoString || fallbackDateStr);
    if (isNaN(dateObj.getTime())) return { date: "-", time: "-" };

    const dateFormatted = dateObj.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const timeFormatted = dateObj.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

    return { date: dateFormatted, time: timeFormatted };
  };

  // Filtragem de Custos
  const custosFiltrados = custos.filter(c => {
    const termo = busca.toLowerCase().trim();
    const origem = getCustoOrigem(c);
    const categoria = getCustoCategoria(c);
    const placa = c.despesaVeiculo?.veiculo?.placa || "";
    const modelo = c.despesaVeiculo?.veiculo?.modelo || "";

    const matchBusca = !termo ||
      c.descricao?.toLowerCase().includes(termo) ||
      placa.toLowerCase().includes(termo) ||
      modelo.toLowerCase().includes(termo) ||
      origem.toLowerCase().includes(termo) ||
      categoria.toLowerCase().includes(termo);

    const matchOrigem = !filtroOrigem || origem === filtroOrigem;
    const matchCategoria = !filtroCategoria || categoria === filtroCategoria;
    const matchStatus = !filtroStatus || c.statusPagamento === filtroStatus;

    return matchBusca && matchOrigem && matchCategoria && matchStatus;
  });

  // Métricas
  const totalPago = custosFiltrados
    .filter(c => c.statusPagamento === "Pago")
    .reduce((acc, curr) => acc + parseFloat(curr.valor), 0);

  const totalPendente = custosFiltrados
    .filter(c => c.statusPagamento === "Pendente")
    .reduce((acc, curr) => acc + parseFloat(curr.valor), 0);

  const totalPosVenda = custosFiltrados
    .filter(c => getCustoOrigem(c) === "Pós Venda")
    .reduce((acc, curr) => acc + parseFloat(curr.valor), 0);

  const totalEstoque = custosFiltrados
    .filter(c => getCustoOrigem(c) === "Estoque")
    .reduce((acc, curr) => acc + parseFloat(curr.valor), 0);

  const totalGeral = totalPago + totalPendente;

  return (
    <div className="space-y-6 text-gray-800 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-extrabold text-brand-blue text-xs sm:text-sm uppercase tracking-wider">
            <CircleDollarSign className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Central de Custos e Financeiro Geral
          </h4>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
            Consolidação de todos os lançamentos: Pós-Venda, Preparação de Veículos, Vendas e Despesas Operacionais com data e horário de registro.
          </p>
        </div>
        <button
          onClick={() => {
            setFormCusto({
              id: "",
              descricao: "",
              valor: "",
              dataVencimento: new Date().toISOString().split("T")[0],
              statusPagamento: "Pago",
              tipo: "Fixo",
              origem: "Operacional",
              categoria: "Geral",
              veiculoId: "",
              categoriaVeiculo: "Mecânica",
            });
            setFormMode("geral");
            setFormError("");
            setShowForm(true);
          }}
          className="bg-brand-blue hover:opacity-90 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all w-full sm:w-auto cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Novo Lançamento de Custo
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
            <CheckCircle className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Total Pago
          </span>
          <p className="text-lg font-extrabold text-green-600 mt-1">
            R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
            ⏳ Total Pendente
          </span>
          <p className="text-lg font-extrabold text-amber-600 mt-1">
            R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
            <Wrench className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Custos Pós-Venda
          </span>
          <p className="text-lg font-extrabold text-purple-600 mt-1">
            R$ {totalPosVenda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
            <Car className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Prep. & Estoque
          </span>
          <p className="text-lg font-extrabold text-blue-600 mt-1">
            R$ {totalEstoque.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm col-span-2 md:col-span-1 bg-gray-50/70">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
            <BarChart2 className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Total Lançado
          </span>
          <p className="text-lg font-extrabold text-gray-900 mt-1">
            R$ {totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Busca por texto */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              <Search className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Buscar por Placa / Descrição / Veículo
            </label>
            <input
              type="text"
              placeholder="Digite a placa, serviço ou descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white text-slate-900 font-semibold placeholder-gray-400 focus:outline-none focus:border-brand-blue"
            />
          </div>

          {/* Filtro por Origem */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Origem do Custo
            </label>
            <select
              value={filtroOrigem}
              onChange={(e) => setFiltroOrigem(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
            >
              <option value="">Todas as Origens</option>
              <option value="Pós Venda"><Wrench className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Pós Venda</option>
              <option value="Estoque">🚗 Estoque / Preparação</option>
              <option value="Venda"><Handshake className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Venda</option>
              <option value="Operacional">🏢 Operacional / Fixo</option>
            </select>
          </div>

          {/* Filtro por Categoria */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Categoria
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
            >
              <option value="">Todas as Categorias</option>
              <option value="Mecânica">Mecânica</option>
              <option value="Funilaria">Funilaria</option>
              <option value="Lavagem">Lavagem</option>
              <option value="IPVA">IPVA</option>
              <option value="Documento">Documento</option>
              <option value="Licenciamento">Licenciamento</option>
              <option value="Detalhamento">Detalhamento</option>
              <option value="Vendas / Comissões">Vendas / Comissões</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          {/* Filtro por Status */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Status Pagamento
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
            >
              <option value="">Todos</option>
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Costs Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h4 className="text-xs font-bold text-brand-blue uppercase tracking-wider">
            📋 Registro Geral de Custos Operacionais & Veículos
          </h4>
          <span className="text-[10px] text-gray-400 font-medium">
            Exibindo {custosFiltrados.length} de {custos.length} lançamentos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500">
                <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Data / Hora Lançamento</th>
                <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Origem / Categoria</th>
                <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Descrição / Veículo</th>
                <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Vencimento / Data</th>
                <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Valor (R$)</th>
                <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Status</th>
                <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-400 text-xs">
                    <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-brand-blue mx-auto mb-2"></div>
                    Carregando dados financeiros...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-red-600 text-xs font-semibold bg-red-50">{error}</td>
                </tr>
              ) : custosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-400 text-xs font-medium">
                    Nenhum custo encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                custosFiltrados.map((c) => {
                  const origem = getCustoOrigem(c);
                  const categoria = getCustoCategoria(c);
                  const dtInfo = formatDateTime(c.createdAt, c.dataVencimento);
                  const dataVencFmt = c.dataVencimento ? new Date(c.dataVencimento).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "-";

                  // Badges de Origem
                  let origemBadgeStyle = "bg-gray-100 text-gray-700";
                  let origemIcon = "🏢";
                  if (origem === "Pós Venda") {
                    origemBadgeStyle = "bg-purple-100 text-purple-800 border border-purple-200";
                    origemIcon = (<Wrench className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" />);
                  } else if (origem === "Estoque") {
                    origemBadgeStyle = "bg-blue-100 text-blue-800 border border-blue-200";
                    origemIcon = (<Car className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" />);
                  } else if (origem === "Venda") {
                    origemBadgeStyle = "bg-emerald-100 text-emerald-800 border border-emerald-200";
                    origemIcon = (<Handshake className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" />);
                  }

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Data e Horário de Lançamento */}
                      <td className="p-3.5 text-xs text-gray-700 whitespace-nowrap">
                        <div className="font-bold text-gray-900 text-[11px] flex items-center gap-1">
                          <span><Calendar className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> {dtInfo.date}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 block font-mono mt-0.5">
                          🕒 {dtInfo.time}
                        </span>
                      </td>

                      {/* Origem / Categoria */}
                      <td className="p-3.5 text-xs">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${origemBadgeStyle}`}>
                            <span>{origemIcon}</span>
                            <span>{origem}</span>
                          </span>
                          <span className="block text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full w-max">
                            {categoria}
                          </span>
                        </div>
                      </td>

                      {/* Descrição / Veículo */}
                      <td className="p-3.5 text-xs font-semibold text-gray-900 max-w-xs">
                        <p className="line-clamp-2">{c.descricao}</p>
                        {c.despesaVeiculo?.veiculo && (
                          <span className="mt-1 inline-flex items-center gap-1 bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                            Placa: {c.despesaVeiculo.veiculo.placa} ({c.despesaVeiculo.veiculo.marca} {c.despesaVeiculo.veiculo.modelo})
                          </span>
                        )}
                      </td>

                      {/* Data Vencimento */}
                      <td className="p-3.5 text-xs text-gray-500 font-medium whitespace-nowrap">
                        <Calendar className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> {dataVencFmt}
                      </td>

                      {/* Valor */}
                      <td className="p-3.5 text-xs font-extrabold text-red-600 whitespace-nowrap">
                        - R$ {Number(c.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-xs whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase ${
                          c.statusPagamento === "Pago" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {c.statusPagamento}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex justify-center items-center gap-1.5">
                          {!c.descricao.startsWith("Despesa Placa:") && (
                            <button
                              onClick={() => startEditCusto(c)}
                              className="w-7 h-7 rounded-lg border border-brand-blue/40 text-brand-blue hover:bg-brand-blue hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                              title="Editar Custo"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCusto(c.id)}
                            className="w-7 h-7 rounded-lg border border-red-200 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            title="Excluir Custo"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Window Novo / Editar Lançamento de Custo */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 w-[95%] sm:w-full max-w-[550px] max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slide-in flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="font-extrabold text-sm text-brand-blue uppercase">
                {formCusto.id ? "Editar Lançamento" : "Novo Lançamento de Custo"}
              </h4>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Selector Geral ou Veículo */}
            {!formCusto.id && (
              <div className="flex bg-gray-100 rounded-lg p-1 text-[10px] font-bold border border-gray-200 select-none">
                <button
                  type="button"
                  onClick={() => { setFormMode("geral"); setFormError(""); }}
                  className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                    formMode === "geral" ? "bg-white text-brand-blue shadow-sm" : "text-gray-400"
                  }`}
                >
                  🏢 Custo Geral / Operacional
                </button>
                <button
                  type="button"
                  onClick={() => { setFormMode("veiculo"); setFormError(""); }}
                  className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                    formMode === "veiculo" ? "bg-white text-brand-blue shadow-sm" : "text-gray-400"
                  }`}
                >
                  <Car className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Custo por Veículo
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {formMode === "geral" ? (
                <>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Descrição / Operação *</label>
                    <input
                      type="text"
                      placeholder="Ex: Aluguel do Showroom, Energia, Comissão..."
                      value={formCusto.descricao}
                      onChange={(e) => setFormCusto(prev => ({ ...prev, descricao: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold placeholder-gray-400 focus:outline-none focus:border-brand-blue"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Origem *</label>
                      <select
                        value={formCusto.origem}
                        onChange={(e) => setFormCusto(prev => ({ ...prev, origem: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                      >
                        <option value="Operacional">Operacional</option>
                        <option value="Pós Venda">Pós Venda</option>
                        <option value="Venda">Venda</option>
                        <option value="Estoque">Estoque</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Categoria *</label>
                      <select
                        value={formCusto.categoria}
                        onChange={(e) => setFormCusto(prev => ({ ...prev, categoria: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                      >
                        <option value="Geral">Geral</option>
                        <option value="Mecânica">Mecânica</option>
                        <option value="Funilaria">Funilaria</option>
                        <option value="IPVA">IPVA</option>
                        <option value="Documento">Documento</option>
                        <option value="Licenciamento">Licenciamento</option>
                        <option value="Vendas / Comissões">Vendas / Comissões</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Veículo *</label>
                    <select
                      value={formCusto.veiculoId}
                      onChange={(e) => setFormCusto(prev => ({ ...prev, veiculoId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                      required
                    >
                      <option value="">Selecione o veículo...</option>
                      {veiculos.map(v => (
                        <option key={v.id} value={v.id}>
                          [{v.placa || "SEM PLACA"}] {v.marca} {v.modelo} ({v.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Categoria de Custo *</label>
                    <select
                      value={formCusto.categoriaVeiculo}
                      onChange={(e) => setFormCusto(prev => ({ ...prev, categoriaVeiculo: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
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
                    <label className="block font-bold text-gray-700 uppercase mb-1">Descrição / Observação</label>
                    <input
                      type="text"
                      placeholder="Ex: Troca de pastilhas, Reparo para-choque..."
                      value={formCusto.descricao}
                      onChange={(e) => setFormCusto(prev => ({ ...prev, descricao: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2 bg-white text-slate-900 font-medium placeholder-gray-400 focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Valor (R$) *</label>
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
                  <label className="block font-bold text-gray-700 uppercase mb-1">Data *</label>
                  <input
                    type="date"
                    value={formCusto.dataVencimento}
                    onChange={(e) => setFormCusto(prev => ({ ...prev, dataVencimento: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                    required
                  />
                </div>
              </div>

              {formMode === "geral" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Classificação</label>
                    <select
                      value={formCusto.tipo}
                      onChange={(e) => setFormCusto(prev => ({ ...prev, tipo: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
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
                      className="w-full border border-gray-300 rounded-lg p-2 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                    >
                      <option value="Pago">Pago</option>
                      <option value="Pendente">Pendente</option>
                    </select>
                  </div>
                </div>
              )}

              {formError && (
                <p className="text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-100">{formError}</p>
              )}

              <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-brand-blue text-white px-5 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {formLoading ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
