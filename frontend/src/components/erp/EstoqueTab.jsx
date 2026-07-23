"use client";

import { useState, useEffect } from "react";
import { generateSalePdf } from "@/lib/generateSalePdf";

export default function EstoqueTab() {
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVeiculo, setSelectedVeiculo] = useState(null);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState("Disponível");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroAno, setFiltroAno] = useState("");
  const [buscaGeral, setBuscaGeral] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 15;

  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroStatus, filtroMarca, filtroAno, buscaGeral, dataInicio, dataFim]);

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

  // Modal de Venda de Veículo (Baixa + Geração de PDF)
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleLoading, setSaleLoading] = useState(false);
  const [saleError, setSaleError] = useState("");
  const [targetSaleVeiculo, setTargetSaleVeiculo] = useState(null);
  const [saleForm, setSaleForm] = useState({
    buyerName: "",
    buyerCpfCnpj: "",
    buyerPhone: "",
    buyerAddress: "",
    salePrice: "",
    saleDate: new Date().toISOString().split("T")[0],
    paymentMethod: "À Vista (PIX/Transferência)",
    sellerName: "",
    notes: "",
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

  // Filtragem com busca multi-parâmetros e filtro de datas
  const veiculosFiltrados = veiculos.filter(v => {
    const matchStatus = filtroStatus ? v.status === filtroStatus : true;
    const matchMarca = filtroMarca ? v.marca === filtroMarca : true;
    const matchAno = filtroAno ? v.anoMod === parseInt(filtroAno) : true;

    const term = buscaGeral.toLowerCase().trim();
    const matchBusca = !term ? true : (
      (v.placa && v.placa.toLowerCase().includes(term)) ||
      (v.marca && v.marca.toLowerCase().includes(term)) ||
      (v.modelo && v.modelo.toLowerCase().includes(term)) ||
      (v.renavam && v.renavam.toLowerCase().includes(term)) ||
      (v.chassi && v.chassi.toLowerCase().includes(term)) ||
      (v.status && v.status.toLowerCase().includes(term)) ||
      (`${v.anoFab}/${v.anoMod}`.includes(term)) ||
      (v.despesas && v.despesas.some(d => d.categoria && d.categoria.toLowerCase().includes(term)))
    );

    let matchData = true;
    if (dataInicio || dataFim) {
      const dInicio = dataInicio ? new Date(dataInicio + "T00:00:00Z") : null;
      const dFim = dataFim ? new Date(dataFim + "T23:59:59Z") : null;

      const dtEntrada = v.dataEntrada ? new Date(v.dataEntrada) : null;
      const dtSaida = (v.vendas && v.vendas.length > 0 && v.vendas[0].dataVenda)
        ? new Date(v.vendas[0].dataVenda)
        : null;

      const matchEntrada = dtEntrada && (!dInicio || dtEntrada >= dInicio) && (!dFim || dtEntrada <= dFim);
      const matchSaida = dtSaida && (!dInicio || dtSaida >= dInicio) && (!dFim || dtSaida <= dFim);
      matchData = matchEntrada || matchSaida;
    }

    return matchStatus && matchMarca && matchAno && matchBusca && matchData;
  });

  // Cálculo da Paginação (15 veículos por página)
  const totalPaginas = Math.ceil(veiculosFiltrados.length / ITENS_POR_PAGINA) || 1;
  const inicioIndex = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const fimIndex = inicioIndex + ITENS_POR_PAGINA;
  const veiculosPaginados = veiculosFiltrados.slice(inicioIndex, fimIndex);

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

  // Abrir Modal de Venda de Veículo
  const openSaleModal = (v) => {
    setTargetSaleVeiculo(v);
    setSaleForm({
      buyerName: "",
      buyerCpfCnpj: "",
      buyerPhone: "",
      buyerAddress: "",
      salePrice: "R$ " + Number(v.valorCompra).toLocaleString("pt-BR"),
      saleDate: new Date().toISOString().split("T")[0],
      paymentMethod: "À Vista (PIX/Transferência)",
      sellerName: "",
      notes: "",
    });
    setSaleError("");
    setShowSaleModal(true);
  };

  // Submeter Venda de Veículo (Dar Baixa + Gerar PDF)
  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    if (!targetSaleVeiculo) return;
    setSaleLoading(true);
    setSaleError("");

    const cleanPrice = saleForm.salePrice.replace(/\D/g, "");
    const valorVendaNum = parseFloat(cleanPrice) || 0;

    try {
      const res = await fetch("/api/admin/erp/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          veiculoId: targetSaleVeiculo.id,
          buyerName: saleForm.buyerName,
          buyerCpfCnpj: saleForm.buyerCpfCnpj,
          buyerPhone: saleForm.buyerPhone,
          buyerAddress: saleForm.buyerAddress,
          valorVendaVeiculo: valorVendaNum,
          dataVenda: saleForm.saleDate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Gerar o documento PDF para o usuário baixar automaticamente
        generateSalePdf({
          veiculo: targetSaleVeiculo,
          buyerName: saleForm.buyerName,
          buyerCpfCnpj: saleForm.buyerCpfCnpj,
          buyerPhone: saleForm.buyerPhone,
          buyerAddress: saleForm.buyerAddress,
          salePrice: valorVendaNum,
          saleDate: saleForm.saleDate,
          paymentMethod: saleForm.paymentMethod,
          sellerName: saleForm.sellerName,
          notes: saleForm.notes,
        });

        setShowSaleModal(false);
        fetchVeiculos();
      } else {
        setSaleError(data.error || "Erro ao registrar venda.");
      }
    } catch (err) {
      setSaleError("Erro de comunicação ao registrar venda.");
    } finally {
      setSaleLoading(false);
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
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center flex-grow max-w-3xl">
          {/* Campo de Busca Geral */}
          <div className="flex-grow min-w-full sm:min-w-[220px]">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">🔍 Pesquisar Veículo / Peças / Placa</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por placa, modelo, renavam, chassi, peças..."
                value={buscaGeral}
                onChange={(e) => setBuscaGeral(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2 pl-8 pr-7 text-xs bg-white text-slate-900 font-medium placeholder-gray-400 focus:outline-none focus:border-brand-blue"
              />
              <span className="absolute left-2.5 top-2 text-gray-400 text-xs">🔍</span>
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

          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2 px-2 sm:px-3 text-xs bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
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
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Marca</label>
              <select
                value={filtroMarca}
                onChange={(e) => setFiltroMarca(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2 px-2 sm:px-3 text-xs bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
              >
                <option value="">Todas</option>
                {marcasUnicas.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Ano</label>
              <select
                value={filtroAno}
                onChange={(e) => setFiltroAno(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2 px-2 sm:px-3 text-xs bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
              >
                <option value="">Todos</option>
                {anosUnicos.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro por Período de Datas */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-150 w-full text-xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              📅 Período:
            </span>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 font-medium">De:</span>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="border border-gray-300 rounded-lg py-1 px-2 text-xs bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 font-medium">Até:</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="border border-gray-300 rounded-lg py-1 px-2 text-xs bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
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
          className="bg-brand-blue hover:opacity-90 text-white font-bold text-xs px-5 py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-1.5 transition-all w-full md:w-auto cursor-pointer"
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
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Compra / Venda</th>
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
                  veiculosPaginados.map(v => (
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
                      <td className="p-4 text-xs font-bold">
                        <div className="text-slate-900 font-extrabold text-[11px] flex items-center gap-1">
                          <span className="text-gray-400 font-semibold text-[10px]">🛒 Compra:</span>
                          <span>R$ {Number(v.valorCompra).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                        {v.status === "Vendido" && v.vendas && v.vendas.length > 0 ? (
                          <div className="text-emerald-700 font-extrabold text-[11px] mt-0.5 flex items-center gap-1">
                            <span className="text-emerald-600 font-semibold text-[10px]">💰 Venda:</span>
                            <span>R$ {Number(v.vendas[0].valorVendaVeiculo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          </div>
                        ) : v.status === "Vendido" ? (
                          <div className="text-emerald-700 font-bold text-[10px] mt-0.5">💰 Vendido</div>
                        ) : (
                          <div className="text-gray-400 font-medium text-[10px] mt-0.5">📦 Em Pátio</div>
                        )}
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
                        <div className="flex justify-center items-center gap-1.5">
                          {v.status !== "Vendido" && (
                            <button
                              onClick={() => openSaleModal(v)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-xs whitespace-nowrap"
                              title="Dar baixa / Vender veículo e gerar PDF"
                            >
                              💰 Vender
                            </button>
                          )}
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

          {/* Rodapé de Paginação (Máximo 15 veículos por página) */}
          {veiculosFiltrados.length > 0 && (
            <div className="bg-gray-50/80 border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-gray-500 font-semibold text-[11px]">
                Mostrando <span className="font-extrabold text-slate-900">{inicioIndex + 1}</span> a{" "}
                <span className="font-extrabold text-slate-900">{Math.min(fimIndex, veiculosFiltrados.length)}</span> de{" "}
                <span className="font-extrabold text-brand-blue">{veiculosFiltrados.length}</span> veículos
              </span>

              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
                <button
                  onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                  disabled={paginaAtual === 1}
                  className="px-2.5 py-1 rounded-md border border-gray-300 font-bold bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs cursor-pointer"
                >
                  ◀ Anterior
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
                  Próximo ▶
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center of Cost Panel */}
        {selectedVeiculo && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6 animate-slide-in">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Centro de Custo & Informações</span>
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

            {selectedVeiculo.status !== "Vendido" && (
              <button
                onClick={() => openSaleModal(selectedVeiculo)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                💰 Realizar Venda deste Veículo & Gerar PDF
              </button>
            )}

            {/* Datas de Entrada e Saída do Estoque */}
            <div className="grid grid-cols-2 gap-3 bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/80">
              <div>
                <span className="text-[9px] text-gray-500 uppercase font-bold block flex items-center gap-1">
                  📅 Data Entrada (Estoque)
                </span>
                <span className="text-xs font-extrabold text-slate-900 block mt-1">
                  {selectedVeiculo.dataEntrada 
                    ? new Date(selectedVeiculo.dataEntrada).toLocaleDateString("pt-BR", { timeZone: "UTC" })
                    : "Não informada"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 uppercase font-bold block flex items-center gap-1">
                  🚪 Data Saída (Estoque)
                </span>
                <span className="text-xs font-extrabold text-slate-900 block mt-1">
                  {selectedVeiculo.status === "Vendido" && selectedVeiculo.vendas && selectedVeiculo.vendas.length > 0
                    ? new Date(selectedVeiculo.vendas[0].dataVenda).toLocaleDateString("pt-BR", { timeZone: "UTC" })
                    : selectedVeiculo.status === "Vendido"
                      ? "Vendido (Data não reg.)"
                      : "Em Pátio (Em aberto)"}
                </span>
              </div>
            </div>

            {/* Preços de Compra e Venda discriminados */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/60">
                <span className="text-[9px] text-gray-500 uppercase font-extrabold block">🛒 Preço Compra (Entrada)</span>
                <span className="text-xs font-extrabold text-slate-900 block mt-1">
                  R$ {Number(selectedVeiculo.valorCompra).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                <span className="text-[9px] text-emerald-700 uppercase font-extrabold block">💰 Preço Venda (Saída)</span>
                <span className="text-xs font-extrabold text-emerald-800 block mt-1">
                  {selectedVeiculo.status === "Vendido" && selectedVeiculo.vendas && selectedVeiculo.vendas.length > 0
                    ? `R$ ${Number(selectedVeiculo.vendas[0].valorVendaVeiculo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : selectedVeiculo.status === "Vendido"
                      ? "Vendido"
                      : "Em Pátio (Em Aberto)"}
                </span>
              </div>
            </div>

            {/* Cost breakdown cards */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                <span className="text-[9px] text-amber-600 uppercase font-bold block">🔧 Total Despesas</span>
                <span className="text-xs font-extrabold text-amber-800 block mt-1">
                  R$ {calcularTotalDespesas(selectedVeiculo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
                <span className="text-[9px] text-brand-blue uppercase font-bold block">🏷️ Custo Total Aquisição</span>
                <span className="text-xs font-extrabold text-brand-blue block mt-1">
                  R$ {(Number(selectedVeiculo.valorCompra) + calcularTotalDespesas(selectedVeiculo)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
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
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
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
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white text-slate-900 font-bold placeholder-gray-400 focus:outline-none focus:border-brand-blue"
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
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
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
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-bold uppercase font-mono text-xs focus:border-brand-blue placeholder-gray-400"
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
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-bold font-mono text-xs focus:border-brand-blue placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Chassi</label>
                    <input
                      type="text"
                      placeholder="Número do Chassi..."
                      value={formVeiculo.chassi}
                      onChange={(e) => setFormVeiculo(prev => ({ ...prev, chassi: e.target.value.toUpperCase().trim() }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-bold font-mono text-xs focus:border-brand-blue placeholder-gray-400"
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
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:border-brand-blue placeholder-gray-400"
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
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:border-brand-blue placeholder-gray-400"
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
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:border-brand-blue placeholder-gray-400"
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
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:border-brand-blue placeholder-gray-400"
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
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-extrabold focus:border-brand-blue placeholder-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Data Entrada</label>
                    <input
                      type="date"
                      value={formVeiculo.dataEntrada}
                      onChange={(e) => setFormVeiculo(prev => ({ ...prev, dataEntrada: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold text-xs focus:border-brand-blue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Status Pátio</label>
                    <select
                      value={formVeiculo.status}
                      onChange={(e) => setFormVeiculo(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:border-brand-blue"
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
      {/* MODAL DE VENDA DE VEÍCULO (BAIXA + GERAR PDF) */}
      {showSaleModal && targetSaleVeiculo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-150 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">
                  📄 Baixa de Estoque & Documentação em PDF
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 uppercase mt-0.5">
                  💰 Vender Veículo: <span className="text-brand-blue">{targetSaleVeiculo.marca} {targetSaleVeiculo.modelo}</span>
                </h3>
              </div>
              <button
                onClick={() => setShowSaleModal(false)}
                className="text-gray-400 hover:text-gray-650 text-base font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Banner do Carro */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex justify-between items-center text-xs">
              <div>
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Veículo Selecionado</span>
                <span className="font-extrabold text-slate-900">{targetSaleVeiculo.marca} {targetSaleVeiculo.modelo} ({targetSaleVeiculo.anoFab}/{targetSaleVeiculo.anoMod})</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Placa</span>
                <span className="font-mono font-extrabold text-brand-blue">{targetSaleVeiculo.placa}</span>
              </div>
            </div>

            <form onSubmit={handleSaleSubmit} className="space-y-4 text-xs">
              {/* Seção 1: Dados do Comprador */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                <h4 className="font-extrabold text-gray-700 uppercase text-[11px] flex items-center gap-1.5">
                  👤 Dados do Comprador
                </h4>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">
                    Nome Completo do Comprador <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: João da Silva Santos"
                    value={saleForm.buyerName}
                    onChange={(e) => setSaleForm(prev => ({ ...prev, buyerName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">CPF / CNPJ</label>
                    <input
                      type="text"
                      placeholder="Ex: 123.456.789-00"
                      value={saleForm.buyerCpfCnpj}
                      onChange={(e) => setSaleForm(prev => ({ ...prev, buyerCpfCnpj: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 98765-4321"
                      value={saleForm.buyerPhone}
                      onChange={(e) => setSaleForm(prev => ({ ...prev, buyerPhone: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Endereço Completo</label>
                  <input
                    type="text"
                    placeholder="Ex: Rua das Flores, 123 - São Paulo / SP"
                    value={saleForm.buyerAddress}
                    onChange={(e) => setSaleForm(prev => ({ ...prev, buyerAddress: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              {/* Seção 2: Dados da Venda */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                <h4 className="font-extrabold text-gray-700 uppercase text-[11px] flex items-center gap-1.5">
                  💵 Condições Financeiras da Venda
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">
                      Valor Real da Venda (R$) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={saleForm.salePrice}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, "");
                        if (!clean) return setSaleForm(prev => ({ ...prev, salePrice: "" }));
                        const formatted = "R$ " + Number(clean).toLocaleString("pt-BR");
                        setSaleForm(prev => ({ ...prev, salePrice: formatted }));
                      }}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-emerald-700 font-extrabold text-sm focus:outline-none focus:border-brand-blue"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">
                      Data da Venda <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={saleForm.saleDate}
                      onChange={(e) => setSaleForm(prev => ({ ...prev, saleDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Forma de Pagamento</label>
                    <select
                      value={saleForm.paymentMethod}
                      onChange={(e) => setSaleForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                    >
                      <option value="À Vista (PIX/Transferência)">À Vista (PIX/Transferência)</option>
                      <option value="Financiamento Bancário">Financiamento Bancário</option>
                      <option value="Troca com Troco">Troca com Troco</option>
                      <option value="Entrada + Financiamento">Entrada + Financiamento</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Vendedor Responsável</label>
                    <input
                      type="text"
                      placeholder="Nome do Vendedor / Consultor"
                      value={saleForm.sellerName}
                      onChange={(e) => setSaleForm(prev => ({ ...prev, sellerName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-semibold focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Observações / Termo de Garantia</label>
                  <textarea
                    rows="3"
                    placeholder="Digite observações sobre garantia, entrega, estado do veículo ou prazos de documento..."
                    value={saleForm.notes}
                    onChange={(e) => setSaleForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-slate-900 font-medium focus:outline-none focus:border-brand-blue"
                  ></textarea>
                </div>
              </div>

              {saleError && (
                <p className="text-red-600 font-semibold bg-red-50 p-3 rounded-lg border border-red-100">{saleError}</p>
              )}

              <div className="flex gap-4 justify-end pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="border border-gray-300 text-gray-650 px-5 py-2.5 rounded-lg font-bold hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saleLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-lg font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  {saleLoading ? "Registrando Venda..." : "💰 Confirmar Venda & Gerar PDF"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
