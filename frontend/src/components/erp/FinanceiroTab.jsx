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
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Layers,
  AlertCircle,
  FileText,
  Wallet,
  Filter,
  DollarSign,
  User,
  HelpCircle
} from 'lucide-react';
import { useState, useEffect, useMemo } from "react";

const MESES = [
  { value: "0", label: "Janeiro" },
  { value: "1", label: "Fevereiro" },
  { value: "2", label: "Março" },
  { value: "3", label: "Abril" },
  { value: "4", label: "Maio" },
  { value: "5", label: "Junho" },
  { value: "6", label: "Julho" },
  { value: "7", label: "Agosto" },
  { value: "8", label: "Setembro" },
  { value: "9", label: "Outubro" },
  { value: "10", label: "Novembro" },
  { value: "11", label: "Dezembro" },
];

export default function FinanceiroTab({ isAdmin: propIsAdmin = false }) {
  const [custos, setCustos] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [recorrentes, setRecorrentes] = useState([]);
  const [totalCustosFixosMensais, setTotalCustosFixosMensais] = useState(0);
  const [isAdmin, setIsAdmin] = useState(Boolean(propIsAdmin));
  const effectiveIsAdmin = isAdmin || Boolean(propIsAdmin);
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Data atual de referência
  const agora = new Date();
  const mesAtualStr = String(agora.getMonth());
  const anoAtualStr = String(agora.getFullYear());

  // Navegação Principal de Abas
  // 'extrato' = Extrato & Fluxo Geral (Todas as Entradas e Saídas unificadas)
  // 'entradas' = Entradas & Recebimentos (Vendas de Veículos + Notas Promissórias a receber/recebidas)
  // 'veiculos' = Custos de Veículos (despesas de preparação, peças, oficina)
  // 'operacionais' = Custos Operacionais da Loja (aluguel, salários, água, luz, contas)
  const [activeMainTab, setActiveMainTab] = useState("extrato");

  // Sub-aba para Custos Operacionais (quando for Admin)
  // 'lancamentos' = Lançamentos do Mês / Período
  // 'recorrentes' = Configuração de Custos Fixos Recorrentes (Aluguel, Salários, etc.)
  const [activeOperacionalSubTab, setActiveOperacionalSubTab] = useState("lancamentos");

  // Filtros de Mês, Ano e Período
  const [filtroMes, setFiltroMes] = useState(mesAtualStr); // Padrão: Mês Atual
  const [filtroAno, setFiltroAno] = useState(anoAtualStr); // Padrão: Ano Atual
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Filtros Avançados de Busca
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState(""); // '' = Todos, 'entrada' = Entradas, 'promissoria' = Promissórias, 'saida' = Saídas
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
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

  // Resetar paginação ao alterar qualquer filtro
  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, filtroMes, filtroAno, dataInicio, dataFim, filtroTipo, filtroCategoria, filtroStatus, activeMainTab, activeOperacionalSubTab]);

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
        setVendas(finData.vendas || []);
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

  // Alternar Status (Pago <-> A Pagar para custos; Recebido <-> A Receber para promissórias)
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

  // Identificador de Nota Promissória (Recebimento de Venda)
  const isPromissoria = (c) => {
    return Boolean(
      c.categoria === "Promissória" ||
      c.categoria === "Nota Promissória" ||
      c.origem === "Venda" ||
      c.descricao?.toLowerCase().startsWith("nota promissória")
    );
  };

  // Identificador de Custo de Veículo (Despesa real de oficina/estoque, exceto promissória)
  const isCustoVeiculo = (c) => {
    if (isPromissoria(c)) return false;
    return Boolean(
      c.despesaVeiculo ||
      c.origem === "Estoque" ||
      c.origem === "Pós Venda" ||
      c.descricao?.toLowerCase().startsWith("despesa placa:")
    );
  };

  // Consolidar todas as movimentações financeiras (Vendas + Promissórias a receber/recebidas + Saídas dos Custos)
  const todasMovimentacoes = useMemo(() => {
    const lista = [];

    // 1. Inserir ENTRADAS DIRETAS (Vendas de Veículos)
    vendas.forEach(v => {
      const valorVenda = parseFloat(v.valorVendaVeiculo) || 0;
      const valorRetorno = parseFloat(v.valorRetornoBancario) || 0;
      const valorTotalEntrada = valorVenda + valorRetorno;
      const compradorNome = v.cliente?.nome || v.contratoPayload?.buyerName || "Cliente";

      lista.push({
        id: `venda-${v.id}`,
        tipo: "entrada",
        isPromissoria: false,
        tipoLabel: "Entrada (Venda)",
        categoria: "Venda de Veículo",
        descricao: `Venda ${v.veiculo ? `${v.veiculo.marca} ${v.veiculo.modelo} [${v.veiculo.placa || 'SEM PLACA'}]` : 'Veículo'}${compradorNome ? ` • Comprador: ${compradorNome}` : ''}`,
        detalheSecundario: valorRetorno > 0 ? `Venda: R$ ${valorVenda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} + Retorno Bancário: R$ ${valorRetorno.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : null,
        data: v.dataVenda ? new Date(v.dataVenda) : (v.createdAt ? new Date(v.createdAt) : new Date()),
        dataRaw: v.dataVenda || v.createdAt,
        valor: valorTotalEntrada,
        valorVenda,
        valorRetorno,
        status: "Recebido",
        isPago: true,
        origem: "Venda",
        veiculo: v.veiculo,
        cliente: v.cliente,
        contratoPayload: v.contratoPayload,
        rawVenda: v,
      });
    });

    // 2. Processar registros de CUSTOS / NOTAS PROMISSÓRIAS
    custos.forEach(c => {
      if (isPromissoria(c)) {
        // NOTA PROMISSÓRIA = ENTRADA / RECEBIMENTO (A Receber ou Recebido)
        const isRecebido = c.statusPagamento === "Recebido" || c.statusPagamento === "Pago";
        lista.push({
          id: `custo-${c.id}`,
          tipo: "entrada",
          isPromissoria: true,
          tipoLabel: "Entrada (Promissória)",
          categoria: "Nota Promissória",
          descricao: c.descricao,
          detalheSecundario: isRecebido ? "Parcela quitada / recebida" : "Recebimento pendente do cliente",
          data: c.dataVencimento ? new Date(c.dataVencimento) : (c.createdAt ? new Date(c.createdAt) : new Date()),
          dataRaw: c.dataVencimento || c.createdAt,
          valor: parseFloat(c.valor) || 0,
          status: isRecebido ? "Recebido" : "A Receber",
          isPago: isRecebido,
          origem: "Venda",
          tipoCusto: "Promissória",
          veiculo: c.despesaVeiculo?.veiculo,
          rawCusto: c,
        });
      } else {
        // CUSTO / DESPESA REAL = SAÍDA (Veículo ou Operacional)
        const isVeic = isCustoVeiculo(c);
        const isPago = c.statusPagamento === "Pago";
        lista.push({
          id: `custo-${c.id}`,
          tipo: "saida",
          isPromissoria: false,
          tipoLabel: isVeic ? "Saída (Veículo)" : "Saída (Operacional)",
          categoria: c.categoria || "Geral",
          descricao: c.descricao,
          detalheSecundario: c.recorrenteId ? "Custo Fixo Recorrente Mensal" : null,
          data: c.dataVencimento ? new Date(c.dataVencimento) : (c.createdAt ? new Date(c.createdAt) : new Date()),
          dataRaw: c.dataVencimento || c.createdAt,
          valor: parseFloat(c.valor) || 0,
          status: isPago ? "Pago" : "A Pagar",
          isPago: isPago,
          origem: c.origem || (isVeic ? "Estoque" : "Operacional"),
          tipoCusto: c.tipo || "Fixo",
          veiculo: c.despesaVeiculo?.veiculo,
          recorrenteId: c.recorrenteId,
          rawCusto: c,
        });
      }
    });

    // Ordenação decrescente por data
    return lista.sort((a, b) => b.data - a.data);
  }, [vendas, custos]);

  // Lista de anos disponíveis calculada dinamicamente
  const anosDisponiveis = useMemo(() => {
    const anos = new Set();
    const anoAtual = new Date().getFullYear();
    anos.add(anoAtual);
    anos.add(anoAtual - 1);
    anos.add(anoAtual + 1);

    todasMovimentacoes.forEach(m => {
      if (m.data instanceof Date && !isNaN(m.data.getTime())) {
        anos.add(m.data.getFullYear());
      }
    });

    return Array.from(anos).sort((a, b) => b - a);
  }, [todasMovimentacoes]);

  // Filtragem das movimentações de acordo com a aba selecionada e filtros de busca/data
  const movimentacoesFiltradas = useMemo(() => {
    return todasMovimentacoes.filter(m => {
      // 1. Filtro pela Aba Ativa
      if (activeMainTab === "entradas" && m.tipo !== "entrada") {
        return false;
      }
      if (activeMainTab === "veiculos") {
        if (m.tipo !== "saida" || !isCustoVeiculo(m.rawCusto)) {
          return false;
        }
      }
      if (activeMainTab === "operacionais") {
        if (m.tipo !== "saida" || isCustoVeiculo(m.rawCusto) || isPromissoria(m.rawCusto)) {
          return false;
        }
      }

      // 2. Filtro de Tipo de Movimentação (dentro do Extrato)
      if (filtroTipo === "entrada" && m.tipo !== "entrada") return false;
      if (filtroTipo === "promissoria" && !m.isPromissoria) return false;
      if (filtroTipo === "saida" && m.tipo !== "saida") return false;

      // 3. Filtro de Texto / Busca Geral
      const termo = busca.toLowerCase().trim();
      if (termo) {
        const desc = (m.descricao || "").toLowerCase();
        const cat = (m.categoria || "").toLowerCase();
        const placa = (m.veiculo?.placa || "").toLowerCase();
        const modelo = (m.veiculo?.modelo || "").toLowerCase();
        const marca = (m.veiculo?.marca || "").toLowerCase();
        const clienteNome = (m.cliente?.nome || "").toLowerCase();
        const clienteCpf = (m.cliente?.cpfCnpj || "").toLowerCase();

        const match = desc.includes(termo) ||
          cat.includes(termo) ||
          placa.includes(termo) ||
          modelo.includes(termo) ||
          marca.includes(termo) ||
          clienteNome.includes(termo) ||
          clienteCpf.includes(termo);

        if (!match) return false;
      }

      // 4. Filtro por Categoria
      if (filtroCategoria && m.categoria !== filtroCategoria) {
        return false;
      }

      // 5. Filtro por Status
      if (filtroStatus) {
        if (filtroStatus === "Recebido" && (!m.isPago || m.tipo !== "entrada")) return false;
        if (filtroStatus === "A Receber" && (m.isPago || m.tipo !== "entrada")) return false;
        if (filtroStatus === "Pago" && (!m.isPago || m.tipo !== "saida")) return false;
        if (filtroStatus === "A Pagar" && (m.isPago || m.tipo !== "saida")) return false;
      }

      // 6. Filtro por Data (Período de Datas Personalizado ou Mês/Ano)
      if (dataInicio || dataFim) {
        const dInicio = dataInicio ? new Date(dataInicio + "T00:00:00Z") : null;
        const dFim = dataFim ? new Date(dataFim + "T23:59:59Z") : null;
        const dt = m.data;
        if (dt) {
          if (dInicio && dt < dInicio) return false;
          if (dFim && dt > dFim) return false;
        }
      } else {
        // Se não tem período de datas específico preenchido, usa Filtro de Mês e Ano
        if (filtroAno) {
          const anoMov = m.data.getFullYear();
          if (anoMov !== parseInt(filtroAno)) return false;
        }
        if (filtroMes !== "") {
          const mesMov = m.data.getMonth(); // 0 a 11
          if (mesMov !== parseInt(filtroMes)) return false;
        }
      }

      return true;
    });
  }, [todasMovimentacoes, activeMainTab, filtroTipo, busca, filtroCategoria, filtroStatus, dataInicio, dataFim, filtroAno, filtroMes]);

  // Métricas / KPIs calculados com base no filtro atual
  const metricas = useMemo(() => {
    let totalEntradasRecebidas = 0;
    let totalRecebimentosPendentes = 0;
    let qtdVendas = 0;
    let qtdPromissoriasPendentes = 0;
    let qtdPromissoriasRecebidas = 0;
    let totalSaidas = 0;
    let totalSaidasPagas = 0;
    let totalSaidasPendentes = 0;

    movimentacoesFiltradas.forEach(m => {
      if (m.tipo === "entrada") {
        if (m.isPago) {
          totalEntradasRecebidas += m.valor;
          if (m.isPromissoria) qtdPromissoriasRecebidas += 1;
          else qtdVendas += 1;
        } else {
          totalRecebimentosPendentes += m.valor;
          if (m.isPromissoria) qtdPromissoriasPendentes += 1;
        }
      } else {
        totalSaidas += m.valor;
        if (m.isPago) {
          totalSaidasPagas += m.valor;
        } else {
          totalSaidasPendentes += m.valor;
        }
      }
    });

    const totalEntradasGeral = totalEntradasRecebidas + totalRecebimentosPendentes;
    const saldoLiquidoRealizado = totalEntradasRecebidas - totalSaidasPagas;
    const saldoLiquidoProjetado = totalEntradasGeral - totalSaidas;

    return {
      totalEntradasRecebidas,
      totalRecebimentosPendentes,
      totalEntradasGeral,
      qtdVendas,
      qtdPromissoriasPendentes,
      qtdPromissoriasRecebidas,
      totalSaidas,
      totalSaidasPagas,
      totalSaidasPendentes,
      saldoLiquidoRealizado,
      saldoLiquidoProjetado,
      totalMovimentacoes: movimentacoesFiltradas.length,
    };
  }, [movimentacoesFiltradas]);

  // Lista de Categorias Únicas presentes nas movimentações
  const categoriasDisponiveis = useMemo(() => {
    const cats = new Set();
    todasMovimentacoes.forEach(m => {
      if (m.categoria) cats.add(m.categoria);
    });
    return Array.from(cats).sort();
  }, [todasMovimentacoes]);

  // Paginação
  const totalPaginas = Math.ceil(movimentacoesFiltradas.length / ITENS_POR_PAGINA) || 1;
  const inicioIndex = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const fimIndex = inicioIndex + ITENS_POR_PAGINA;
  const movimentacoesPaginadas = movimentacoesFiltradas.slice(inicioIndex, fimIndex);

  // Label do mês e ano filtrado para exibição nos cabeçalhos
  const mesLabelAtual = filtroMes !== "" ? MESES.find(m => m.value === filtroMes)?.label : "Todos os Meses";
  const periodoLabelTexto = (dataInicio || dataFim)
    ? `Período personalizado (${dataInicio ? new Date(dataInicio + "T00:00:00Z").toLocaleDateString("pt-BR") : "Início"} até ${dataFim ? new Date(dataFim + "T23:59:59Z").toLocaleDateString("pt-BR") : "Fim"})`
    : `${mesLabelAtual} de ${filtroAno || "Todos os Anos"}`;

  return (
    <div className="space-y-6 text-gray-800 animate-fade-in">
      
      {/* HEADER PRINCIPAL DO FINANCEIRO */}
      <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <h4 className="font-extrabold text-brand-blue dark:text-blue-400 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
            <CircleDollarSign className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" />
            Central Financeira & Fluxo de Caixa Geral
          </h4>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
            Gestão integrada de vendas de veículos, notas promissórias parceladas, despesas de estoque e custos operacionais.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
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
            <span>Novo Lançamento de Custo</span>
          </button>
        </div>
      </div>

      {/* KPI STATS CARDS (FLUXO DE CAIXA COMPLETO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* CARD 1: Entradas Recebidas (Vendas & Pagamentos) */}
        <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              Entradas Recebidas
            </span>
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            + R$ {metricas.totalEntradasRecebidas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block font-medium">
            {metricas.qtdVendas} venda{metricas.qtdVendas === 1 ? "" : "s"}
            {metricas.qtdPromissoriasRecebidas > 0 ? ` • ${metricas.qtdPromissoriasRecebidas} promissória(s) quitada(s)` : ""}
          </span>
        </div>

        {/* CARD 2: Recebimentos Pendentes (Promissórias A Receber) */}
        <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              Recebimentos Pendentes (Promissórias)
            </span>
            <span className="p-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            + R$ {metricas.totalRecebimentosPendentes.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block font-medium">
            {metricas.qtdPromissoriasPendentes} parcela{metricas.qtdPromissoriasPendentes === 1 ? "" : "s"} a receber em {periodoLabelTexto}
          </span>
        </div>

        {/* CARD 3: Saídas (Custos & Despesas) */}
        <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              Saídas (Custos & Despesas)
            </span>
            <span className="p-1 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            - R$ {metricas.totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block font-medium">
            Pago: R$ {metricas.totalSaidasPagas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} • A Pagar: R$ {metricas.totalSaidasPendentes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* CARD 4: Balanço / Saldo Líquido do Período */}
        <div className={`rounded-2xl p-4 sm:p-5 shadow-sm border ${
          metricas.saldoLiquidoRealizado >= 0
            ? "bg-gradient-to-br from-slate-900 to-blue-950 text-white border-slate-800"
            : "bg-gradient-to-br from-rose-950 to-slate-900 text-white border-rose-900"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
              Balanço Líquido (Realizado)
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              metricas.saldoLiquidoRealizado >= 0 ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40" : "bg-rose-500/30 text-rose-300 border border-rose-500/40"
            }`}>
              {metricas.saldoLiquidoRealizado >= 0 ? "Superávit" : "Déficit"}
            </span>
          </div>
          <p className={`text-xl sm:text-2xl font-extrabold mt-1 ${metricas.saldoLiquidoRealizado >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {metricas.saldoLiquidoRealizado >= 0 ? "+ " : "" }R$ {metricas.saldoLiquidoRealizado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-blue-200/80 mt-1 block font-medium">
            Projetado c/ pendências: R$ {metricas.saldoLiquidoProjetado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* FILTROS INTELIGENTES (FILTRO POR MÊS, ANO, PERÍODO E BUSCA) */}
      <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5 transition-colors">
        
        {/* BARRA DE FILTRO POR MÊS & ANO (PRIORIDADE) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/60 dark:bg-slate-800/60 p-3 rounded-xl border border-blue-100/80 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-extrabold text-brand-blue dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-blue" />
              Filtrar por Mês:
            </span>

            {/* Seletor de Mês */}
            <select
              value={filtroMes}
              onChange={(e) => {
                setFiltroMes(e.target.value);
                // Limpa período personalizado para dar preferência ao mês
                setDataInicio("");
                setDataFim("");
              }}
              className="border border-blue-200 dark:border-slate-600 rounded-lg py-1.5 px-3 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold focus:outline-none focus:border-brand-blue"
            >
              <option value="">Todos os Meses</option>
              {MESES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} {m.value === mesAtualStr && filtroAno === anoAtualStr ? " (Mês Vigente)" : ""}
                </option>
              ))}
            </select>

            {/* Seletor de Ano */}
            <select
              value={filtroAno}
              onChange={(e) => {
                setFiltroAno(e.target.value);
                setDataInicio("");
                setDataFim("");
              }}
              className="border border-blue-200 dark:border-slate-600 rounded-lg py-1.5 px-3 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold focus:outline-none focus:border-brand-blue"
            >
              <option value="">Todos os Anos</option>
              {anosDisponiveis.map((ano) => (
                <option key={ano} value={String(ano)}>
                  Ano {ano}
                </option>
              ))}
            </select>

            {/* Atalho Mês Atual */}
            {(filtroMes !== mesAtualStr || filtroAno !== anoAtualStr || dataInicio || dataFim) && (
              <button
                onClick={() => {
                  setFiltroMes(mesAtualStr);
                  setFiltroAno(anoAtualStr);
                  setDataInicio("");
                  setDataFim("");
                }}
                className="bg-brand-blue text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-xs flex items-center gap-1"
                title="Voltar para o mês corrente"
              >
                <span>📅 Mês Atual ({MESES.find(m => m.value === mesAtualStr)?.label})</span>
              </button>
            )}

            {/* Ver Tudo */}
            {(filtroMes !== "" || filtroAno !== "") && (
              <button
                onClick={() => {
                  setFiltroMes("");
                  setFiltroAno("");
                  setDataInicio("");
                  setDataFim("");
                }}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-[11px] font-bold px-2 py-1 rounded-md transition-colors cursor-pointer"
              >
                Ver Todo o Histórico
              </button>
            )}
          </div>

          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
            Visualizando: <span className="font-extrabold text-brand-blue dark:text-blue-300">{periodoLabelTexto}</span>
          </div>
        </div>

        {/* LINHA DE FILTROS SECUNDÁRIOS: BUSCA, TIPO, CATEGORIA, STATUS E PERÍODO PERSONALIZADO */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Campo de Busca Geral */}
          <div className="flex-grow min-w-[220px]">
            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">
              <Search className="w-3.5 h-3.5 inline-block mr-1 text-brand-blue" />
              Pesquisar
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por placa, modelo, comprador, promissória, despesa..."
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

          {/* Filtro por Tipo de Movimentação */}
          <div className="w-full sm:w-auto min-w-[150px]">
            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-700 rounded-lg py-2 px-3 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-brand-blue"
            >
              <option value="">Todas as Movimentações</option>
              <option value="entrada">🟢 Apenas Entradas (Vendas & Promissórias)</option>
              <option value="promissoria">📜 Apenas Notas Promissórias</option>
              <option value="saida">🔴 Apenas Saídas (Custos & Despesas)</option>
            </select>
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
              <option value="Venda de Veículo">Venda de Veículo (Entrada)</option>
              <option value="Nota Promissória">Nota Promissória (Entrada)</option>
              {categoriasDisponiveis.filter(c => c !== "Venda de Veículo" && c !== "Nota Promissória").map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Status */}
          <div className="w-full sm:w-auto min-w-[140px]">
            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-700 rounded-lg py-2 px-3 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-brand-blue"
            >
              <option value="">Todos os Status</option>
              <option value="Recebido">✅ Recebido (Entrada)</option>
              <option value="A Receber">🕒 A Receber (Promissória Pendente)</option>
              <option value="Pago">✅ Pago (Despesa)</option>
              <option value="A Pagar">🟡 A Pagar (Despesa Pendente)</option>
            </select>
          </div>
        </div>

        {/* Período Personalizado (De / Até) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-150 dark:border-slate-700 w-full text-xs">
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-brand-blue" />
            Ou selecione Período de Datas Específico:
          </span>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 font-medium">De:</span>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => {
                setDataInicio(e.target.value);
                setFiltroMes("");
              }}
              className="border border-gray-300 dark:border-slate-700 rounded-lg py-1 px-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 font-medium">Até:</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => {
                setDataFim(e.target.value);
                setFiltroMes("");
              }}
              className="border border-gray-300 dark:border-slate-700 rounded-lg py-1 px-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-brand-blue"
            />
          </div>

          {(dataInicio || dataFim) && (
            <button
              onClick={() => { 
                setDataInicio(""); 
                setDataFim("");
                setFiltroMes(mesAtualStr);
                setFiltroAno(anoAtualStr);
              }}
              className="text-red-600 hover:text-red-800 text-[11px] font-bold bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              ✕ Limpar Período
            </button>
          )}
        </div>

      </div>

      {/* ABAS DE NAVEGAÇÃO */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-slate-700 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          
          {/* ABA 1: Extrato & Fluxo Geral (Todas as Entradas e Saídas) */}
          <button
            onClick={() => setActiveMainTab("extrato")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === "extrato"
                ? "bg-brand-blue text-white shadow-sm dark:bg-blue-600"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Extrato & Fluxo Geral</span>
          </button>

          {/* ABA 2: Entradas & Recebimentos (Vendas + Promissórias) */}
          <button
            onClick={() => setActiveMainTab("entradas")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === "entradas"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400 group-hover:text-white" />
            <span>Entradas & Recebimentos</span>
          </button>

          {/* ABA 3: Custos de Veículos */}
          <button
            onClick={() => setActiveMainTab("veiculos")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === "veiculos"
                ? "bg-brand-blue text-white shadow-sm dark:bg-blue-600"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50"
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Custos de Veículos</span>
          </button>

          {/* ABA 4: Custos Operacionais */}
          <button
            onClick={() => setActiveMainTab("operacionais")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === "operacionais"
                ? "bg-brand-blue text-white shadow-sm dark:bg-blue-600"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Custos Operacionais</span>
          </button>
        </div>

        {/* Sub-abas de Custos Operacionais (quando na aba operacionais e for Admin) */}
        {activeMainTab === "operacionais" && isAdmin && (
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveOperacionalSubTab("lancamentos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeOperacionalSubTab === "lancamentos"
                  ? "bg-white dark:bg-slate-900 text-brand-blue dark:text-white shadow-2xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lançamentos</span>
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
              <span>Custos Fixos Recorrentes</span>
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
                Estes custos são gerados automaticamente todo mês (aluguel, salários, contas fixas da loja).
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
                          {r.isSalario && <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0" title="Salário / Confidencial" />}
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
                          {r.ativo ? "Ativo (Mensal)" : "Inativo"}
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
        /* TABELA DE MOVIMENTAÇÕES (EXTRATO GERAL / ENTRADAS & PROMISSÓRIAS / CUSTOS DE VEÍCULOS / CUSTOS OPERACIONAIS) */
        <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-gray-50/50 dark:bg-slate-800/50">
            <div>
              <h4 className="text-xs font-extrabold text-brand-blue dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                {activeMainTab === "extrato" && (
                  <>
                    <BarChart2 className="w-4 h-4" />
                    <span>Extrato & Fluxo de Caixa Geral (Entradas, Promissórias e Saídas)</span>
                  </>
                )}
                {activeMainTab === "entradas" && (
                  <>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Entradas Financeiras & Promissórias Parceladas</span>
                  </>
                )}
                {activeMainTab === "veiculos" && (
                  <>
                    <Car className="w-4 h-4" />
                    <span>Custos e Despesas de Veículos (Preparação, Oficina, Peças)</span>
                  </>
                )}
                {activeMainTab === "operacionais" && (
                  <>
                    <Building className="w-4 h-4" />
                    <span>Custos Operacionais da Loja (Aluguel, Folha, Contas)</span>
                  </>
                )}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                Filtrado por: <strong>{periodoLabelTexto}</strong>
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-brand-blue/10 text-brand-blue dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 rounded-lg font-bold">
                {movimentacoesFiltradas.length} lançamento{movimentacoesFiltradas.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-300">
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Tipo</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Descrição / Detalhes</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Categoria</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Veículo / Vínculo</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Data</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Valor (R$)</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider">Status</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-gray-700 dark:text-gray-300 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-12 text-center text-gray-400 text-xs">
                      <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-brand-blue mx-auto mb-2"></div>
                      Carregando fluxo financeiro...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-red-600 text-xs font-semibold bg-red-50">{error}</td>
                  </tr>
                ) : movimentacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-12 text-center text-gray-400 text-xs font-medium">
                      Nenhuma movimentação financeira encontrada para os filtros selecionados ({periodoLabelTexto}).
                    </td>
                  </tr>
                ) : (
                  movimentacoesPaginadas.map((m) => {
                    const dataFmt = m.data instanceof Date && !isNaN(m.data.getTime())
                      ? m.data.toLocaleDateString("pt-BR", { timeZone: "UTC" })
                      : "-";
                    const isEntrada = m.tipo === "entrada";
                    const isProm = m.isPromissoria;
                    const veic = m.veiculo;

                    return (
                      <tr 
                        key={m.id} 
                        className={`hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                          isProm 
                            ? "bg-blue-50/20 dark:bg-blue-950/10"
                            : isEntrada 
                            ? "bg-emerald-50/20 dark:bg-emerald-950/10" 
                            : ""
                        }`}
                      >
                        {/* 1. Tipo (Entrada vs Promissória vs Saída) */}
                        <td className="p-3.5 whitespace-nowrap">
                          {isProm ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-300 dark:border-blue-800 shadow-2xs">
                              <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                              Promissória
                            </span>
                          ) : isEntrada ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                              Entrada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800 shadow-2xs">
                              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                              Saída
                            </span>
                          )}
                        </td>

                        {/* 2. Descrição / Detalhes */}
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white max-w-sm">
                          <div className="flex flex-col">
                            <span className="line-clamp-2">{m.descricao}</span>
                            {m.detalheSecundario && (
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">
                                {m.detalheSecundario}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Categoria */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isProm
                              ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-200"
                              : isEntrada 
                              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" 
                              : "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-200"
                          }`}>
                            {m.categoria}
                          </span>
                        </td>

                        {/* 4. Veículo / Vínculo */}
                        <td className="p-3.5 whitespace-nowrap">
                          {veic ? (
                            <div>
                              <span className="bg-brand-blue/10 text-brand-blue dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded font-mono text-[10px] font-extrabold uppercase">
                                {veic.placa || "SEM PLACA"}
                              </span>
                              <span className="block font-bold text-slate-800 dark:text-slate-200 text-[11px] mt-0.5">
                                {veic.marca} {veic.modelo}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 font-medium italic text-[11px]">Loja / Geral</span>
                          )}
                        </td>

                        {/* 5. Data */}
                        <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-brand-blue inline-block mr-1" />
                          {dataFmt}
                        </td>

                        {/* 6. Valor */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`font-extrabold text-sm ${
                            isEntrada 
                              ? "text-emerald-600 dark:text-emerald-400" 
                              : "text-rose-600 dark:text-rose-400"
                          }`}>
                            {isEntrada ? "+" : "-"} R$ {Number(m.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* 7. Status */}
                        <td className="p-3.5 whitespace-nowrap">
                          {isProm ? (
                            <button
                              onClick={() => handleToggleStatus(m.rawCusto?.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                                m.isPago
                                  ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-200"
                                  : "bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-200 border border-blue-300"
                              }`}
                              title="Clique para alternar entre Recebido e A Receber"
                            >
                              {m.isPago ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  <span>Recebido</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-blue-600" />
                                  <span>A Receber</span>
                                </>
                              )}
                            </button>
                          ) : isEntrada ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Recebido
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(m.rawCusto?.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                                m.isPago
                                  ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-200"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200"
                              }`}
                              title="Clique para alternar status entre Pago e A Pagar"
                            >
                              {m.isPago ? "Pago" : "A Pagar"}
                            </button>
                          )}
                        </td>

                        {/* 8. Ações */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          {isEntrada && !isProm ? (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800">
                              Venda Concluída
                            </span>
                          ) : (
                            <div className="flex justify-center items-center gap-1.5">
                              <button
                                onClick={() => startEditCusto(m.rawCusto)}
                                className="p-1.5 rounded-lg border border-brand-blue/40 text-brand-blue hover:bg-brand-blue hover:text-white transition-all cursor-pointer"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCusto(m.rawCusto?.id)}
                                className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {movimentacoesFiltradas.length > 0 && (
            <div className="bg-gray-50/80 dark:bg-slate-800/80 border-t border-gray-200 dark:border-slate-700 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-semibold text-[11px]">
                Mostrando <span className="font-extrabold text-slate-900 dark:text-white">{inicioIndex + 1}</span> a{" "}
                <span className="font-extrabold text-slate-900 dark:text-white">{Math.min(fimIndex, movimentacoesFiltradas.length)}</span> de{" "}
                <span className="font-extrabold text-brand-blue">{movimentacoesFiltradas.length}</span> lançamentos no período
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
                  {formCusto.id ? "Editar Lançamento" : "Novo Lançamento Financeiro"}
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
                    className={`py-2 rounded-lg font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formMode === "geral" ? "bg-white text-brand-blue shadow-xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Custo Operacional / Geral</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormMode("veiculo")}
                    className={`py-2 rounded-lg font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formMode === "veiculo" ? "bg-white text-brand-blue shadow-xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span>Custo de Veículo (Placa)</span>
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
                      placeholder="Ex: Troca de óleo, pastilhas, reparo de lataria..."
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
                      placeholder="Ex: Aluguel do pátio, Conta de energia Copel, Internet..."
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
                <p className="font-extrabold text-[10px] uppercase flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-700" />
                  Privacidade de Salários:
                </p>
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
