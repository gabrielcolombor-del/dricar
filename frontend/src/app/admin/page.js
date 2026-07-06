"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("estoque"); // estoque, vendas, cadastrar

  // Estado para cadastro/edição
  const [editingCar, setEditingCar] = useState(null);
  const [formCar, setFormCar] = useState({
    title: "",
    subtitle: "",
    year: "",
    mileage: "",
    transmission: "Manual",
    price: "",
    imageUrl: "",
    category: "Hatch",
    accessories: "",
  });

  // Estado para modal de CRM (Venda)
  const [showCrmModal, setShowCrmModal] = useState(false);
  const [crmData, setCrmData] = useState({
    id: "",
    buyerName: "",
    salePrice: "",
    saleDate: new Date().toISOString().split("T")[0],
  });

  // Verifica autenticação inicial
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/auth");
        if (res.ok) {
          const data = await res.json();
          if (data.isAuthenticated) {
            setIsAuthenticated(true);
            fetchCars();
          }
        }
      } catch (err) {
        console.error("Erro ao verificar autenticação:", err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  // Busca todos os carros (ativos e vendidos)
  async function fetchCars() {
    setLoading(true);
    try {
      const res = await fetch("/api/cars?all=true");
      if (res.ok) {
        const data = await res.json();
        setCars(data);
      } else {
        setError("Erro ao carregar dados dos veículos.");
      }
    } catch (err) {
      setError("Erro ao se comunicar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  // Login do Administrador
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        fetchCars();
      } else {
        const data = await res.json();
        setError(data.error || "Senha incorreta.");
      }
    } catch (err) {
      setError("Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  };

  // Logout do Administrador
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/admin/auth", { method: "DELETE" });
      if (res.ok) {
        setIsAuthenticated(false);
        setCars([]);
        setPassword("");
      }
    } catch (err) {
      console.error("Erro ao efetuar logout:", err);
    }
  };

  // Mascaras de preenchimento
  const handlePriceChange = (val) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return setFormCar(prev => ({ ...prev, price: "" }));
    const formatted = "R$ " + Number(clean).toLocaleString("pt-BR");
    setFormCar(prev => ({ ...prev, price: formatted }));
  };

  const handleMileageChange = (val) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return setFormCar(prev => ({ ...prev, mileage: "" }));
    const formatted = Number(clean).toLocaleString("pt-BR") + " km";
    setFormCar(prev => ({ ...prev, mileage: formatted }));
  };

  const handleCrmPriceChange = (val) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return setCrmData(prev => ({ ...prev, salePrice: "" }));
    const formatted = "R$ " + Number(clean).toLocaleString("pt-BR");
    setCrmData(prev => ({ ...prev, salePrice: formatted }));
  };

  // Submeter Criação / Edição de Carro
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");

    const action = editingCar ? "update" : "create";
    const requestBody = {
      action,
      car: {
        ...formCar,
        // Garante que os acessórios virem string normal ao enviar
        accessories: typeof formCar.accessories === "string" 
          ? formCar.accessories 
          : formCar.accessories.join(", "),
      },
    };

    if (editingCar) {
      requestBody.id = editingCar.id;
    }

    try {
      const res = await fetch("/api/admin/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await res.json();
      if (result.success) {
        setFormCar({
          title: "",
          subtitle: "",
          year: "",
          mileage: "",
          transmission: "Manual",
          price: "",
          imageUrl: "",
          category: "Hatch",
          accessories: "",
        });
        setEditingCar(null);
        setActiveTab("estoque");
        fetchCars();
      } else {
        setError(result.error || "Ocorreu um erro ao atualizar a planilha.");
      }
    } catch (err) {
      setError("Erro ao salvar alterações.");
    } finally {
      setActionLoading(false);
    }
  };

  // Excluir Veículo
  const handleDeleteCar = async (id) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este veículo da planilha?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const result = await res.json();
      if (result.success) {
        fetchCars();
      } else {
        alert(result.error || "Falha ao excluir.");
      }
    } catch (err) {
      alert("Erro ao excluir.");
    } finally {
      setActionLoading(false);
    }
  };

  // Abrir modal de venda
  const openCrmModal = (car) => {
    setCrmData({
      id: car.id,
      buyerName: "",
      salePrice: car.price, // Preço sugerido como padrão
      saleDate: new Date().toISOString().split("T")[0],
    });
    setShowCrmModal(true);
  };

  // Confirmar Venda (CRM)
  const handleConfirmSale = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setShowCrmModal(false);
    try {
      const res = await fetch("/api/admin/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateStatus",
          id: crmData.id,
          status: "Vendido",
          buyerName: crmData.buyerName,
          salePrice: crmData.salePrice,
          saleDate: crmData.saleDate,
        }),
      });
      const result = await res.json();
      if (result.success) {
        fetchCars();
      } else {
        alert(result.error || "Falha ao registrar venda.");
      }
    } catch (err) {
      alert("Erro ao registrar venda.");
    } finally {
      setActionLoading(false);
    }
  };

  // Reativar Carro Sold (Mudar de Vendido para Ativo)
  const handleReactivateCar = async (id) => {
    setActionLoading(true);
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
        fetchCars();
      } else {
        alert(result.error || "Falha ao reativar carro.");
      }
    } catch (err) {
      alert("Erro ao reativar.");
    } finally {
      setActionLoading(false);
    }
  };

  // Iniciar Edição de Carro
  const startEditCar = (car) => {
    setEditingCar(car);
    setFormCar({
      title: car.title || "",
      subtitle: car.subtitle || "",
      year: car.year || "",
      mileage: car.mileage || "",
      transmission: car.transmission || "Manual",
      price: car.price || "",
      imageUrl: car.imageUrl || "",
      category: car.category || "Hatch",
      accessories: Array.isArray(car.accessories) 
        ? car.accessories.join(", ") 
        : car.accessories || "",
    });
    setActiveTab("cadastrar");
  };

  // Filtros de listagem
  const activeCars = cars.filter(c => !c.status || c.status.toLowerCase() === "ativo");
  const soldCars = cars.filter(c => c.status && c.status.toLowerCase() === "vendido");

  // Estatísticas CRM
  const totalSalesRevenue = soldCars.reduce((acc, curr) => {
    const val = Number(curr.salePrice ? curr.salePrice.replace(/\D/g, "") : curr.price.replace(/\D/g, ""));
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const averageSalePrice = soldCars.length > 0 ? totalSalesRevenue / soldCars.length : 0;

  if (loading && cars.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-brand-blue text-lg font-bold animate-pulse">Carregando painel administrativo...</div>
        </main>
        <Footer />
      </div>
    );
  }

  // TELA DE LOGIN (Sem Autenticação)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <Header />
        <main className="flex-grow flex items-center justify-center p-6">
          <div className="bg-white border border-gray-200 rounded-[20px] p-8 w-full max-w-[450px] shadow-lg">
            <h2 className="text-[28px] font-extrabold text-brand-blue uppercase mb-2 text-center">Acesso Restrito</h2>
            <p className="text-gray-500 text-sm text-center mb-6">Digite a senha da Dri-Car para gerenciar o estoque e ver dados de vendas.</p>
            
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Senha do Administrador</label>
                <input 
                  type="password"
                  placeholder="Digite sua senha..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue bg-white"
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 text-xs font-semibold bg-red-50 p-3 rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-3 font-semibold text-sm hover:opacity-90 transition-opacity">
                Entrar no Painel
              </button>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // PAINEL DE CONTROLE (Autenticado)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Header />
      
      <main className="flex-grow w-full max-w-[1200px] mx-auto py-10 px-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-[32px] font-extrabold text-brand-blue uppercase leading-none">Painel Administrativo</h1>
            <p className="text-gray-500 text-sm mt-2">Dri-Car Veículos & CRM Integrado</p>
          </div>
          <button 
            onClick={handleLogout}
            className="border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Sair do Painel
          </button>
        </div>

        {/* Tabs Menu */}
        <div className="flex border-b border-gray-200 mb-8 gap-6 overflow-x-auto">
          <button 
            onClick={() => { setActiveTab("estoque"); setEditingCar(null); }}
            className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === "estoque" ? "border-brand-blue text-brand-blue" : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            📦 Estoque Ativo ({activeCars.length})
          </button>
          <button 
            onClick={() => { setActiveTab("vendas"); setEditingCar(null); }}
            className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === "vendas" ? "border-brand-blue text-brand-blue" : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            💰 Histórico de Vendas ({soldCars.length})
          </button>
          <button 
            onClick={() => {
              setEditingCar(null);
              setFormCar({
                title: "",
                subtitle: "",
                year: "",
                mileage: "",
                transmission: "Manual",
                price: "",
                imageUrl: "",
                category: "Hatch",
                accessories: "",
              });
              setActiveTab("cadastrar");
            }}
            className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === "cadastrar" ? "border-brand-blue text-brand-blue" : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            {editingCar ? "✏️ Editando Veículo" : "➕ Cadastrar Veículo"}
          </button>
        </div>

        {/* Indicadores CRM nas abas principais */}
        {activeTab !== "cadastrar" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <span className="text-xs text-gray-400 font-bold uppercase">Faturamento (CRM)</span>
              <h3 className="text-2xl font-extrabold text-brand-blue mt-1">R$ {totalSalesRevenue.toLocaleString("pt-BR")}</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <span className="text-xs text-gray-400 font-bold uppercase">Carros Vendidos</span>
              <h3 className="text-2xl font-extrabold text-green-600 mt-1">{soldCars.length} veículos</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <span className="text-xs text-gray-400 font-bold uppercase">Ticket Médio</span>
              <h3 className="text-2xl font-extrabold text-brand-blue mt-1">R$ {Math.round(averageSalePrice).toLocaleString("pt-BR")}</h3>
            </div>
          </div>
        )}

        {/* ERROS E LOADINGS DE AÇÃO */}
        {error && (
          <div className="text-red-600 text-sm font-semibold bg-red-50 p-4 rounded-lg border border-red-100 mb-6">
            {error}
          </div>
        )}
        {actionLoading && (
          <div className="text-brand-blue text-sm font-semibold bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6 animate-pulse">
            Processando gravação no Google Sheets... Aguarde.
          </div>
        )}

        {/* TAB 1: ESTOQUE ATIVO */}
        {activeTab === "estoque" && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">ID</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Veículo</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Ano</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">KM</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Categoria</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Preço</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeCars.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-400 text-sm">Nenhum veículo ativo em estoque.</td>
                    </tr>
                  ) : (
                    activeCars.map((car) => (
                      <tr key={car.id} className="hover:bg-gray-50/50">
                        <td className="p-4 text-sm font-bold text-gray-600">{car.id}</td>
                        <td className="p-4">
                          <div className="font-bold text-brand-blue text-sm">{car.title}</div>
                          <div className="text-gray-400 text-xs">{car.subtitle}</div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">{car.year}</td>
                        <td className="p-4 text-sm text-gray-600">{car.mileage}</td>
                        <td className="p-4 text-sm"><span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-md font-medium">{car.category}</span></td>
                        <td className="p-4 text-sm font-bold text-brand-blue">{car.price}</td>
                        <td className="p-4">
                          <div className="flex justify-center items-center gap-3">
                            <button 
                              onClick={() => openCrmModal(car)}
                              className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            >
                              Marcar Vendido
                            </button>
                            <button 
                              onClick={() => startEditCar(car)}
                              className="border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => handleDeleteCar(car.id)}
                              className="border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            >
                              Excluir
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

        {/* TAB 2: HISTÓRICO DE VENDAS (CRM) */}
        {activeTab === "vendas" && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">ID</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Veículo</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Comprador (CRM)</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Data Venda</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Preço Venda</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {soldCars.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-400 text-sm">Nenhuma venda registrada no histórico.</td>
                    </tr>
                  ) : (
                    soldCars.map((car) => (
                      <tr key={car.id} className="hover:bg-gray-50/50">
                        <td className="p-4 text-sm font-bold text-gray-600">{car.id}</td>
                        <td className="p-4">
                          <div className="font-bold text-brand-blue text-sm">{car.title}</div>
                          <div className="text-gray-400 text-xs">{car.subtitle}</div>
                        </td>
                        <td className="p-4 text-sm font-semibold text-gray-700">{car.buyerName || "Não informado"}</td>
                        <td className="p-4 text-sm text-gray-600">
                          {car.saleDate ? new Date(car.saleDate).toLocaleDateString("pt-BR", {timeZone: 'UTC'}) : "Não informado"}
                        </td>
                        <td className="p-4 text-sm font-bold text-green-600">{car.salePrice || car.price}</td>
                        <td className="p-4">
                          <div className="flex justify-center items-center gap-3">
                            <button 
                              onClick={() => handleReactivateCar(car.id)}
                              className="border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            >
                              Reativar para Estoque
                            </button>
                            <button 
                              onClick={() => handleDeleteCar(car.id)}
                              className="border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
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

        {/* TAB 3: CADASTRO E EDIÇÃO DE CARROS */}
        {activeTab === "cadastrar" && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm max-w-[800px] mx-auto">
            <h3 className="text-xl font-extrabold text-brand-blue uppercase mb-6">
              {editingCar ? `Editar Veículo (ID: ${editingCar.id})` : "Cadastrar Novo Veículo"}
            </h3>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Marca / Modelo</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Ford Ka"
                    value={formCar.title}
                    onChange={(e) => setFormCar(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Versão / Motorização</label>
                  <input 
                    type="text" 
                    placeholder="Ex: SE 1.0 MT FLEX"
                    value={formCar.subtitle}
                    onChange={(e) => setFormCar(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Ano</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 2016/2017"
                    value={formCar.year}
                    onChange={(e) => setFormCar(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Quilometragem (KM)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 51.000 km"
                    value={formCar.mileage}
                    onChange={(e) => handleMileageChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Preço (R$)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: R$ 44.599"
                    value={formCar.price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Categoria</label>
                  <select 
                    value={formCar.category}
                    onChange={(e) => setFormCar(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white"
                  >
                    <option value="Hatch">Hatch</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUVs">SUVs</option>
                    <option value="Picape">Picape</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Câmbio</label>
                  <select 
                    value={formCar.transmission}
                    onChange={(e) => setFormCar(prev => ({ ...prev, transmission: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automático">Automático</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Link da Imagem</label>
                  <input 
                    type="text" 
                    placeholder="Ex: /images/hatch.png ou URL"
                    value={formCar.imageUrl}
                    onChange={(e) => setFormCar(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Acessórios (Separados por vírgula)</label>
                <textarea 
                  placeholder="Ex: Ar Condicionado, Vidros Elétricos, Freio ABS"
                  value={formCar.accessories}
                  onChange={(e) => setFormCar(prev => ({ ...prev, accessories: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white h-24"
                />
              </div>

              <div className="flex gap-4 justify-end mt-4">
                <button 
                  type="button"
                  onClick={() => { setActiveTab("estoque"); setEditingCar(null); }}
                  className="border border-gray-300 hover:bg-gray-100 text-gray-700 px-6 py-3 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className="bg-brand-blue hover:opacity-90 text-white px-8 py-3 rounded-lg text-sm font-semibold transition-opacity"
                >
                  {editingCar ? "Salvar Alterações" : "Cadastrar Veículo"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* MODAL: MARCAR COMO VENDIDO (CRM CRM CRM) */}
      {showCrmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-[20px] p-8 w-full max-w-[450px] shadow-2xl relative">
            <h3 className="text-lg font-bold text-brand-blue uppercase mb-2">Registrar Venda (CRM)</h3>
            <p className="text-gray-500 text-xs mb-6">Preencha os dados do comprador para salvar no histórico de faturamento.</p>
            
            <form onSubmit={handleConfirmSale} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Nome do Comprador</label>
                <input 
                  type="text"
                  placeholder="Nome do cliente..."
                  value={crmData.buyerName}
                  onChange={(e) => setCrmData(prev => ({ ...prev, buyerName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Preço de Venda</label>
                  <input 
                    type="text"
                    placeholder="R$ 0"
                    value={crmData.salePrice}
                    onChange={(e) => handleCrmPriceChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Data da Venda</label>
                  <input 
                    type="date"
                    value={crmData.saleDate}
                    onChange={(e) => setCrmData(prev => ({ ...prev, saleDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-4">
                <button 
                  type="button"
                  onClick={() => setShowCrmModal(false)}
                  className="border border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Confirmar Venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
