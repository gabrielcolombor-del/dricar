"use client";
import { 
  CircleDollarSign, 
  Plus, 
  CheckCircle, 
  Wrench, 
  Car, 
  BarChart2, 
  Search, 
  Handshake, 
  Calendar, 
  Pencil, 
  Trash2, 
  Building, 
  Settings, 
  Shield, 
  Clock, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  CreditCard,
  Layers,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function FinanceiroTab() {
  const { data: session } = useSession();
  const isSessionAdmin = session?.user?.role?.toLowerCase() === "admin";
  const [custos, setCustos] = useState([]);
  const [recorrentes, setRecorrentes] = useState([]);
  const [totalCustosFixosMensais, setTotalCustosFixosMensais] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const effectiveIsAdmin = isSessionAdmin || isAdmin;
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Navegação Principal de Abas
  // 'veiculos' = Registro de Custos de Veículos (despesas de veículos, preparação, promissórias)
  // 'operacionais' = Custos Operacionais da Loja (aluguel, salários, água, luz, etc.)
  const [activeMainTab, setActiveMainTab] = useState("veiculos");

  // Sub-aba para Custos Operacionais (quando for Admin)
  // 'lancamentos' = Lançamentos do Mês / Período
  // 'recorrentes' = Configuração de Custos Fixos Recorrentes (Aluguel, Salários, etc.)
  const [activeOperacionalSubTab, setActiveOperacionalSubTab] = useState("lancamentos");

  // Filtros de Busca
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 15;

  // Modal Lançamento de Custo Individual
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("geral"); // 'geral' ou 'veiculo'
  const [formCusto, setFormCusto] = useState({
    id: "",
    descricao: "",
    valor: "",
    dataVencimento: new Date().toISOString().split("T")[0],
    statusPagamento: "A Pagar",
    tipo: "Fixo",
    origem: "Operacional",
    categoria: "Geral",
    isFixoRecorrente: false,
    veiculoId: "",
    categoriaVeiculo: "Mecânica",
  });

  // Modal Gestão de Custo Fixo Recorrente (Exclusivo Administrador)
  const [showRecorrenteModal, setShowRecorrenteModal] = useState(false);
  const [recorrenteFormLoading, setRecorrenteFormLoading] = useState(false);
  const [recorrenteFormError, setRecorrenteFormError] = useState("");
  const [formRecorrente, setFormRecorrente] = useState({
    id: "",
    descricao: "",
    categoria: "Aluguel",
    valor: "",
    diaVencimento: "5",
    isSalario: false,
  });

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, filtroCategoria, filtroStatus, dataInicio, dataFim, activeMainTab, activeOperacionalSubTab]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const [financeiroRes, veiculosRes] = await Promise.all([
        fetch("/api/admin/erp/financeiro"),
        fetch("/api/admin/erp/veiculos")
      ]);

      if (financeiroRes.ok && veiculosRes.ok) {
        const finData = await financeiroRes.json();
        const veicData = await veiculosRes.json();
        
        setCustos(finData.custos || []);
        setRecorrentes(finData.recorrentes || []);
        setTotalCustosFixosMensais(finData.totalCustosFixosMensais || 0);
        setIsAdmin(Boolean(finData.isAdmin));
        setVeiculos(veicData || []);
      } else {
        setError("Erro ao carregar dados financeiros.");
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
    const formatted = "R$ " + (Number(clean) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    setFormCusto(prev => ({ ...prev, [field]: formatted }));
  };

  const handleRecorrentePriceChange = (val) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return setFormRecorrente(prev => ({ ...prev, valor: "" }));
    const formatted = "R$ " + (Number(clean) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    setFormRecorrente(prev => ({ ...prev, valor: formatted }));
  };

  // Salvar Lançamento Individual (Custo de Veículo ou Custo Operacional)
  const handleSubmitCusto = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const cleanPrice = formCusto.valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
    const valorNum = parseFloat(cleanPrice);
    if (isNaN(valorNum) || valorNum <= 0) {
      setFormError("Informe um valor válido.");
      setFormLoading(false);
      return;
    }

    try {
      let res;
      if (formMode === "veiculo") {
        if (!formCusto.veiculoId) {
          setFormError("Selecione o veículo responsável.");
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
        // Custo Operacional Geral
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
          statusPagamento: "A Pagar",
          tipo: "Fixo",
          origem: "Operacional",
          categoria: "Geral",
          isFixoRecorrente: false,
          veiculoId: "",
          categoriaVeiculo: "Mecânica",
        });
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

  // Salvar Custo Fixo Recorrente (Aluguel, Salários, etc. - Apenas Admin)
  const handleSubmitRecorrente = async (e) => {
    e.preventDefault();
    setRecorrenteFormLoading(true);
    setRecorrenteFormError("");

    const cleanPrice = formRecorrente.valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
    const valorNum = parseFloat(cleanPrice);
    if (isNaN(valorNum) || valorNum <= 0) {
      setRecorrenteFormError("Informe um valor mensal válido.");
      setRecorrenteFormLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/erp/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: formRecorrente.id ? "update_recorrente" : "create_recorrente",
          id: formRecorrente.id || undefined,
          descricao: formRecorrente.descricao,
          categoria: formRecorrente.categoria,
          valor: valorNum,
          diaVencimento: parseInt(formRecorrente.diaVencimento) || 5,
          isSalario: formRecorrente.isSalario || formRecorrente.categoria === "Salário",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowRecorrenteModal(false);
        setFormRecorrente({
          id: "",
          descricao: "",
          categoria: "Aluguel",
          valor: "",
          diaVencimento: "5",
          isSalario: false,
        });
        fetchData();
      } else {
        setRecorrenteFormError(data.error || "Erro ao salvar custo fixo.");
      }
    } catch (err) {
      setRecorrenteFormError("Erro ao conectar com o servidor.");
    } finally {
      setRecorrenteFormLoading(false);
    }
  };

  // Alternar Status de Pagamento (Pago <-> A Pagar)
  const handleToggleStatus = async (id) => {
    try {
      const res = await fetch("/api/admin/erp/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_status", id }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Erro ao alternar status:", err);
    }
  };

  // Alternar Ativo/Inativo Custo Recorrente
  const handleToggleRecorrente = async (id) => {
    try {
      const res = await fetch("/api/admin/erp/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_recorrente", id }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Erro ao alterar custo fixo:", err);
    }
  };

  // Excluir Lançamento
  const handleDeleteCusto = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;
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

  // Excluir Custo Recorrente
  const handleDeleteRecorrente = async (id) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este Custo Fixo Recorrente? Ele deixará de ser cobrado nos próximos meses.")) return;
    try {
      const res = await fetch("/api/admin/erp/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_recorrente", id }),
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Erro ao excluir custo fixo.");
      }
    } catch (err) {
      alert("Erro de rede.");
    }
  };

  // Iniciar edição de custo individual
  const startEditCusto = (c) => {
    setFormMode("geral");
    setFormCusto({
      id: c.id,
      descricao: c.descricao,
      valor: "R$ " + Number(c.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
      dataVencimento: c.dataVencimento ? c.dataVencimento.split("T")[0] : new Date().toISOString().split("T")[0],
      statusPagamento: c.statusPagamento || "A Pagar",
      tipo: c.tipo || "Fixo",
      origem: c.origem || "Operacional",
      categoria: c.categoria || "Geral",
      isFixoRecorrente: false,
      veiculoId: "",
      categoriaVeiculo: "Mecânica",
    });
    setFormError("");
    setShowForm(true);
  };

  // Iniciar edição de custo fixo recorrente
  const startEditRecorrente = (r) => {
    setFormRecorrente({
      id: r.id,
      descricao: r.descricao,
      categoria: r.categoria || "Aluguel",
      valor: "R$ " + Number(r.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
      diaVencimento: String(r.diaVencimento || 5),
      isSalario: Boolean(r.isSalario),
    });
    setRecorrenteFormError("");
    setShowRecorrenteModal(true);
  };

  // Auxiliares de Origem e Categoria
  const isCustoVeiculo = (c) => {
    return Boolean(
      c.despesaVeiculo ||
      c.origem === "Estoque" ||
      c.origem === "Pós Venda" ||
      c.origem === "Venda" ||
      c.categoria === "Promissória" ||
      c.descricao?.toLowerCase().startsWith("despesa placa:") ||
      c.descricao?.toLowerCase().startsWith("nota promissória")
    );
  };

  // Filtragem dos custos com base na aba ativa
  const custosDaAba = custos.filter(c => {
    if (activeMainTab === "veiculos") {
      return isCustoVeiculo(c);
    } else {
      return !isCustoVeiculo(c);
    }
  });

  const custosFiltrados = custosDaAba.filter(c => {
    const termo = busca.toLowerCase().trim();
    const placa = (c.despesaVeiculo?.veiculo?.placa || "").toLowerCase();
    const modelo = (c.despesaVeiculo?.veiculo?.modelo || "").toLowerCase();
    const marca = (c.despesaVeiculo?.veiculo?.marca || "").toLowerCase();
    const desc = (c.descricao || "").toLowerCase();
    const cat = (c.categoria || "").toLowerCase();

    const matchBusca = !termo ||
      desc.includes(termo) ||
      placa.includes(termo) ||
      modelo.includes(termo) ||
      marca.includes(termo) ||
      cat.includes(termo);

    const matchCategoria = !filtroCategoria || c.categoria === filtroCategoria;
    const matchStatus = !filtroStatus || (
      filtroStatus === "Pago" ? c.statusPagamento === "Pago" : c.statusPagamento !== "Pago"
    );

    let matchData = true;
    if (dataInicio || dataFim) {
      const dInicio = dataInicio ? new Date(dataInicio + "T00:00:00Z") : null;
      const dFim = dataFim ? new Date(dataFim + "T23:59:59Z") : null;
      const dt = c.dataVencimento ? new Date(c.dataVencimento) : null;
      matchData = dt ? ((!dInicio || dt >= dInicio) && (!dFim || dt <= dFim)) : true;
    }

    return matchBusca && matchCategoria && matchStatus && matchData;
  });

  // Métricas da aba atual
  const totalPagoAba = custosFiltrados
    .filter(c => c.statusPagamento === "Pago")
    .reduce((acc, curr) => acc + parseFloat(curr.valor), 0);

  const totalAPagarAba = custosFiltrados
    .filter(c => c.statusPagamento !== "Pago")
    .reduce((acc, curr) => acc + parseFloat(curr.valor), 0);

  const totalGeralAba = totalPagoAba + totalAPagarAba;

  // Paginação
  const totalPaginas = Math.ceil(custosFiltrados.length / ITENS_POR_PAGINA) || 1;
  const inicioIndex = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const fimIndex = inicioIndex + ITENS_POR_PAGINA;
  const custosPaginados = custosFiltrados.slice(inicioIndex, fimIndex);

  return (
    <div className="space-y-6 text-gray-800 animate-fade-in">
      
      {/* HEADER PRINCIPAL DO FINANCEIRO */}
      <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <h4 className="font-extrabold text-brand-blue dark:text-blue-400 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
            <CircleDollarSign className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" />
            Central Financeira & Gestão de Custos
          </h4>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
            Controle integrado de despesas de veículos, promissórias parceladas, custos operacionais e custos fixos recorrentes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && activeMainTab === "operacionais" && (
            <button
              onClick={() => {
                setFormRecorrente({
                  id: "",
                  descricao: "",
                  categoria: "Aluguel",
                  valor: "",
                  diaVencimento: "5",
                  isSalario: false,
                });
                setRecorrenteFormError("");
                setShowRecorrenteModal(true);
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>+ Custo Fixo Recorrente</span>
            </button>
          )}

          <button
            onClick={() => {
              setFormCusto({
                id: "",
                descricao: "",
                valor: "",
                dataVencimento: new Date().toISOString().split("T")[0],
                statusPagamento: "A Pagar",
                tipo: "Fixo",
                origem: activeMainTab === "veiculos" ? "Estoque" : "Operacional",
                categoria: activeMainTab === "veiculos" ? "Mecânica" : "Geral",
                isFixoRecorrente: false,
                veiculoId: "",
                categoriaVeiculo: "Mecânica",
              });
              setFormMode(activeMainTab === "veiculos" ? "veiculo" : "geral");
              setFormError("");
              setShowForm(true);
            }}
            className="bg-brand-blue hover:opacity-90 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${effectiveIsAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-3.5`}>
        {/* CARD 1: Total da Aba */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800">
          <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block mb-1">
            {activeMainTab === "veiculos" ? "🚗 Total Custos Veículos" : "🏢 Total Custos Operacionais"}
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-white">
            R$ {totalGeralAba.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-blue-200/80 mt-1.5 block font-medium">
            {custosFiltrados.length} lançamentos encontrados
          </span>
        </div>

        {/* CARD 2: Total Pago */}
        <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
            ✅ Total Pago
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            R$ {totalPagoAba.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-gray-400 mt-1.5 block font-medium">
            Lançamentos liquidados
          </span>
        </div>

        {/* CARD 3: Total A Pagar / Pendente */}
        <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
            ⏳ Total A Pagar / Pendente
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            R$ {totalAPagarAba.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-gray-400 mt-1.5 block font-medium">
            Aguardando pagamento
          </span>
        </div>

        {/* CARD 4: Custos Fixos Mensais (EXCLUSIVO PARA ADMINISTRADOR) */}
        {effectiveIsAdmin && (
          <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm border-l-4 border-l-purple-500">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
              🔄 Custos Fixos Mensais
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-purple-700 dark:text-purple-400">
              R$ {totalCustosFixosMensais.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-gray-400 mt-1.5 block font-medium">
              Aluguel, salários e obrigações mensais
            </span>
          </div>
        )}
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
        <div className="flex flex-wrap items-center gap-3 flex-grow max-w-4xl">
          {/* Campo de Busca */}
          <div className="flex-grow min-w-[220px]">
            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">
              <Search className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm inline-block mr-1" />
              Pesquisar
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={activeMainTab === "veiculos" ? "Buscar por placa, modelo, promissória, descrição..." : "Buscar por aluguel, conta, fornecedor..."}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-700 rounded-lg py-2 pl-8 pr-7 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium placeholder-gray-400 focus:outline-none focus:border-brand-blue"
              />
              <span className="absolute left-2.5 top-2 text-gray-400 text-xs">
                <Search className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" />
              </span>
              {busca && (
                <button
                  onClick={() => setBusca("")}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filtro por Categoria */}
          <div className="w-full sm:w-auto min-w-[150px]">
            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Categoria</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-700 rounded-lg py-2 px-3 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-brand-blue"
            >
              <option value="">Todas as Categorias</option>
              {activeMainTab === "veiculos" ? (
                <>
                  <option value="Mecânica">Mecânica</option>
                  <option value="Funilaria">Funilaria</option>
                  <option value="Promissória">Nota Promissória</option>
                  <option value="Lavagem">Lavagem</option>
                  <option value="IPVA">IPVA</option>
                  <option value="Documento">Documento</option>
                  <option value="Licenciamento">Licenciamento</option>
                  <option value="Detalhamento">Detalhamento</option>
                  <option value="Outros">Outros</option>
                </>
              ) : (
                <>
                  <option value="Aluguel">Aluguel</option>
                  <option value="Salário">{isAdmin ? "Salário" : "Mão de obra"}</option>
                  <option value="Água">Água</option>
                  <option value="Luz">Luz</option>
                  <option value="Internet">Internet</option>
                  <option value="Contabilidade">Contabilidade</option>
                  <option value="Marketing">Marketing / Tráfego</option>
                  <option value="Manutenção">Manutenção Predial</option>
                  <option value="Geral">Geral</option>
                  <option value="Outros">Outros</option>
                </>
              )}
            </select>
          </div>

          {/* Filtro por Status */}
          <div className="w-full sm:w-auto min-w-[130px]">
            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-700 rounded-lg py-2 px-3 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-brand-blue"
            >
              <option value="">Todos os Status</option>
              <option value="Pago">Pago</option>
              <option value="A Pagar">A Pagar / Pendente</option>
            </select>
          </div>

          {/* Filtro por Período */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-150 dark:border-slate-700 w-full text-xs">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Período de Vencimento:
            </span>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 font-medium">De:</span>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="border border-gray-300 dark:border-slate-700 rounded-lg py-1 px-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 font-medium">Até:</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="border border-gray-300 dark:border-slate-700 rounded-lg py-1 px-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-brand-blue"
              />
            </div>

            {(dataInicio || dataFim) && (
              <button
                onClick={() => { setDataInicio(""); setDataFim(""); }}
                className="text-red-600 hover:text-red-800 text-[11px] font-bold bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
              >
                ✕ Limpar Datas
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO (EM CIMA DO REGISTRO GERAL E EMBAIXO DOS FILTROS) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-slate-700 pb-1">
        <div className="flex items-center gap-2">
          {/* ABA 1: Custos de Veículos */}
          <button
            onClick={() => setActiveMainTab("veiculos")}
            className={`px-5 py-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === "veiculos"
                ? "bg-brand-blue text-white shadow-sm dark:bg-blue-600"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50"
            }`}
          >
            <Car className="w-4 h-4" />
            <span>🚗 Registro de Custos de Veículos</span>
          </button>

          {/* ABA 2: Custos Operacionais */}
          <button
            onClick={() => setActiveMainTab("operacionais")}
            className={`px-5 py-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === "operacionais"
                ? "bg-brand-blue text-white shadow-sm dark:bg-blue-600"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>🏢 Custos Operacionais</span>
          </button>
        </div>

        {/* Sub-abas de Custos Operacionais (quando na aba operacionais e for Admin) */}
        {activeMainTab === "operacionais" && isAdmin && (
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveOperacionalSubTab("lancamentos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeOperacionalSubTab === "lancamentos"
                  ? "bg-white dark:bg-slate-900 text-brand-blue dark:text-white shadow-2xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              📑 Lançamentos do Mês
            </button>
            <button
              onClick={() => setActiveOperacionalSubTab("recorrentes")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeOperacionalSubTab === "recorrentes"
                  ? "bg-purple-700 text-white shadow-2xs"
                  : "text-purple-700 dark:text-purple-400 hover:bg-purple-50"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>⚙️ Custos Fixos Recorrentes</span>
            </button>
          </div>
        )}
      </div>

      {/* CONTEÚDO DA ABA SELECIONADA */}

      {/* SUB-ABA DE CUSTOS FIXOS RECORRENTES (EXCLUSIVO ADMINISTRADOR) */}
      {activeMainTab === "operacionais" && isAdmin && activeOperacionalSubTab === "recorrentes" ? (
        <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
          <div className="p-4 bg-purple-50/80 dark:bg-purple-950/40 border-b border-purple-100 dark:border-purple-900/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h4 className="font-extrabold text-purple-900 dark:text-purple-200 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-purple-700" />
                Configuração de Custos Fixos Recorrentes (Mensais)
              </h4>
              <p className="text-[11px] text-purple-800 dark:text-purple-300 font-medium mt-0.5">
                Estes custos são cobrados automaticamente todo mês com o mesmo valor (aluguel, salários, contas fixas).
              </p>
            </div>

            <button
              onClick={() => {
                setFormRecorrente({
                  id: "",
                  descricao: "",
                  categoria: "Aluguel",
                  valor: "",
                  diaVencimento: "5",
                  isSalario: false,
                });
                setRecorrenteFormError("");
                setShowRecorrenteModal(true);
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Custo Fixo</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-300">
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Descrição do Custo Fixo</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Categoria</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Dia Vencimento</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Valor Mensal</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Status</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-gray-700 dark:text-gray-300 text-xs">
                {recorrentes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-gray-400 text-xs">
                      Nenhum custo fixo recorrente cadastrado. Clique em <strong>Cadastrar Custo Fixo</strong> para adicionar aluguel, salários ou outras contas mensais.
                    </td>
                  </tr>
                ) : (
                  recorrentes.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {r.isSalario && <span className="text-xs">👤</span>}
                          <span>{r.descricao}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold">
                        <span className="bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                          {r.categoria}
                        </span>
                      </td>
                      <td className="p-3.5 font-extrabold text-slate-700 dark:text-slate-300">
                        Dia {r.diaVencimento} de cada mês
                      </td>
                      <td className="p-3.5 font-extrabold text-purple-700 dark:text-purple-400 text-sm">
                        R$ {Number(r.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleRecorrente(r.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all cursor-pointer ${
                            r.ativo
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                          title="Clique para ativar/desativar este custo fixo"
                        >
                          {r.ativo ? "● Ativo (Mensal)" : "○ Inativo"}
                        </button>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => startEditRecorrente(r)}
                            className="p-1.5 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 transition-all cursor-pointer"
                            title="Editar Custo Fixo"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecorrente(r.id)}
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                            title="Excluir Custo Fixo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      ) : (
        /* TABELA DE LANÇAMENTOS (CUSTOS DE VEÍCULOS OU CUSTOS OPERACIONAIS) */
        <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
            <h4 className="text-xs font-extrabold text-brand-blue dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              {activeMainTab === "veiculos" ? (
                <>
                  <Car className="w-4 h-4" />
                  <span>📋 Registro de Custos de Veículos (Preparação, Peças, Promissórias)</span>
                </>
              ) : (
                <>
                  <Building className="w-4 h-4" />
                  <span>📋 Registro de Custos Operacionais da Loja</span>
                </>
              )}
            </h4>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
              Exibindo {custosFiltrados.length} lançamentos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-300">
                  {activeMainTab === "veiculos" ? (
                    <>
                      <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Veículo / Placa</th>
                      <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Categoria</th>
                      <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Descrição / Parcela</th>
                      <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Vencimento</th>
                      <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Valor (R$)</th>
                      <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Status</th>
                      <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-center">Ações</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Descrição do Custo</th>
                      <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Categoria</th>
                      <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Tipo</th>
                      <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Vencimento</th>
                      <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Valor (R$)</th>
                      <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Status</th>
                      <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-center">Ações</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-gray-700 dark:text-gray-300 text-xs">
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
                      Nenhum lançamento encontrado para os filtros selecionados nesta aba.
                    </td>
                  </tr>
                ) : (
                  custosPaginados.map((c) => {
                    const dataVencFmt = c.dataVencimento ? new Date(c.dataVencimento).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "-";
                    const isPago = c.statusPagamento === "Pago";

                    const veic = c.despesaVeiculo?.veiculo;

                    return (
                      <tr key={c.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        {activeMainTab === "veiculos" ? (
                          <>
                            {/* Veículo / Placa */}
                            <td className="p-3.5">
                              {veic ? (
                                <div>
                                  <span className="bg-brand-blue/10 text-brand-blue dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded font-mono text-[11px] font-extrabold uppercase">
                                    {veic.placa || "SEM PLACA"}
                                  </span>
                                  <span className="block font-extrabold text-slate-900 dark:text-white text-xs mt-1">
                                    {veic.marca} {veic.modelo}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400 font-medium italic">Veículo não vinculado</span>
                              )}
                            </td>

                            {/* Categoria */}
                            <td className="p-3.5">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                c.categoria === "Promissória"
                                  ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-200"
                              }`}>
                                {c.categoria}
                              </span>
                            </td>

                            {/* Descrição */}
                            <td className="p-3.5 font-medium max-w-xs text-slate-900 dark:text-white">
                              <p className="line-clamp-2">{c.descricao}</p>
                            </td>

                            {/* Vencimento */}
                            <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              <Calendar className="w-3.5 h-3.5 text-brand-blue inline-block mr-1" />
                              {dataVencFmt}
                            </td>

                            {/* Valor */}
                            <td className="p-3.5 font-extrabold text-red-600 dark:text-red-400 whitespace-nowrap text-sm">
                              - R$ {Number(c.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>

                            {/* Status */}
                            <td className="p-3.5 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleStatus(c.id)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                                  isPago
                                    ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-200"
                                    : "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200"
                                }`}
                                title="Clique para alternar status entre Pago e A Pagar"
                              >
                                {isPago ? "● Pago" : "○ A Pagar"}
                              </button>
                            </td>

                            {/* Ações */}
                            <td className="p-3.5 text-center whitespace-nowrap">
                              <div className="flex justify-center items-center gap-1.5">
                                <button
                                  onClick={() => startEditCusto(c)}
                                  className="p-1.5 rounded-lg border border-brand-blue/40 text-brand-blue hover:bg-brand-blue hover:text-white transition-all cursor-pointer"
                                  title="Editar"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCusto(c.id)}
                                  className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Descrição Operacional */}
                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-2">
                                {c.recorrenteId && (
                                  <span className="text-[9px] font-black bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded uppercase" title="Custo Fixo Recorrente Mensal">
                                    Fixo Mensal
                                  </span>
                                )}
                                <span>{c.descricao}</span>
                              </div>
                            </td>

                            {/* Categoria */}
                            <td className="p-3.5">
                              <span className="bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                                {c.categoria}
                              </span>
                            </td>

                            {/* Tipo */}
                            <td className="p-3.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                              {c.tipo || "Fixo"}
                            </td>

                            {/* Vencimento */}
                            <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              <Calendar className="w-3.5 h-3.5 text-brand-blue inline-block mr-1" />
                              {dataVencFmt}
                            </td>

                            {/* Valor */}
                            <td className="p-3.5 font-extrabold text-red-600 dark:text-red-400 whitespace-nowrap text-sm">
                              - R$ {Number(c.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>

                            {/* Status */}
                            <td className="p-3.5 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleStatus(c.id)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                                  isPago
                                    ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-200"
                                    : "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200"
                                }`}
                                title="Clique para alternar status entre Pago e A Pagar"
                              >
                                {isPago ? "● Pago" : "○ A Pagar"}
                              </button>
                            </td>

                            {/* Ações */}
                            <td className="p-3.5 text-center whitespace-nowrap">
                              <div className="flex justify-center items-center gap-1.5">
                                <button
                                  onClick={() => startEditCusto(c)}
                                  className="p-1.5 rounded-lg border border-brand-blue/40 text-brand-blue hover:bg-brand-blue hover:text-white transition-all cursor-pointer"
                                  title="Editar"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCusto(c.id)}
                                  className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {custosFiltrados.length > 0 && (
            <div className="bg-gray-50/80 dark:bg-slate-800/80 border-t border-gray-200 dark:border-slate-700 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-semibold text-[11px]">
                Mostrando <span className="font-extrabold text-slate-900 dark:text-white">{inicioIndex + 1}</span> a{" "}
                <span className="font-extrabold text-slate-900 dark:text-white">{Math.min(fimIndex, custosFiltrados.length)}</span> de{" "}
                <span className="font-extrabold text-brand-blue">{custosFiltrados.length}</span> lançamentos
              </span>

              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
                <button
                  onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                  disabled={paginaAtual === 1}
                  className="px-2.5 py-1 rounded-md border border-gray-300 font-bold bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Anterior
                </button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setPaginaAtual(page)}
                    className={`px-2.5 py-1 rounded-md border text-xs font-bold transition-all cursor-pointer ${
                      paginaAtual === page
                        ? "bg-brand-blue text-white border-brand-blue shadow-xs"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                  disabled={paginaAtual === totalPaginas}
                  className="px-2.5 py-1 rounded-md border border-gray-300 font-bold bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs cursor-pointer"
                >
                  Próximo <ChevronRight className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: NOVO / EDITAR LANÇAMENTO DE CUSTO */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 animate-scale-in">
            <div className="bg-brand-blue p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-base">
                  {formCusto.id ? "Editar Lançamento de Custo" : "Novo Lançamento Financeiro"}
                </h3>
                <p className="text-xs text-blue-200 font-medium">Preencha os detalhes do custo ou despesa</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCusto} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-200 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Seletor de Modo: Geral vs Veículo */}
              {!formCusto.id && (
                <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormMode("geral")}
                    className={`py-2 rounded-lg font-extrabold transition-all cursor-pointer ${
                      formMode === "geral" ? "bg-white text-brand-blue shadow-xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    🏢 Custo Operacional / Geral
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormMode("veiculo")}
                    className={`py-2 rounded-lg font-extrabold transition-all cursor-pointer ${
                      formMode === "veiculo" ? "bg-white text-brand-blue shadow-xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    🚗 Custo de Veículo (Placa)
                  </button>
                </div>
              )}

              {formMode === "veiculo" ? (
                <>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Veículo Responsável *</label>
                    <select
                      value={formCusto.veiculoId}
                      onChange={(e) => setFormCusto({ ...formCusto, veiculoId: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                      required
                    >
                      <option value="">Selecione o veículo...</option>
                      {veiculos.map((v) => (
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
                      onChange={(e) => setFormCusto({ ...formCusto, categoriaVeiculo: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                    >
                      <option value="Mecânica">Mecânica</option>
                      <option value="Funilaria">Funilaria</option>
                      <option value="Promissória">Nota Promissória</option>
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
                      placeholder="Ex: Troca de óleo, pastilhas, parcela..."
                      value={formCusto.descricao}
                      onChange={(e) => setFormCusto({ ...formCusto, descricao: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-medium focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Descrição do Custo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Aluguel do pátio, Conta de energia Copel..."
                      value={formCusto.descricao}
                      onChange={(e) => setFormCusto({ ...formCusto, descricao: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-medium focus:outline-none focus:border-brand-blue"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Categoria Operacional *</label>
                    <select
                      value={formCusto.categoria}
                      onChange={(e) => setFormCusto({ ...formCusto, categoria: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                    >
                      <option value="Aluguel">Aluguel</option>
                      <option value="Salário">{isAdmin ? "Salário" : "Mão de obra"}</option>
                      <option value="Água">Água</option>
                      <option value="Luz">Luz</option>
                      <option value="Internet">Internet</option>
                      <option value="Contabilidade">Contabilidade</option>
                      <option value="Marketing">Marketing / Anúncios</option>
                      <option value="Manutenção">Manutenção Predial</option>
                      <option value="Geral">Geral</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Valor (R$) *</label>
                  <input
                    type="text"
                    required
                    placeholder="R$ 0,00"
                    value={formCusto.valor}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-extrabold text-sm focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={formCusto.dataVencimento}
                    onChange={(e) => setFormCusto({ ...formCusto, dataVencimento: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-bold focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Status do Pagamento *</label>
                <select
                  value={formCusto.statusPagamento}
                  onChange={(e) => setFormCusto({ ...formCusto, statusPagamento: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-extrabold focus:outline-none focus:border-brand-blue"
                >
                  <option value="A Pagar">A Pagar / Pendente</option>
                  <option value="Pago">Pago</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-xl bg-brand-blue text-white font-extrabold hover:opacity-90 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {formLoading ? "Salvando..." : "Salvar Lançamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR / EDITAR CUSTO FIXO RECORRENTE (ADMIN) */}
      {showRecorrenteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-200 animate-scale-in">
            <div className="bg-purple-800 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {formRecorrente.id ? "Editar Custo Fixo Recorrente" : "Novo Custo Fixo Recorrente"}
                </h3>
                <p className="text-xs text-purple-200 font-medium">Cobrança automática mensal fixa</p>
              </div>
              <button
                onClick={() => setShowRecorrenteModal(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRecorrente} className="p-6 space-y-4 text-xs">
              {recorrenteFormError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-200 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{recorrenteFormError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Descrição do Custo Fixo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aluguel do Prédio, Salário Vendedor 1, Copel..."
                  value={formRecorrente.descricao}
                  onChange={(e) => setFormRecorrente({ ...formRecorrente, descricao: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-bold focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Categoria *</label>
                  <select
                    value={formRecorrente.categoria}
                    onChange={(e) => setFormRecorrente({ ...formRecorrente, categoria: e.target.value, isSalario: e.target.value === "Salário" })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-purple-600"
                  >
                    <option value="Aluguel">Aluguel</option>
                    <option value="Salário">Salário</option>
                    <option value="Água">Água</option>
                    <option value="Luz">Luz</option>
                    <option value="Internet">Internet</option>
                    <option value="Contabilidade">Contabilidade</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Dia do Vencimento *</label>
                  <select
                    value={formRecorrente.diaVencimento}
                    onChange={(e) => setFormRecorrente({ ...formRecorrente, diaVencimento: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-bold focus:outline-none focus:border-purple-600"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>Todo dia {d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Valor Mensal (R$) *</label>
                <input
                  type="text"
                  required
                  placeholder="R$ 0,00"
                  value={formRecorrente.valor}
                  onChange={(e) => handleRecorrentePriceChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-extrabold text-sm focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 space-y-1">
                <p className="font-extrabold text-[10px] uppercase">🔒 Privacidade de Salários:</p>
                <p className="text-[10px] text-purple-900">
                  Custos categorizados como Salário são confidenciais e visíveis com detalhes somente para o Administrador. Para outros cargos, aparecerão consolidados como "Mão de obra".
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowRecorrenteModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={recorrenteFormLoading}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {recorrenteFormLoading ? "Salvando..." : "Salvar Custo Fixo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
