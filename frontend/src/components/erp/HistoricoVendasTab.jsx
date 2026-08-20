"use client";
import { 
  Search, 
  Calendar, 
  Package, 
  AlertTriangle, 
  Pencil, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Handshake, 
  Car, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  RotateCcw,
  CheckCircle,
  Clock,
  Plus,
  User
} from 'lucide-react';
import { useState, useEffect } from "react";
import { generateSalePdf } from "@/lib/generateSalePdf";

export default function HistoricoVendasTab({ isAdmin = false }) {
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVeiculo, setSelectedVeiculo] = useState(null);

  // Filtros
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroAno, setFiltroAno] = useState("");
  const [buscaGeral, setBuscaGeral] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 15;

  // Modal de Desfazer Venda
  const [vendaToUndo, setVendaToUndo] = useState(null);
  const [undoLoading, setUndoLoading] = useState(false);

  // Modal de Edição da Venda
  const [editingVenda, setEditingVenda] = useState(null);
  const [vendaForm, setVendaForm] = useState({
    id: "",
    veiculoId: "",
    marca: "",
    modelo: "",
    placa: "",
    anoMod: "",
    valorVendaVeiculo: "",
    dataVenda: "",
  });
  const [vendaFormLoading, setVendaFormLoading] = useState(false);

  // Modal/Form Lançamento Despesa no Veículo
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [formExpense, setFormExpense] = useState({
    categoria: "Mecânica",
    descricao: "",
    valor: "",
    dataDespesa: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroMarca, filtroAno, buscaGeral, dataInicio, dataFim]);

  async function fetchVeiculos() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/erp/veiculos");
      if (res.ok) {
        const data = await res.json();
        setVeiculos(data);
        if (selectedVeiculo) {
          const updated = data.find(v => v.id === selectedVeiculo.id);
          setSelectedVeiculo(updated || null);
        }
      } else {
        setError("Erro ao carregar histórico de vendas.");
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

  // Apenas veículos vendidos
  const veiculosVendidos = veiculos.filter(v => v.status === "Vendido" || (v.vendas && v.vendas.length > 0));

  const marcasUnicas = [...new Set(veiculosVendidos.map(v => v.marca))].sort();
  const anosUnicos = [...new Set(veiculosVendidos.map(v => v.anoMod))].sort((a,b) => b - a);

  // Filtragem
  const veiculosFiltrados = veiculosVendidos.filter(v => {
    const matchMarca = filtroMarca ? v.marca === filtroMarca : true;
    const matchAno = filtroAno ? v.anoMod === parseInt(filtroAno) : true;

    const term = buscaGeral.toLowerCase().trim();
    const venda = v.vendas && v.vendas.length > 0 ? v.vendas[0] : null;
    const compradorNome = (venda?.cliente?.nome || venda?.contratoPayload?.buyerName || "").toLowerCase();
    const compradorCpf = (venda?.cliente?.cpfCnpj || venda?.contratoPayload?.buyerCpfCnpj || "").toLowerCase();

    const matchBusca = !term ? true : (
      (v.placa && v.placa.toLowerCase().includes(term)) ||
      (v.marca && v.marca.toLowerCase().includes(term)) ||
      (v.modelo && v.modelo.toLowerCase().includes(term)) ||
      (v.renavam && v.renavam.toLowerCase().includes(term)) ||
      (v.chassi && v.chassi.toLowerCase().includes(term)) ||
      (compradorNome.includes(term)) ||
      (compradorCpf.includes(term)) ||
      (`${v.anoFab}/${v.anoMod}`.includes(term)) ||
      (v.despesas && v.despesas.some(d => d.categoria && d.categoria.toLowerCase().includes(term)))
    );

    let matchData = true;
    if (dataInicio || dataFim) {
      const dInicio = dataInicio ? new Date(dataInicio + "T00:00:00Z") : null;
      const dFim = dataFim ? new Date(dataFim + "T23:59:59Z") : null;

      const dtSaida = venda?.dataVenda ? new Date(venda.dataVenda) : null;
      matchData = dtSaida ? ((!dInicio || dtSaida >= dInicio) && (!dFim || dtSaida <= dFim)) : true;
    }

    return matchMarca && matchAno && matchBusca && matchData;
  });

  // Métricas Totais do Histórico
  const totalVendasCount = veiculosVendidos.length;

  // Apenas veículos vendidos que possuem valor agregado (> 0)
  const veiculosVendidosComValor = veiculosVendidos.filter(v => {
    const venda = v.vendas && v.vendas.length > 0 ? v.vendas[0] : null;
    const val = venda ? (parseFloat(venda.valorVendaVeiculo) || 0) + (parseFloat(venda.valorRetornoBancario) || 0) : 0;
    return val > 0;
  });

  const faturamentoTotal = veiculosVendidosComValor.reduce((acc, v) => {
    const venda = v.vendas[0];
    const val = (parseFloat(venda.valorVendaVeiculo) || 0) + (parseFloat(venda.valorRetornoBancario) || 0);
    return acc + val;
  }, 0);

  const totalCompra = veiculosVendidos.reduce((acc, v) => acc + (parseFloat(v.valorCompra) || 0), 0);
  const totalDespesas = veiculosVendidos.reduce((acc, v) => {
    const desp = v.despesas ? v.despesas.reduce((dAcc, d) => dAcc + (parseFloat(d.valor) || 0), 0) : 0;
    return acc + desp;
  }, 0);
  const lucroBruto = faturamentoTotal - totalCompra - totalDespesas;
  
  // Ticket Médio calculado usando apenas carros com valor agregado
  const ticketMedio = veiculosVendidosComValor.length > 0 ? faturamentoTotal / veiculosVendidosComValor.length : 0;

  // Paginação
  const totalPaginas = Math.ceil(veiculosFiltrados.length / ITENS_POR_PAGINA) || 1;
  const inicioIndex = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const fimIndex = inicioIndex + ITENS_POR_PAGINA;
  const veiculosPaginados = veiculosFiltrados.slice(inicioIndex, fimIndex);

  // Baixar Contrato
  const handleDownloadContract = async (v, venda) => {
    if (!venda || !venda.contratoPayload) {
      alert("Os dados completos do contrato não estão disponíveis para este veículo.");
      return;
    }

    try {
      const payload = venda.contratoPayload;
      await generateSalePdf({
        veiculo: v,
        buyerName: payload.buyerName,
        buyerCpfCnpj: payload.buyerCpfCnpj,
        buyerRg: payload.buyerRg,
        buyerEstadoCivil: payload.buyerEstadoCivil,
        buyerPhone: payload.buyerPhone,
        buyerAddress: payload.buyerAddress,
        buyerCidadeUf: payload.buyerCidadeUf,
        buyerCep: payload.buyerCep,
        salePrice: Number(venda.valorVendaVeiculo),
        salePriceExtenso: payload.salePriceExtenso,
        condicoesList: payload.condicoesList,
        segurosLista: payload.segurosLista,
        segurosValue: payload.segurosValue,
        saleDate: venda.dataVenda ? String(venda.dataVenda).split("T")[0] : "",
        combustivel: payload.combustivel,
        cor: payload.cor,
        quilometragem: payload.quilometragem,
        tipoVeiculo: payload.tipoVeiculo,
      });
    } catch (err) {
      console.error("Erro ao regenerar contrato:", err);
      alert("Erro ao baixar o contrato do veículo.");
    }
  };

  // Desfazer Venda
  const handleConfirmUndoVenda = async () => {
    if (!vendaToUndo) return;
    setUndoLoading(true);
    try {
      const res = await fetch("/api/admin/erp/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id: vendaToUndo.vendas?.[0]?.id,
          veiculoId: vendaToUndo.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setVendaToUndo(null);
        setSelectedVeiculo(null);
        await fetchVeiculos();
        alert("Venda desfeita com sucesso! O veículo retornou para a aba Estoque como 'Disponível' e está ativo no site.");
      } else {
        alert(data.error || "Erro ao desfazer venda.");
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setUndoLoading(false);
    }
  };

  // Lançar despesa no veículo vendido (caso precise de acerto posterior)
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!selectedVeiculo) return;

    const valorNum = parseFloat(formExpense.valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());
    if (isNaN(valorNum) || valorNum <= 0) {
      alert("Informe um valor de despesa válido.");
      return;
    }

    setExpenseLoading(true);
    try {
      const res = await fetch("/api/admin/erp/despesas-veiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          veiculoId: selectedVeiculo.id,
          categoria: formExpense.categoria,
          descricao: formExpense.descricao,
          valor: valorNum,
          dataDespesa: formExpense.dataDespesa,
        }),
      });

      if (res.ok) {
        setFormExpense({
          categoria: "Mecânica",
          descricao: "",
          valor: "",
          dataDespesa: new Date().toISOString().split("T")[0],
        });
        setShowExpenseForm(false);
        fetchVeiculos();
      } else {
        alert("Erro ao salvar despesa.");
      }
    } catch (err) {
      alert("Erro de rede.");
    } finally {
      setExpenseLoading(false);
    }
  };

  const calcularTotalDespesas = (veiculo) => {
    if (!veiculo || !veiculo.despesas) return 0;
    return veiculo.despesas.reduce((acc, curr) => acc + parseFloat(curr.valor), 0);
  };

  if (loading && veiculos.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl p-12 text-center shadow-sm animate-pulse">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-bold text-sm uppercase tracking-wider">
          Carregando histórico de vendas e contratos...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-800 animate-fade-in">
      
      {/* KPI CARDS (RESUMO DO HISTÓRICO) */}
      <div className={`grid ${isAdmin ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 max-w-xs"} gap-4`}>
        {/* CARD 1: Total de Vendas */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800 relative overflow-hidden">
          <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block mb-1">
            Veículos Vendidos
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            {totalVendasCount}
          </p>
          <span className="text-[11px] text-blue-200/80 mt-2 block font-medium">
            Histórico acumulado
          </span>
        </div>

        {/* CARD 2: Ticket Médio (Exclusivo Administrador) */}
        {isAdmin && (
          <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm border-l-4 border-l-blue-500">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
              Ticket Médio
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              R$ {ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-gray-400 mt-2 block font-medium">
              Média por veículo vendido
            </span>
          </div>
        )}
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center flex-grow max-w-3xl">
          {/* Campo de Busca Geral */}
          <div className="flex-grow min-w-full sm:min-w-[240px]">
            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">
              <Search className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm inline-block mr-1" />
              Pesquisar Venda / Comprador / Placa / Modelo
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por placa, modelo, comprador, CPF, renavam..."
                value={buscaGeral}
                onChange={(e) => setBuscaGeral(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-700 rounded-lg py-2 pl-8 pr-7 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium placeholder-gray-400 focus:outline-none focus:border-brand-blue"
              />
              <span className="absolute left-2.5 top-2 text-gray-400 text-xs">
                <Search className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" />
              </span>
              {buscaGeral && (
                <button
                  onClick={() => setBuscaGeral("")}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Marca</label>
              <select
                value={filtroMarca}
                onChange={(e) => setFiltroMarca(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-700 rounded-lg py-2 px-3 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-brand-blue"
              >
                <option value="">Todas as Marcas</option>
                {marcasUnicas.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Ano</label>
              <select
                value={filtroAno}
                onChange={(e) => setFiltroAno(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-700 rounded-lg py-2 px-3 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-brand-blue"
              >
                <option value="">Todos os Anos</option>
                {anosUnicos.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro por Período de Datas */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-150 dark:border-slate-700 w-full text-xs">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Período da Venda:
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

      {/* GRID PRINCIPAL: TABELA E CENTRO DE CUSTO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* TABELA DE VENDAS */}
        <div className={`bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden transition-colors ${selectedVeiculo ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-300">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Placa</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Veículo</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Ano</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Comprador & Valores</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Data Venda</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Status</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700/60 text-gray-700 dark:text-gray-300">
                {veiculosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-400 text-xs">
                      Nenhum registro de venda encontrado no histórico.
                    </td>
                  </tr>
                ) : (
                  veiculosPaginados.map((v) => {
                    const venda = v.vendas && v.vendas.length > 0 ? v.vendas[0] : null;
                    const valorVenda = venda ? Number(venda.valorVendaVeiculo) : 0;
                    const comprador = venda?.cliente?.nome || venda?.contratoPayload?.buyerName || "Não registrado";
                    const dataVendaFormatada = venda?.dataVenda 
                      ? new Date(venda.dataVenda).toLocaleDateString("pt-BR", { timeZone: "UTC" })
                      : "Data não reg.";

                    const dtVenda = venda?.dataVenda ? new Date(venda.dataVenda) : null;
                    const diffDays = dtVenda ? (new Date() - dtVenda) / (1000 * 60 * 60 * 24) : 999;
                    const contratoDisponivel = diffDays <= 90 && venda?.contratoPayload;

                    return (
                      <tr
                        key={v.id}
                        onClick={() => setSelectedVeiculo(v)}
                        className={`hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                          selectedVeiculo && selectedVeiculo.id === v.id ? "bg-blue-50/30 dark:bg-blue-900/30 font-semibold" : ""
                        }`}
                      >
                        <td className="p-4 font-mono text-xs font-bold text-brand-blue dark:text-blue-400 uppercase">
                          {v.placa}
                        </td>
                        <td className="p-4 text-xs font-bold">
                          {v.marca} {v.modelo}
                        </td>
                        <td className="p-4 text-xs text-gray-500 dark:text-gray-400">
                          {v.anoFab}/{v.anoMod}
                        </td>
                        <td className="p-4 text-xs font-bold">
                          <div className="text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px] flex items-center gap-1">
                            <span className="text-emerald-600 dark:text-emerald-500 font-semibold text-[10px]">Venda:</span>
                            <span>R$ {valorVenda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold truncate max-w-[150px] mt-0.5 flex items-center gap-1" title={comprador}>
                            <User className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">{comprador}</span>
                          </div>
                          <div className="text-gray-400 dark:text-gray-500 font-medium text-[10px] mt-0.5">
                            Compra: R$ {Number(v.valorCompra).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-800 dark:text-slate-200">
                          {dataVendaFormatada}
                        </td>
                        <td className="p-4 text-xs">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Vendido
                          </span>
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center items-center gap-1.5">
                            {contratoDisponivel ? (
                              <button
                                onClick={() => handleDownloadContract(v, venda)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 h-7 rounded-md text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs whitespace-nowrap"
                                title="Baixar Contrato Oficial DRI-CAR (PDF)"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Contrato</span>
                              </button>
                            ) : (
                              <span
                                className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 h-7 flex items-center justify-center rounded border border-gray-200 dark:border-slate-700"
                                title={venda?.contratoPayload ? "O contrato esteve disponível por 3 meses e foi expirado." : "Contrato não registrado."}
                              >
                                <Clock className="w-3 h-3 mr-0.5 text-gray-400" /> Expirado
                              </span>
                            )}
                            
                            <button
                              onClick={() => setVendaToUndo(v)}
                              className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white px-2.5 h-7 rounded-md text-[10px] font-extrabold transition-all border border-rose-200 dark:border-rose-800/60 cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap"
                              title="Desfazer venda e retornar veículo ao estoque e catálogo do site"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Desfazer Venda</span>
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

          {/* Paginação */}
          {veiculosFiltrados.length > 0 && (
            <div className="bg-gray-50/80 dark:bg-slate-800/80 border-t border-gray-200 dark:border-slate-700 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-semibold text-[11px]">
                Mostrando <span className="font-extrabold text-slate-900 dark:text-white">{inicioIndex + 1}</span> a{" "}
                <span className="font-extrabold text-slate-900 dark:text-white">{Math.min(fimIndex, veiculosFiltrados.length)}</span> de{" "}
                <span className="font-extrabold text-brand-blue">{veiculosFiltrados.length}</span> veículos vendidos
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

        {/* PAINEL LATERAL: DETALHES DO VEÍCULO VENDIDO & CENTRO DE CUSTO */}
        {selectedVeiculo && (
          <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col gap-6 animate-slide-in">
            <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-700 pb-3">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Detalhes da Venda & Centro de Custo</span>
                <h4 className="font-extrabold text-sm text-brand-blue uppercase mt-1">
                  Placa: {selectedVeiculo.placa}
                </h4>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{selectedVeiculo.marca} {selectedVeiculo.modelo}</p>
              </div>
              <button
                onClick={() => setSelectedVeiculo(null)}
                className="text-gray-400 hover:text-gray-650 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Ações Rápidas */}
            <div className="flex flex-col gap-2">
              {selectedVeiculo.vendas && selectedVeiculo.vendas.length > 0 && selectedVeiculo.vendas[0].contratoPayload && (
                <button
                  onClick={() => handleDownloadContract(selectedVeiculo, selectedVeiculo.vendas[0])}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Baixar Contrato Oficial DRI-CAR (PDF)</span>
                </button>
              )}

              <button
                onClick={() => setVendaToUndo(selectedVeiculo)}
                className="w-full bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Desfazer Venda deste Veículo</span>
              </button>
            </div>

            {/* Informações de Compra e Venda */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
              <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-200/60 dark:border-slate-700">
                <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-extrabold block">🛒 Preço Compra</span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white block mt-1">
                  R$ {Number(selectedVeiculo.valorCompra).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-[9px] text-emerald-700 dark:text-emerald-300 uppercase font-extrabold block">💰 Preço Venda</span>
                <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-200 block mt-1">
                  {selectedVeiculo.vendas && selectedVeiculo.vendas.length > 0
                    ? `R$ ${Number(selectedVeiculo.vendas[0].valorVendaVeiculo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : "Não informado"}
                </span>
              </div>
            </div>

            {/* Despesas e Lucro */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100/50 dark:border-amber-900/40">
                <span className="text-[9px] text-amber-600 dark:text-amber-400 uppercase font-bold block">🔧 Total Despesas</span>
                <span className="text-xs font-extrabold text-amber-800 dark:text-amber-200 block mt-1">
                  R$ {calcularTotalDespesas(selectedVeiculo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-blue-50/30 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100/50 dark:border-blue-900/40">
                <span className="text-[9px] text-brand-blue dark:text-blue-300 uppercase font-bold block">🏷️ Custo Total</span>
                <span className="text-xs font-extrabold text-brand-blue dark:text-blue-200 block mt-1">
                  R$ {(Number(selectedVeiculo.valorCompra) + calcularTotalDespesas(selectedVeiculo)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Dados do Comprador */}
            {selectedVeiculo.vendas && selectedVeiculo.vendas.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-left space-y-2">
                <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <Handshake className="w-4 h-4 text-brand-blue" />
                  <h5 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    Dados da Venda Realizada
                  </h5>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-bold text-gray-500 dark:text-gray-400 block text-[9px] uppercase">Comprador</span>
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      {selectedVeiculo.vendas[0].cliente?.nome || selectedVeiculo.vendas[0].contratoPayload?.buyerName || "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 dark:text-gray-400 block text-[9px] uppercase">Data da Venda</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {selectedVeiculo.vendas[0].dataVenda
                        ? new Date(selectedVeiculo.vendas[0].dataVenda).toLocaleDateString("pt-BR", { timeZone: "UTC" })
                        : "Não informada"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 dark:text-gray-400 block text-[9px] uppercase">Telefone</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {selectedVeiculo.vendas[0].cliente?.telefone || selectedVeiculo.vendas[0].contratoPayload?.buyerPhone || "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 dark:text-gray-400 block text-[9px] uppercase">CPF / CNPJ</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block font-mono">
                      {selectedVeiculo.vendas[0].cliente?.cpfCnpj || selectedVeiculo.vendas[0].contratoPayload?.buyerCpfCnpj || "Não informado"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Centro de Custo / Despesas */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-brand-blue" />
                  Centro de Custo / Despesas
                </span>
                <button
                  onClick={() => setShowExpenseForm(!showExpenseForm)}
                  className="bg-brand-blue text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 hover:opacity-90 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nova Despesa</span>
                </button>
              </div>

              {/* Form Lançar Nova Despesa */}
              {showExpenseForm && (
                <form onSubmit={handleAddExpense} className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase">Categoria</label>
                      <select
                        value={formExpense.categoria}
                        onChange={(e) => setFormExpense({ ...formExpense, categoria: e.target.value })}
                        className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-1.5 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                      >
                        <option value="Mecânica">Mecânica</option>
                        <option value="Funilaria / Pintura">Funilaria / Pintura</option>
                        <option value="Estética / Lavagem">Estética / Lavagem</option>
                        <option value="Tapeçaria">Tapeçaria</option>
                        <option value="Peças / Acessórios">Peças / Acessórios</option>
                        <option value="Documentação / IPVA">Documentação / IPVA</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase">Valor (R$)</label>
                      <input
                        type="text"
                        required
                        placeholder="R$ 0,00"
                        value={formExpense.valor}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, "");
                          if (!clean) return setFormExpense({ ...formExpense, valor: "" });
                          const formatted = "R$ " + Number(clean).toLocaleString("pt-BR");
                          setFormExpense({ ...formExpense, valor: formatted });
                        }}
                        className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-1.5 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase">Descrição</label>
                    <input
                      type="text"
                      placeholder="Ex: Troca de óleo, polimento..."
                      value={formExpense.descricao}
                      onChange={(e) => setFormExpense({ ...formExpense, descricao: e.target.value })}
                      className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-1.5 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowExpenseForm(false)}
                      className="px-2.5 py-1 text-[11px] font-bold text-gray-500 hover:text-gray-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={expenseLoading}
                      className="bg-brand-blue text-white font-bold text-[11px] px-3 py-1 rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      {expenseLoading ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Despesas Lançadas */}
              {selectedVeiculo.despesas && selectedVeiculo.despesas.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedVeiculo.despesas.map((d) => (
                    <div key={d.id} className="bg-gray-50 dark:bg-slate-800 p-2 rounded-lg border border-gray-200/60 dark:border-slate-700 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block text-[11px]">{d.categoria}</span>
                        {d.descricao && <span className="text-[10px] text-gray-500 dark:text-gray-400 block">{d.descricao}</span>}
                      </div>
                      <span className="font-extrabold text-amber-700 dark:text-amber-400 text-xs">
                        R$ {Number(d.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 italic">Nenhuma despesa registrada para este veículo.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMAÇÃO: DESFAZER VENDA */}
      {vendaToUndo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-200 animate-scale-in">
            <div className="bg-amber-500 p-5 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Desfazer Venda</h3>
                <p className="text-xs text-amber-100 font-medium">Reversão de operação e retorno ao estoque</p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-gray-700 text-xs">
              <p className="text-sm font-bold text-gray-900">
                Tem certeza que deseja desfazer a venda deste veículo?
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2 font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Veículo:</span>
                  <strong className="text-gray-900 font-bold">
                    {vendaToUndo.marca} {vendaToUndo.modelo}
                  </strong>
                </div>
                {vendaToUndo.placa && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Placa:</span>
                    <strong className="font-mono text-gray-900 font-bold uppercase bg-gray-200 px-1.5 py-0.5 rounded text-[11px]">
                      {vendaToUndo.placa}
                    </strong>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Valor da Venda:</span>
                  <strong className="text-emerald-700 font-bold text-sm">
                    R$ {Number(vendaToUndo.vendas?.[0]?.valorVendaVeiculo || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200/80 pt-1.5">
                  <span className="text-gray-500">Comprador:</span>
                  <strong className="text-gray-900 font-bold">
                    {vendaToUndo.vendas?.[0]?.cliente?.nome || vendaToUndo.vendas?.[0]?.contratoPayload?.buyerName || "Não registrado"}
                  </strong>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-950 space-y-1.5">
                <p className="font-extrabold text-[11px] uppercase tracking-wide text-amber-900 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Ao confirmar esta ação:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-900">
                  <li>O veículo retornará para a aba <strong>Estoque</strong> com status <strong>Disponível</strong>.</li>
                  <li>O veículo voltará a ficar ativo no <strong>catálogo do site</strong>.</li>
                  <li>O registro da venda e os indicadores financeiros serão revertidos no banco de dados.</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={undoLoading}
                onClick={() => setVendaToUndo(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-xs font-bold hover:bg-gray-100 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={undoLoading}
                onClick={handleConfirmUndoVenda}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {undoLoading ? "Desfazendo..." : "Sim, Desfazer Venda"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
