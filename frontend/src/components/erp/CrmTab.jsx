"use client";

import { useState, useEffect } from "react";

const COLUNAS = [
  { id: "Novo Lead", title: "Novo Lead", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  { id: "Em Contato", title: "Em Contato", color: "bg-indigo-500/10 text-indigo-700 border-indigo-200" },
  { id: "Ficha em Análise", title: "Ficha em Análise", color: "bg-amber-500/10 text-amber-700 border-amber-200" },
  { id: "Fechado", title: "Fechado (Vendido)", color: "bg-green-500/10 text-green-700 border-green-200" },
  { id: "Perdido", title: "Perdido", color: "bg-red-500/10 text-red-700 border-red-200" }
];

export default function CrmTab() {
  const [leads, setLeads] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [soldCars, setSoldCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subTab, setSubTab] = useState("kanban"); // kanban ou vendas_catalogo

  // Modais
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // States
  const [selectedLead, setSelectedLead] = useState(null);

  // Form Lead
  const [formLead, setFormLead] = useState({
    id: "",
    nome: "",
    telefone: "",
    cpfCnpj: "",
    statusFunil: "Novo Lead",
    veiculoInteresseId: "",
  });

  // Form Venda
  const [formVenda, setFormVenda] = useState({
    valorVendaVeiculo: "",
    valorRetornoBancario: "",
    dataVenda: new Date().toISOString().split("T")[0],
  });

  async function fetchCRMData() {
    setLoading(true);
    try {
      const [leadsRes, veiculosRes, carsRes] = await Promise.all([
        fetch("/api/admin/erp/crm"),
        fetch("/api/admin/erp/veiculos"),
        fetch("/api/cars?all=true")
      ]);

      if (leadsRes.ok && veiculosRes.ok && carsRes.ok) {
        const leadsData = await leadsRes.json();
        const veiculosData = await veiculosRes.json();
        const carsData = await carsRes.json();
        
        setLeads(leadsData);
        setVeiculos(veiculosData);
        
        // Filtrar carros vendidos do catálogo do site
        const filteredSold = carsData.filter(c => c.status === "Vendido");
        setSoldCars(filteredSold);
      } else {
        setError("Erro ao carregar dados do CRM.");
      }
    } catch (err) {
      setError("Erro ao carregar dados do servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCRMData();
  }, []);

  const veiculosDisponiveis = veiculos.filter(v => v.status === "Disponível");

  // Drag and Drop handlers
  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData("text/plain", leadId);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain");
    if (!leadId) return;

    // Se mover para "Fechado", deve forçar a abertura do modal de vendas
    if (targetStatus === "Fechado") {
      const leadObj = leads.find(l => l.id === leadId);
      if (leadObj) {
        if (!leadObj.veiculoInteresseId) {
          alert("Por favor, vincule um veículo de interesse ao lead antes de registrar a venda.");
          return;
        }
        openRegisterSale(leadObj);
      }
      return;
    }

    // Se não, atualiza direto
    await updateLeadStatus(leadId, targetStatus);
  };

  const updateLeadStatus = async (leadId, newStatus) => {
    try {
      const res = await fetch("/api/admin/erp/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateStatus",
          id: leadId,
          statusFunil: newStatus,
        }),
      });

      if (res.ok) {
        fetchCRMData();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao atualizar status.");
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  // Mascaras
  const handleTelefoneChange = (val) => {
    const clean = val.replace(/\D/g, "");
    let formatted = clean;
    if (clean.length > 2) {
      formatted = `(${clean.substring(0, 2)}) ` + clean.substring(2);
    }
    if (clean.length > 7) {
      formatted = `(${clean.substring(0, 2)}) ` + clean.substring(2, 7) + "-" + clean.substring(7, 11);
    }
    setFormLead(prev => ({ ...prev, telefone: formatted }));
  };

  const handleCpfChange = (val) => {
    const clean = val.replace(/\D/g, "").substring(0, 14);
    let formatted = clean;
    if (clean.length > 3) {
      formatted = clean.substring(0, 3) + "." + clean.substring(3);
    }
    if (clean.length > 6) {
      formatted = clean.substring(0, 3) + "." + clean.substring(3, 6) + "." + clean.substring(6);
    }
    if (clean.length > 9) {
      formatted = clean.substring(0, 3) + "." + clean.substring(3, 6) + "." + clean.substring(6, 9) + "-" + clean.substring(9, 11);
    }
    setFormLead(prev => ({ ...prev, cpfCnpj: formatted }));
  };

  const handlePriceChange = (val, field) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return setFormVenda(prev => ({ ...prev, [field]: "" }));
    const formatted = "R$ " + Number(clean).toLocaleString("pt-BR");
    setFormVenda(prev => ({ ...prev, [field]: formatted }));
  };

  // Salvar Lead (Criar / Editar)
  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/erp/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formLead),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowLeadModal(false);
        setFormLead({
          id: "",
          nome: "",
          telefone: "",
          cpfCnpj: "",
          statusFunil: "Novo Lead",
          veiculoInteresseId: "",
        });
        fetchCRMData();
      } else {
        setFormError(data.error || "Erro ao salvar lead.");
      }
    } catch (err) {
      setFormError("Erro de rede.");
    } finally {
      setFormLoading(false);
    }
  };

  // Excluir Lead
  const handleDeleteLead = async (id) => {
    if (!confirm("Deseja excluir permanentemente este lead?")) return;
    try {
      const res = await fetch("/api/admin/erp/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (res.ok) {
        fetchCRMData();
      } else {
        alert("Erro ao excluir.");
      }
    } catch (err) {
      alert("Erro de rede.");
    }
  };

  // Iniciar Edição do Lead
  const startEditLead = (lead) => {
    setFormLead({
      id: lead.id,
      nome: lead.nome,
      telefone: lead.telefone,
      cpfCnpj: lead.cpfCnpj,
      statusFunil: lead.statusFunil,
      veiculoInteresseId: lead.veiculoInteresseId || "",
    });
    setFormError("");
    setShowLeadModal(true);
  };

  // Abrir Modal de Vendas
  const openRegisterSale = (lead) => {
    setSelectedLead(lead);
    let defaultPrice = "";
    if (lead.veiculoInteresse) {
      defaultPrice = "R$ " + Number(lead.veiculoInteresse.valorCompra * 1.15).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
    }
    setFormVenda({
      valorVendaVeiculo: defaultPrice,
      valorRetornoBancario: "",
      dataVenda: new Date().toISOString().split("T")[0],
    });
    setFormError("");
    setShowSaleModal(true);
  };

  // Submeter Venda
  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;
    setFormLoading(true);
    setFormError("");

    const vendaVal = parseFloat(formVenda.valorVendaVeiculo.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());
    const retornoVal = parseFloat(formVenda.valorRetornoBancario.replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;

    if (isNaN(vendaVal) || vendaVal <= 0) {
      setFormError("Informe um preço de venda válido.");
      setFormLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/erp/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          veiculoId: selectedLead.veiculoInteresseId,
          clienteId: selectedLead.id,
          valorVendaVeiculo: vendaVal,
          valorRetornoBancario: retornoVal,
          dataVenda: formVenda.dataVenda,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowSaleModal(false);
        setSelectedLead(null);
        fetchCRMData();
      } else {
        setFormError(data.error || "Erro ao registrar venda.");
      }
    } catch (err) {
      setFormError("Erro de rede.");
    } finally {
      setFormLoading(false);
    }
  };

  // Reativar Carro do Catálogo do Site
  const handleReactivateCar = async (id) => {
    if (!confirm("Tem certeza que deseja reativar este veículo para o catálogo ativo do site?")) return;
    try {
      const res = await fetch("/api/admin/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateStatus",
          id,
          status: "Ativo",
        }),
      });
      const result = await res.json();
      if (result.success) {
        // Encontrar o veículo do ERP atrelado a este carro e reativar também
        const targetCar = soldCars.find(c => c.id === id);
        if (targetCar && targetCar.veiculoId) {
          await fetch("/api/admin/erp/veiculos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "updateStatus",
              id: targetCar.veiculoId,
              status: "Disponível",
            }),
          });
        }
        fetchCRMData();
      } else {
        alert(result.error || "Falha ao reativar carro.");
      }
    } catch (err) {
      alert("Erro ao reativar.");
    }
  };

  // Excluir Registro de Carro Vendido no Catálogo
  const handleDeleteCar = async (id) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este registro de venda do site?")) return;
    try {
      const res = await fetch("/api/admin/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const result = await res.json();
      if (result.success) {
        fetchCRMData();
      } else {
        alert(result.error || "Falha ao excluir.");
      }
    } catch (err) {
      alert("Erro de rede ao excluir.");
    }
  };

  return (
    <div className="space-y-6 text-gray-800 animate-fade-in">
      {/* Top Banner and Quick Add */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-extrabold text-brand-blue text-sm uppercase tracking-wider">Gestão Comercial - ERP & CRM</h4>
          <p className="text-xs text-gray-400">Controle o funil do CRM, movimente leads no Kanban e confira o histórico de faturamento de vendas do site.</p>
        </div>
        
        {/* Toggle subtabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 text-xs font-bold border border-gray-200 shrink-0 select-none">
          <button
            onClick={() => setSubTab("kanban")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              subTab === "kanban" ? "bg-white text-brand-blue shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            📋 Quadro Kanban
          </button>
          <button
            onClick={() => setSubTab("vendas_catalogo")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              subTab === "vendas_catalogo" ? "bg-white text-brand-blue shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            💰 Vendas Catálogo ({soldCars.length})
          </button>
        </div>

        {subTab === "kanban" && (
          <button
            onClick={() => {
              setFormLead({
                id: "",
                nome: "",
                telefone: "",
                cpfCnpj: "",
                statusFunil: "Novo Lead",
                veiculoInteresseId: "",
              });
              setFormError("");
              setShowLeadModal(true);
            }}
            className="bg-brand-blue hover:opacity-90 text-white font-bold text-xs px-5 py-3 rounded-lg flex items-center justify-center gap-1.5 transition-all self-end sm:self-auto cursor-pointer"
          >
            ➕ Novo Lead
          </button>
        )}
      </div>

      {/* RENDER KANBAN FUNNEL */}
      {subTab === "kanban" && (
        loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
            {COLUNAS.map(col => {
              const leadsNaColuna = leads.filter(l => l.statusFunil === col.id);
              return (
                <div
                  key={col.id}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDrop(e, col.id)}
                  className="bg-gray-50 border border-gray-200 rounded-2xl p-4 min-w-[220px] flex flex-col gap-4 min-h-[500px]"
                >
                  {/* Column Header */}
                  <div className={`p-2.5 rounded-xl border text-center font-bold text-xs uppercase ${col.color}`}>
                    {col.title} ({leadsNaColuna.length})
                  </div>

                  {/* Card list */}
                  <div className="flex-grow space-y-3 overflow-y-auto max-h-[550px] pr-1">
                    {leadsNaColuna.length === 0 ? (
                      <div className="text-center text-[10px] text-gray-400 py-10 border border-dashed border-gray-200 rounded-xl">
                        Solte leads aqui
                      </div>
                    ) : (
                      leadsNaColuna.map(lead => (
                        <div
                          key={lead.id}
                          draggable={lead.statusFunil !== "Fechado"}
                          onDragStart={e => handleDragStart(e, lead.id)}
                          className={`bg-white border border-gray-155 p-3.5 rounded-xl shadow-sm hover:shadow transition-shadow flex flex-col gap-2 relative ${
                            lead.statusFunil === "Fechado" 
                              ? "border-green-300 opacity-90 cursor-default" 
                              : "cursor-grab active:cursor-grabbing"
                          }`}
                        >
                          {/* Title & Actions */}
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-extrabold text-xs text-gray-800 break-words block pr-4">
                              {lead.nome}
                            </span>
                            <div className="flex gap-1.5 absolute top-2.5 right-2">
                              {lead.statusFunil !== "Fechado" && (
                                <button
                                  onClick={() => startEditLead(lead)}
                                  className="text-[10px] text-gray-400 hover:text-brand-blue"
                                  title="Editar Lead"
                                >
                                  ✏️
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                className="text-[10px] text-gray-400 hover:text-red-500"
                                title="Excluir Lead"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {/* Contacts */}
                          <div className="space-y-1 text-[10px] text-gray-500 font-medium">
                            <p className="flex items-center gap-1">
                              📞 {lead.telefone}
                            </p>
                            {lead.cpfCnpj && (
                              <p className="flex items-center gap-1 font-mono text-[9px]">
                                🪪 {lead.cpfCnpj}
                              </p>
                            )}
                          </div>

                          {/* Vehicle of Interest */}
                          <div className="bg-gray-50/70 border border-gray-100 p-2 rounded-lg text-[10px] flex flex-col">
                            <span className="text-[8px] text-gray-400 uppercase font-bold block">Interesse</span>
                            {lead.veiculoInteresse ? (
                              <div className="font-semibold text-brand-blue flex justify-between gap-1 items-center mt-0.5">
                                <span className="truncate">{lead.veiculoInteresse.marca} {lead.veiculoInteresse.modelo}</span>
                                <span className="bg-brand-blue/10 text-brand-blue px-1 rounded font-mono font-bold shrink-0">{lead.veiculoInteresse.placa}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic mt-0.5">Não vinculado</span>
                            )}
                          </div>

                          {/* Mobile navigation / Register Sale button */}
                          <div className="flex flex-wrap justify-between items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                            {lead.statusFunil !== "Fechado" && lead.statusFunil !== "Perdido" && (
                              <div className="flex gap-1.5">
                                {/* Move back */}
                                {col.id !== "Novo Lead" && (
                                  <button
                                    onClick={() => {
                                      const colIndex = COLUNAS.findIndex(c => c.id === col.id);
                                      updateLeadStatus(lead.id, COLUNAS[colIndex - 1].id);
                                    }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-1 rounded text-[10px]"
                                    title="Voltar Funil"
                                  >
                                    ◀
                                  </button>
                                )}
                                {/* Move forward */}
                                <button
                                  onClick={() => {
                                    const colIndex = COLUNAS.findIndex(c => c.id === col.id);
                                    const nextStatus = COLUNAS[colIndex + 1].id;
                                    if (nextStatus === "Fechado") {
                                      if (!lead.veiculoInteresseId) {
                                        alert("Por favor, vincule um veículo ao lead para registrar venda.");
                                        return;
                                      }
                                      openRegisterSale(lead);
                                    } else {
                                      updateLeadStatus(lead.id, nextStatus);
                                    }
                                  }}
                                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-1 rounded text-[10px]"
                                  title="Avançar Funil"
                                >
                                  ▶
                                </button>
                              </div>
                            )}

                            {lead.statusFunil !== "Fechado" && lead.veiculoInteresseId && (
                              <button
                                onClick={() => openRegisterSale(lead)}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold text-[9px] px-2 py-1 rounded transition-colors ml-auto cursor-pointer"
                              >
                                Registrar Venda
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* RENDER WEBSITE SALES HISTORY (Moved Tab) */}
      {subTab === "vendas_catalogo" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">ID</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Veículo</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Comprador (CRM)</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Data Venda</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Preço Venda</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {soldCars.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-400 text-xs">Nenhuma venda de catálogo registrada.</td>
                  </tr>
                ) : (
                  soldCars.map((car) => (
                    <tr key={car.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-xs font-mono text-gray-400">#{car.id.substring(0, 8)}</td>
                      <td className="p-4">
                        <div className="font-bold text-brand-blue text-xs flex items-center gap-3">
                          {car.imageUrl && (
                            <img src={car.imageUrl} alt="" className="w-10 h-8 rounded object-cover bg-gray-100" />
                          )}
                          {car.title}
                        </div>
                        <div className="text-gray-450 text-[10px] mt-0.5">{car.subtitle}</div>
                      </td>
                      <td className="p-4 text-xs font-semibold text-gray-700">{car.buyerName || "Não informado"}</td>
                      <td className="p-4 text-xs text-gray-500">
                        {car.saleDate ? new Date(car.saleDate).toLocaleDateString("pt-BR", {timeZone: 'UTC'}) : "Não informado"}
                      </td>
                      <td className="p-4 text-xs font-bold text-green-600">{car.salePrice || car.price}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleReactivateCar(car.id)}
                            className="border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Reativar para Catálogo
                          </button>
                          <button 
                            onClick={() => handleDeleteCar(car.id)}
                            className="border border-red-200 text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Excluir Registro
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
      )}

      {/* Modal Lead */}
      {showLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-[450px] shadow-2xl relative">
            <h3 className="text-md font-bold text-brand-blue uppercase mb-4">
              {formLead.id ? "Editar Lead" : "Cadastrar Novo Lead"}
            </h3>

            <form onSubmit={handleLeadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Nome do cliente..."
                  value={formLead.nome}
                  onChange={(e) => setFormLead(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Telefone</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 99999-9999"
                    value={formLead.telefone}
                    onChange={(e) => handleTelefoneChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">CPF / CNPJ</label>
                  <input
                    type="text"
                    placeholder="Ex: 000.000.000-00"
                    value={formLead.cpfCnpj}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Status Funil</label>
                  <select
                    value={formLead.statusFunil}
                    onChange={(e) => setFormLead(prev => ({ ...prev, statusFunil: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                    disabled={formLead.statusFunil === "Fechado"}
                  >
                    <option value="Novo Lead">Novo Lead</option>
                    <option value="Em Contato">Em Contato</option>
                    <option value="Ficha em Análise">Ficha em Análise</option>
                    <option value="Perdido">Perdido</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Veículo de Interesse</label>
                  <select
                    value={formLead.veiculoInteresseId}
                    onChange={(e) => setFormLead(prev => ({ ...prev, veiculoInteresseId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                  >
                    <option value="">Nenhum</option>
                    {veiculosDisponiveis.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.marca} {v.modelo} ({v.placa})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formError && (
                <p className="text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg">{formError}</p>
              )}

              <div className="flex gap-4 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowLeadModal(false)}
                  className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-brand-blue text-white px-6 py-2.5 rounded-lg font-bold hover:opacity-90 transition-opacity"
                >
                  {formLoading ? "Salvando..." : "Confirmar Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Venda (F&I) */}
      {showSaleModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-[450px] shadow-2xl relative">
            <h3 className="text-md font-bold text-green-700 uppercase mb-2">Registrar Venda (Conversão CRM)</h3>
            <p className="text-xs text-gray-500 mb-4">
              Registrar faturamento da venda do veículo para <strong>{selectedLead.nome}</strong>.
            </p>

            <form onSubmit={handleSaleSubmit} className="space-y-4 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 flex flex-col gap-1">
                <span className="text-[9px] text-gray-400 font-bold uppercase">Carro Vendido</span>
                {selectedLead.veiculoInteresse ? (
                  <span className="font-bold text-brand-blue">
                    {selectedLead.veiculoInteresse.marca} {selectedLead.veiculoInteresse.modelo} ({selectedLead.veiculoInteresse.placa})
                  </span>
                ) : (
                  <span className="text-red-500 font-bold">Erro: Nenhum veículo atrelado</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Preço de Venda (Carro)</label>
                  <input
                    type="text"
                    placeholder="R$ 0"
                    value={formVenda.valorVendaVeiculo}
                    onChange={(e) => handlePriceChange(e.target.value, "valorVendaVeiculo")}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white font-bold text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Retorno Bancário (F&I)</label>
                  <input
                    type="text"
                    placeholder="R$ 0"
                    value={formVenda.valorRetornoBancario}
                    onChange={(e) => handlePriceChange(e.target.value, "valorRetornoBancario")}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white font-bold text-green-600"
                  />
                  <span className="text-[8px] text-gray-400 mt-1 block">Comissão da financeira</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Data da Venda</label>
                <input
                  type="date"
                  value={formVenda.dataVenda}
                  onChange={(e) => setFormVenda(prev => ({ ...prev, dataVenda: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                  required
                />
              </div>

              {formError && (
                <p className="text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg">{formError}</p>
              )}

              <div className="flex gap-4 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors"
                >
                  {formLoading ? "Registrando..." : "Confirmar Venda"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
