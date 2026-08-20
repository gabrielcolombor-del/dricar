"use client";
import { Users, CheckCircle, Search, Car, Eye, Pencil } from 'lucide-react';


import { useState, useEffect } from "react";

export default function ClientesTab() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Busca e Filtros
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  // Modal Detalhes / Edição
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    cpfCnpj: "",
    statusFunil: "",
  });

  // Edição de Veículo / Venda no Modal
  const [editingVendaId, setEditingVendaId] = useState(null);
  const [vendaFormData, setVendaFormData] = useState({
    id: "",
    veiculoId: "",
    marca: "",
    modelo: "",
    placa: "",
    anoMod: "",
    valorVendaVeiculo: "",
    dataVenda: "",
  });
  const [vendaLoading, setVendaLoading] = useState(false);

  async function fetchClientes() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/erp/clientes");
      if (res.ok) {
        const data = await res.json();
        setClientes(data);
      } else {
        setError("Erro ao carregar clientes.");
      }
    } catch (err) {
      setError("Erro de rede ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClientes();
  }, []);

  // Ao digitar na busca, volta para página 1
  const handleSearchChange = (e) => {
    setBusca(e.target.value);
    setPage(1);
  };

  // Lógica de Filtragem (Pessoa, CPF, Telefone ou Veículo)
  const clientesFiltrados = clientes.filter((c) => {
    if (!busca) return true;
    const q = busca.toLowerCase().trim();
    if (!q) return true;

    // Buscar por Nome (Pessoa)
    if (c.nome && c.nome.toLowerCase().includes(q)) return true;

    // Buscar por string direta em CPF/CNPJ e Telefone
    if (c.cpfCnpj && c.cpfCnpj.toLowerCase().includes(q)) return true;
    if (c.telefone && c.telefone.toLowerCase().includes(q)) return true;

    // Buscar por apenas números (APENAS se a busca NÃO contiver letras e tiver pelo menos 4 dígitos)
    const hasLetters = /[a-zA-Z]/.test(q);
    const qDigits = q.replace(/\D/g, "");
    if (!hasLetters && qDigits.length >= 4) {
      if (c.cpfCnpj && c.cpfCnpj.replace(/\D/g, "").includes(qDigits)) return true;
      if (c.telefone && c.telefone.replace(/\D/g, "").includes(qDigits)) return true;
    }

    // Buscar por Veículo Comprado ou Interesse (Placa, Modelo, Marca)
    if (c.vendas && c.vendas.length > 0) {
      const matchVenda = c.vendas.some((v) => {
        const veic = v.veiculo || {};
        const car = veic.car || {};
        const marca = (veic.marca || car.brand || "").toLowerCase();
        const modelo = (veic.modelo || car.model || "").toLowerCase();
        const placa = (veic.placa || "").toLowerCase();
        return placa.includes(q) || modelo.includes(q) || marca.includes(q) || `${marca} ${modelo}`.includes(q);
      });
      if (matchVenda) return true;
    }

    if (c.veiculoInteresse) {
      const veic = c.veiculoInteresse;
      const marca = (veic.marca || "").toLowerCase();
      const modelo = (veic.modelo || "").toLowerCase();
      const placa = (veic.placa || "").toLowerCase();
      if (placa.includes(q) || modelo.includes(q) || marca.includes(q) || `${marca} ${modelo}`.includes(q)) return true;
    }

    return false;
  });

  // Lógica de Paginação (15 contatos por página)
  const totalItems = clientesFiltrados.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (page - 1) * itemsPerPage;
  const clientesPaginados = clientesFiltrados.slice(startIndex, startIndex + itemsPerPage);

  // KPIs
  const totalQualificados = clientes.length;

  // Abrir Modal de Edição / Detalhes
  const handleOpenModal = (cliente) => {
    setSelectedCliente(cliente);
    setFormData({
      nome: cliente.nome || "",
      telefone: cliente.telefone || "",
      cpfCnpj: cliente.cpfCnpj || "",
      statusFunil: cliente.statusFunil || "Novo Lead",
    });
    setFormError("");
    setShowModal(true);
  };

  // Salvar Edição
  const handleSaveCliente = async (e) => {
    e.preventDefault();
    if (!selectedCliente) return;

    setFormLoading(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/erp/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedCliente.id,
          nome: formData.nome,
          telefone: formData.telefone,
          cpfCnpj: formData.cpfCnpj,
          statusFunil: formData.statusFunil,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowModal(false);
        fetchClientes();
      } else {
        setFormError(data.error || "Erro ao atualizar dados do cliente.");
      }
    } catch (err) {
      setFormError("Erro de comunicação com o servidor.");
    } finally {
      setFormLoading(false);
    }
  };

  // Excluir Cliente
  const handleDeleteCliente = async (clienteId, nome) => {
    if (!window.confirm(`Tem certeza que deseja excluir definitivamente o cliente "${nome || 'Selecionado'}" e todo o seu histórico de compras?`)) {
      return;
    }
    try {
      const res = await fetch("/api/admin/erp/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: clienteId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (selectedCliente && selectedCliente.id === clienteId) {
          setShowModal(false);
        }
        fetchClientes();
      } else {
        alert(data.error || "Erro ao excluir cliente.");
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor para excluir cliente.");
    }
  };

  // Iniciar Edição de Veículo / Venda
  const handleStartEditVenda = (v) => {
    const veic = v.veiculo || {};
    const car = veic.car || {};
    setEditingVendaId(v.id);
    setVendaFormData({
      id: v.id,
      veiculoId: veic.id || "",
      marca: veic.marca || car.brand || "",
      modelo: veic.modelo || car.model || "",
      placa: veic.placa || "",
      anoMod: veic.anoMod || car.year || "",
      valorVendaVeiculo: v.valorVendaVeiculo ? Number(v.valorVendaVeiculo).toString() : "0",
      dataVenda: v.dataVenda ? new Date(v.dataVenda).toISOString().split("T")[0] : "",
    });
  };

  // Salvar Edição do Veículo / Venda
  const handleSaveVenda = async (e) => {
    e.preventDefault();
    setVendaLoading(true);
    try {
      const res = await fetch("/api/admin/erp/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          ...vendaFormData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditingVendaId(null);
        await fetchClientes();
        setSelectedCliente((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            vendas: prev.vendas.map((item) => {
              if (item.id === vendaFormData.id) {
                return {
                  ...item,
                  valorVendaVeiculo: vendaFormData.valorVendaVeiculo,
                  dataVenda: vendaFormData.dataVenda ? new Date(vendaFormData.dataVenda).toISOString() : item.dataVenda,
                  veiculo: {
                    ...item.veiculo,
                    marca: vendaFormData.marca,
                    modelo: vendaFormData.modelo,
                    placa: vendaFormData.placa.toUpperCase(),
                    anoMod: vendaFormData.anoMod,
                  },
                };
              }
              return item;
            }),
          };
        });
      } else {
        alert(data.error || "Erro ao atualizar veículo/venda.");
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setVendaLoading(false);
    }
  };

  // Desvincular / Excluir Veículo
  const handleDeleteVenda = async (v) => {
    if (!window.confirm("Tem certeza que deseja desvincular/excluir este veículo do histórico do cliente?")) return;
    try {
      const res = await fetch("/api/admin/erp/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: v.id, veiculoId: v.veiculo?.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchClientes();
        setSelectedCliente((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            vendas: prev.vendas.filter((item) => item.id !== v.id),
          };
        });
      } else {
        alert(data.error || "Erro ao desvincular veículo.");
      }
    } catch (err) {
      alert("Erro ao comunicar com o servidor.");
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm animate-pulse">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-bold text-sm uppercase tracking-wider">
          Carregando base de clientes e cruzando histórico de veículos...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-800 animate-fade-in">
      {/* Card de Métrica / KPI */}
      <div className="max-w-sm">
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-blue-800/40 relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
          <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block mb-1">
            <Users className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Clientes Cadastrados
          </span>
          <p className="text-3xl font-extrabold text-white mt-1">
            {totalQualificados}
          </p>
          <span className="text-[10px] text-blue-200/80 mt-2 block flex items-center gap-1">
            <span><CheckCircle className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Nome + Telefone e/ou CPF validados</span>
          </span>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 transition-colors">
        <div className="flex flex-col sm:flex-row gap-3 flex-grow max-w-2xl">
          <div className="flex-grow">
            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">
              <Search className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Buscar por Pessoa, CPF, Número (Telefone) ou Veículo
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Digite nome do cliente, CPF, telefone, placa ou modelo do carro..."
                value={busca}
                onChange={handleSearchChange}
                className="w-full border border-gray-300 dark:border-slate-700 rounded-xl p-3 pl-10 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all shadow-inner"
              />
              <span className="absolute left-3 top-3 text-gray-400 dark:text-gray-400 text-sm">🔎</span>
              {busca && (
                <button
                  onClick={() => { setBusca(""); setPage(1); }}
                  className="absolute right-3 top-2.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-all"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 shrink-0">
          <span className="font-bold">Total Encontrado:</span>
          <span className="bg-brand-blue dark:bg-blue-600 text-white px-2.5 py-0.5 rounded-full font-extrabold text-xs">
            {totalItems}
          </span>
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white dark:bg-[#0e1b42] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm transition-colors">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/70 dark:bg-slate-800/50">
          <h4 className="text-xs font-bold text-brand-blue dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <span>📋 Base de Clientes & Vínculo de Estoque</span>
          </h4>
          <span className="text-[11px] text-gray-500 font-medium">
            Quebra de página a cada <strong className="text-gray-800">15 contatos</strong> — Exibindo <strong className="text-brand-blue">{totalItems === 0 ? 0 : startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)}</strong> de <strong className="text-gray-800">{totalItems}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/80 border-b border-gray-200">
                <th className="p-4 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Cliente</th>
                <th className="p-4 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Contatos (Tel / CPF)</th>
                <th className="p-4 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Veículos Comprados / Histórico</th>
                <th className="p-4 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-center">Status</th>
                <th className="p-4 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800 text-xs">
              {clientesPaginados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-400 font-medium text-sm">
                    Nenhum cliente encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                clientesPaginados.map((cliente) => {
                  const hasVendas = cliente.vendas && cliente.vendas.length > 0;
                  const telefoneValido = cliente.telefone && cliente.telefone !== "(00) 00000-0000" && cliente.telefone !== "Não informado" && cliente.telefone !== "0";
                  const cpfValido = cliente.cpfCnpj && cliente.cpfCnpj !== "000.000.000-00" && cliente.cpfCnpj !== "Não informado" && cliente.cpfCnpj !== "0";

                  return (
                    <tr key={cliente.id} className="hover:bg-blue-50/40 transition-colors group">
                      {/* Nome e ID */}
                      <td className="p-4 align-top">
                        <div className="font-extrabold text-slate-900 text-sm group-hover:text-brand-blue transition-colors">
                          {cliente.nome}
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                          ID: {cliente.id.slice(0, 8)}...
                        </span>
                      </td>

                      {/* Contatos */}
                      <td className="p-4 align-top space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <span className="text-gray-400">📞</span>
                          <span>{telefoneValido ? cliente.telefone : <span className="text-gray-400 italic font-normal">Não informado</span>}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <span className="text-gray-400">📄</span>
                          <span className="font-mono text-[11px]">
                            {cpfValido ? cliente.cpfCnpj : <span className="text-gray-400 italic font-normal">Não informado</span>}
                          </span>
                        </div>
                      </td>

                      {/* Histórico e Estoque */}
                      <td className="p-4 align-top">
                        <div className="space-y-2">
                          {hasVendas ? (
                            cliente.vendas.map((venda) => {
                              const veic = venda.veiculo || {};
                              const car = veic.car || {};
                              const marca = veic.marca || car.brand || "Veículo";
                              const modelo = veic.modelo || car.model || "";
                              const placa = veic.placa || "";
                              const ano = veic.anoMod || car.year || "";
                              const valorVenda = Number(venda.valorVendaVeiculo || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
                              const dataVenda = venda.dataVenda ? new Date(venda.dataVenda).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "";

                              return (
                                <div key={venda.id} className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 shadow-2xs hover:shadow-xs transition-all">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-1">
                                      <span><Car className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /></span> {marca} {modelo}
                                    </span>
                                    {placa && (
                                      <span className="bg-emerald-800 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                                        {placa}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] text-emerald-800 mt-1.5 font-medium border-t border-emerald-200/60 pt-1">
                                    <span>Ano: <strong className="text-emerald-950">{ano || "N/A"}</strong></span>
                                    <span>Valor: <strong className="text-emerald-950">R$ {valorVenda}</strong></span>
                                    {dataVenda && <span>Data: <strong className="text-emerald-950">{dataVenda}</strong></span>}
                                  </div>
                                </div>
                              );
                            })
                          ) : cliente.veiculoInteresse ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-amber-900">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-0.5">
                                🌟 Veículo de Interesse / Estoque
                              </span>
                              <div className="font-bold text-xs">
                                {cliente.veiculoInteresse.marca} {cliente.veiculoInteresse.modelo} {cliente.veiculoInteresse.placa ? `(${cliente.veiculoInteresse.placa})` : ""}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">Nenhuma compra ou veículo vinculado no histórico.</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 align-middle text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-wide border ${
                            cliente.statusFunil === "Fechado"
                              ? "bg-green-100 text-green-800 border-green-300"
                              : cliente.statusFunil === "Ficha em Análise"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : cliente.statusFunil === "Em Contato"
                              ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                              : "bg-blue-100 text-blue-800 border-blue-300"
                          }`}
                        >
                          {cliente.statusFunil || "Novo Lead"}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="p-4 align-middle text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(cliente)}
                            className="bg-slate-100 hover:bg-brand-blue hover:text-white text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-2xs border border-slate-200 cursor-pointer"
                          >
                            <Eye className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px]" /> Ver / Editar
                          </button>
                          <button
                            onClick={() => handleDeleteCliente(cliente.id, cliente.nome)}
                            className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-all shadow-2xs border border-red-200 cursor-pointer"
                            title="Excluir Cliente"
                          >
                            🗑️
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

        {/* Controles de Paginação (15 em 15) */}
        {totalPages > 1 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-semibold text-gray-500">
              Página <span className="font-extrabold text-slate-900">{page}</span> de <span className="font-extrabold text-slate-900">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
              >
                ← Anterior
              </button>

              {/* Numeração de Páginas Inteligente */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2))
                .map((p, idx, arr) => {
                  const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <div key={p} className="flex items-center gap-1">
                      {showEllipsisBefore && <span className="text-gray-400 px-1 font-bold">...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                          page === p
                            ? "bg-brand-blue text-white shadow-md scale-105 border border-brand-blue"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {p}
                      </button>
                    </div>
                  );
                })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes / Edição */}
      {showModal && selectedCliente && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Cabeçalho Modal */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-6 text-white flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block mb-1">
                  👤 Ficha do Cliente Dricar
                </span>
                <h3 className="text-lg font-extrabold">{selectedCliente.nome}</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm transition-all"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo Modal */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Resumo de Compras */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span><Car className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /></span> Veículos Comprados pelo Cliente
                </h4>
                {selectedCliente.vendas && selectedCliente.vendas.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCliente.vendas.map((v) => {
                      const veic = v.veiculo || {};
                      const car = veic.car || {};
                      const marca = veic.marca || car.brand || "Veículo";
                      const modelo = veic.modelo || car.model || "";
                      const placa = veic.placa || "";
                      const ano = veic.anoMod || car.year || "";
                      const valorVenda = Number(v.valorVendaVeiculo || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
                      const dataVenda = v.dataVenda ? new Date(v.dataVenda).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "";

                      return (
                        <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs hover:border-gray-300 transition-all">
                          {editingVendaId === v.id ? (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                <span className="text-xs font-extrabold text-brand-blue uppercase"><Pencil className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Editar Veículo / Venda</span>
                                <button
                                  type="button"
                                  onClick={() => setEditingVendaId(null)}
                                  className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Marca</label>
                                  <input
                                    type="text"
                                    value={vendaFormData.marca}
                                    onChange={(e) => setVendaFormData({ ...vendaFormData, marca: e.target.value })}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                                    placeholder="Ex: FORD"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Modelo</label>
                                  <input
                                    type="text"
                                    value={vendaFormData.modelo}
                                    onChange={(e) => setVendaFormData({ ...vendaFormData, modelo: e.target.value })}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                                    placeholder="Ex: KA SE 1.0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Placa</label>
                                  <input
                                    type="text"
                                    value={vendaFormData.placa}
                                    onChange={(e) => setVendaFormData({ ...vendaFormData, placa: e.target.value.toUpperCase() })}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-1.5 text-xs font-bold font-mono text-slate-800"
                                    placeholder="ABC1D23"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Ano (Mod/Fab)</label>
                                  <input
                                    type="text"
                                    value={vendaFormData.anoMod}
                                    onChange={(e) => setVendaFormData({ ...vendaFormData, anoMod: e.target.value })}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                                    placeholder="2020"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Valor de Venda (R$)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={vendaFormData.valorVendaVeiculo}
                                    onChange={(e) => setVendaFormData({ ...vendaFormData, valorVendaVeiculo: e.target.value })}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-1.5 text-xs font-bold text-emerald-700"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Data da Venda</label>
                                  <input
                                    type="date"
                                    value={vendaFormData.dataVenda}
                                    onChange={(e) => setVendaFormData({ ...vendaFormData, dataVenda: e.target.value })}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVenda(v)}
                                  className="text-red-600 hover:bg-red-100 bg-red-50 border border-red-200 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer"
                                >
                                  🗑️ Excluir Venda / Veículo
                                </button>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingVendaId(null)}
                                    className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 text-[11px] font-bold hover:bg-gray-100 transition-all cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleSaveVenda}
                                    disabled={vendaLoading}
                                    className="px-3.5 py-1 rounded-lg bg-brand-blue text-white text-[11px] font-extrabold hover:opacity-90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                  >
                                    {vendaLoading ? "Salvando..." : "💾 Salvar"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-slate-900 text-xs">
                                  {marca} {modelo} {ano ? `(${ano})` : ""}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {placa && (
                                    <span className="bg-slate-900 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                                      {placa}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditVenda(v)}
                                    className="bg-slate-100 hover:bg-brand-blue hover:text-white text-slate-700 px-2 py-1 rounded-lg text-[11px] font-bold transition-all border border-slate-200 cursor-pointer"
                                    title="Editar Veículo"
                                  >
                                    <Pencil className="w-4 h-4 text-brand-blue bg-white rounded-sm shrink-0 p-[2px] shadow-sm" /> Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteVenda(v)}
                                    className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 px-2 py-1 rounded-lg text-[11px] font-bold transition-all border border-red-200 cursor-pointer"
                                    title="Excluir / Desvincular Veículo"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                              <div className="text-[11px] text-gray-600 mt-1 flex justify-between">
                                <span>Valor de Venda: <strong className="text-emerald-700 font-bold">R$ {valorVenda}</strong></span>
                                {dataVenda && <span>Data: <strong>{dataVenda}</strong></span>}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">Nenhum veículo comprado cadastrado.</p>
                )}
              </div>

              {/* Form de Edição Rápida */}
              <form id="form-edit-cliente" onSubmit={handleSaveCliente} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Telefone / Celular
                    </label>
                    <input
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      CPF / CNPJ
                    </label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={formData.cpfCnpj}
                      onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Status no Funil de Vendas
                  </label>
                  <select
                    value={formData.statusFunil}
                    onChange={(e) => setFormData({ ...formData, statusFunil: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-blue"
                  >
                    <option value="Novo Lead">Novo Lead</option>
                    <option value="Em Contato">Em Contato</option>
                    <option value="Ficha em Análise">Ficha em Análise</option>
                    <option value="Fechado">Fechado (Vendido)</option>
                    <option value="Perdido">Perdido</option>
                  </select>
                </div>
              </form>
            </div>

            {/* Rodapé Modal */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => handleDeleteCliente(selectedCliente.id, selectedCliente.nome)}
                className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
              >
                🗑️ Excluir Cliente
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="form-edit-cliente"
                  disabled={formLoading}
                  className="px-6 py-2 rounded-xl bg-brand-blue hover:opacity-90 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {formLoading ? "Salvando..." : "💾 Salvar Alterações"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
