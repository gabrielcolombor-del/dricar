"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { signIn, signOut } from "next-auth/react";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null); // Armazena dados do funcionário logado
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("estoque"); // estoque, vendas, cadastrar

  // Estado para gerenciamento de usuários (Apenas Administrador)
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "seller",
  });

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

  // Upload de Foto Local
  const [uploadedImage, setUploadedImage] = useState(null); // Base64 comprimida
  const [uploadedImageName, setUploadedImageName] = useState("");
  const fileInputRef = useRef(null);

  // Estado para modal de CRM (Venda)
  const [showCrmModal, setShowCrmModal] = useState(false);
  const [crmData, setCrmData] = useState({
    id: "",
    buyerName: "",
    salePrice: "",
    saleDate: new Date().toISOString().split("T")[0],
  });

  // Identificação rápida dos cargos
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const isGerente = user?.role?.toLowerCase() === "manager" || user?.role?.toLowerCase() === "admin"; // Gerente ou Admin
  const isVendedor = user?.role?.toLowerCase() === "seller";

  // Tradução do cargo para exibição amigável
  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case "admin": return "Administrador";
      case "manager": return "Gerente";
      case "seller": return "Vendedor";
      default: return "Funcionário";
    }
  };

  // Verifica autenticação inicial usando a rota nativa do NextAuth
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const session = await res.json();
          if (session && session.user) {
            setIsAuthenticated(true);
            setUser(session.user);
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

  // Busca todos os usuários cadastrados (Apenas Admin)
  async function fetchUsers() {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      } else {
        const errData = await res.json();
        setError(errData.error || "Erro ao carregar lista de funcionários.");
      }
    } catch (err) {
      setError("Erro de rede ao buscar funcionários.");
    } finally {
      setUsersLoading(false);
    }
  }

  // Cria um novo usuário (Apenas Admin)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm),
      });

      if (res.ok) {
        setNewUserForm({
          name: "",
          email: "",
          password: "",
          role: "seller",
        });
        fetchUsers();
      } else {
        const errData = await res.json();
        setError(errData.error || "Erro ao criar funcionário.");
      }
    } catch (err) {
      setError("Erro ao se comunicar com o servidor.");
    } finally {
      setActionLoading(false);
    }
  };

  // Exclui um usuário (Apenas Admin)
  const handleDeleteUser = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta conta?")) return;
    setError("");
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const errData = await res.json();
        setError(errData.error || "Erro ao excluir funcionário.");
      }
    } catch (err) {
      setError("Erro ao se comunicar com o servidor.");
    } finally {
      setActionLoading(false);
    }
  };

  // Efeito para carregar usuários quando abrir a aba de gerenciamento
  useEffect(() => {
    if (activeTab === "usuarios" && isAdmin) {
      fetchUsers();
    }
  }, [activeTab]);

  // Login do Administrador/Funcionário via NextAuth
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Executa o signin no NextAuth usando o credentials provider
      const res = await signIn("credentials", {
        redirect: false,
        login,
        password,
      });

      if (res.ok && !res.error) {
        // Busca a sessão recém criada para recuperar dados do funcionário
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        
        setIsAuthenticated(true);
        setUser(session.user);
        
        if (session.user.role.toLowerCase() === "seller") {
          setActiveTab("estoque");
        }
        
        fetchCars();
      } else {
        setError(res.error || "Login ou senha incorretos.");
      }
    } catch (err) {
      setError("Erro ao se comunicar com o servidor de autenticação.");
    } finally {
      setLoading(false);
    }
  };

  // Logout via NextAuth
  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      setIsAuthenticated(false);
      setUser(null);
      setCars([]);
      setLogin("");
      setPassword("");
      clearUploadStates();
    } catch (err) {
      console.error("Erro ao efetuar logout:", err);
    }
  };

  // Limpa estados de imagem
  const clearUploadStates = () => {
    setUploadedImage(null);
    setUploadedImageName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Selecionar arquivo do dispositivo e comprimir no Canvas
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200; // Resolução otimizada para web
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Comprime como JPEG com 80% de qualidade (gera arquivos leves ~150KB)
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setUploadedImage(compressedDataUrl);
          setUploadedImageName(file.name.replace(/\.[^/.]+$/, "") + ".jpg");
          
          // Esvazia o input de texto do link para evitar ambiguidade
          setFormCar(prev => ({ ...prev, imageUrl: "" }));
        };
      };
      reader.readAsDataURL(file);
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
    if (isVendedor) return; 
    
    setActionLoading(true);
    setError("");

    let finalImageUrl = formCar.imageUrl;

    // 1. Se houver imagem local selecionada do celular, faz upload no Supabase Storage primeiro
    if (uploadedImage) {
      try {
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: uploadedImage, imageName: uploadedImageName }),
        });

        if (!uploadRes.ok) {
          throw new Error("Erro de comunicação com o servidor de upload.");
        }

        const uploadResult = await uploadRes.json();

        if (uploadResult.error) {
          throw new Error(uploadResult.error);
        }

        finalImageUrl = uploadResult.imageUrl;
      } catch (err) {
        setError(`Falha ao fazer upload da imagem: ${err.message}`);
        setActionLoading(false);
        return;
      }
    }

    // 2. Envia os dados do carro e a URL pública para o banco de dados (Prisma/PostgreSQL)
    const action = editingCar ? "update" : "create";
    const requestBody = {
      action,
      car: {
        ...formCar,
        imageUrl: finalImageUrl, // URL final salva no banco
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
        clearUploadStates();
        setEditingCar(null);
        setActiveTab("estoque");
        fetchCars();
      } else {
        setError(result.error || "Ocorreu um erro ao atualizar os dados.");
      }
    } catch (err) {
      setError("Erro ao salvar alterações no banco de dados.");
    } finally {
      setActionLoading(false);
    }
  };

  // Excluir Veículo
  const handleDeleteCar = async (id) => {
    if (!isAdmin) return; 
    
    if (!confirm("Tem certeza que deseja excluir permanentemente este veículo?")) return;
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
      salePrice: car.price,
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

  // Reativar Carro Sold
  const handleReactivateCar = async (id) => {
    if (isVendedor) return; 
    
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
    if (isVendedor) return;
    
    clearUploadStates();
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
            <h2 className="text-[28px] font-extrabold text-brand-blue uppercase mb-2 text-center">Painel Dri-Car</h2>
            <p className="text-gray-500 text-sm text-center mb-6">Autenticação de Funcionários (NextAuth)</p>
            
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Login / Usuário</label>
                <input 
                  type="text"
                  placeholder="Ex: admdricar"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue bg-white text-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Senha</label>
                <input 
                  type="password"
                  placeholder="Digite sua senha..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue bg-white text-gray-800"
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 text-xs font-semibold bg-red-50 p-3 rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-3 font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer">
                Acessar Sistema
              </button>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // PAINEL DE CONTROLE (Autenticado com RBAC)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Header />
      
      <main className="flex-grow w-full max-w-[1200px] mx-auto py-10 px-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-[32px] font-extrabold text-brand-blue uppercase leading-none">Painel de Controle</h1>
            <p className="text-gray-500 text-sm mt-2">
              Funcionário: <strong className="text-brand-blue">{user?.name}</strong> 
              <span className="ml-2 bg-brand-blue/10 text-brand-blue px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">{getRoleBadge(user?.role)}</span>
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Sair do Painel
          </button>
        </div>

        {/* Tabs Menu */}
        <div className="flex border-b border-gray-200 mb-8 gap-6 overflow-x-auto">
          <button 
            onClick={() => { setActiveTab("estoque"); setEditingCar(null); clearUploadStates(); }}
            className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === "estoque" ? "border-brand-blue text-brand-blue" : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            📦 Estoque Ativo ({activeCars.length})
          </button>

          {!isVendedor && (
            <button 
              onClick={() => { setActiveTab("vendas"); setEditingCar(null); clearUploadStates(); }}
              className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === "vendas" ? "border-brand-blue text-brand-blue" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              💰 Histórico de Vendas ({soldCars.length})
            </button>
          )}

          {!isVendedor && (
            <button 
              onClick={() => {
                setEditingCar(null);
                clearUploadStates();
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
              className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === "cadastrar" ? "border-brand-blue text-brand-blue" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              {editingCar ? "✏️ Editando Veículo" : "➕ Cadastrar Veículo"}
            </button>
          )}

          {isAdmin && (
            <button 
              onClick={() => { setActiveTab("usuarios"); setEditingCar(null); clearUploadStates(); }}
              className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === "usuarios" ? "border-brand-blue text-brand-blue" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              👥 Gerenciar Contas
            </button>
          )}
        </div>

        {/* Indicadores CRM (Apenas Admin) */}
        {activeTab !== "cadastrar" && activeTab !== "usuarios" && isAdmin && (
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

        {/* ERROS E LOADINGS */}
        {error && (
          <div className="text-red-600 text-sm font-semibold bg-red-50 p-4 rounded-lg border border-red-100 mb-6">
            {error}
          </div>
        )}
        {actionLoading && (
          <div className="text-brand-blue text-sm font-semibold bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6 animate-pulse">
            Processando gravação no banco de dados e upload de imagem no Supabase Storage... Aguarde.
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
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {activeCars.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-400 text-sm">Nenhum veículo ativo em estoque.</td>
                    </tr>
                  ) : (
                    activeCars.map((car) => (
                      <tr key={car.id} className="hover:bg-gray-50/50">
                        <td className="p-4 text-sm font-bold text-gray-600">{car.id.substring(0, 8)}...</td>
                        <td className="p-4">
                          <div className="font-bold text-brand-blue text-sm flex items-center gap-3">
                            {car.imageUrl && (
                              <img src={car.imageUrl} alt="" className="w-10 h-8 rounded object-cover bg-gray-100" />
                            )}
                            {car.title}
                          </div>
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
                              className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              Marcar Vendido
                            </button>
                            
                            {!isVendedor && (
                              <button 
                                onClick={() => startEditCar(car)}
                                className="border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                Editar
                              </button>
                            )}
                            {isAdmin && (
                              <button 
                                onClick={() => handleDeleteCar(car.id)}
                                className="border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                Excluir
                              </button>
                            )}
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

        {/* TAB 2: HISTÓRICO DE VENDAS */}
        {activeTab === "vendas" && !isVendedor && (
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
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {soldCars.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-400 text-sm">Nenhuma venda registrada no histórico.</td>
                    </tr>
                  ) : (
                    soldCars.map((car) => (
                      <tr key={car.id} className="hover:bg-gray-50/50">
                        <td className="p-4 text-sm font-bold text-gray-600">{car.id.substring(0, 8)}...</td>
                        <td className="p-4">
                          <div className="font-bold text-brand-blue text-sm flex items-center gap-3">
                            {car.imageUrl && (
                              <img src={car.imageUrl} alt="" className="w-10 h-8 rounded object-cover bg-gray-100" />
                            )}
                            {car.title}
                          </div>
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
                              className="border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              Reativar para Estoque
                            </button>
                            {isAdmin && (
                              <button 
                                onClick={() => handleDeleteCar(car.id)}
                                className="border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                Excluir Registro
                              </button>
                            )}
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
        {activeTab === "cadastrar" && !isVendedor && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm max-w-[800px] mx-auto">
            <h3 className="text-xl font-extrabold text-brand-blue uppercase mb-6">
              {editingCar ? `Editar Veículo (ID: ${editingCar.id.substring(0, 8)}...)` : "Cadastrar Novo Veículo"}
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
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Versão / Motorização (Descrição)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: SE 1.0 MT FLEX"
                    value={formCar.subtitle}
                    onChange={(e) => setFormCar(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white text-gray-800"
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
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white text-gray-800"
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
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white text-gray-800"
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
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white text-gray-800"
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
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white text-gray-800"
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
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white text-gray-800"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automático">Automático</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Imagem do Veículo</label>
                  <div className="flex flex-col gap-2">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border border-dashed border-gray-300 hover:border-brand-blue text-gray-600 hover:text-brand-blue rounded-lg py-2.5 text-xs font-bold transition-all bg-gray-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                      </svg>
                      {uploadedImageName ? "Foto Selecionada" : "Tirar / Escolher Foto do Celular"}
                    </button>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {/* Fallback de link manual */}
                    <input 
                      type="text" 
                      placeholder="Ou cole o link da foto (URL)..."
                      value={formCar.imageUrl}
                      disabled={!!uploadedImage}
                      onChange={(e) => setFormCar(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-brand-blue bg-white text-gray-800 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Pré-visualização da Imagem */}
              {(uploadedImage || formCar.imageUrl) && (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mb-2">Pré-visualização da Foto</span>
                  <img 
                    src={uploadedImage || formCar.imageUrl} 
                    alt="Preview" 
                    className="h-44 w-auto rounded-lg object-contain bg-white shadow-sm border border-gray-100" 
                  />
                  {uploadedImage && (
                    <button 
                      type="button" 
                      onClick={clearUploadStates}
                      className="text-xs text-red-500 hover:text-red-700 font-bold underline mt-2 cursor-pointer"
                    >
                      Remover foto do dispositivo
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Acessórios (Separados por vírgula)</label>
                <textarea 
                  placeholder="Ex: Ar Condicionado, Vidros Elétricos, Freio ABS"
                  value={formCar.accessories}
                  onChange={(e) => setFormCar(prev => ({ ...prev, accessories: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white h-24 text-gray-800"
                />
              </div>

              <div className="flex gap-4 justify-end mt-4">
                <button 
                  type="button"
                  onClick={() => { setActiveTab("estoque"); setEditingCar(null); clearUploadStates(); }}
                  className="border border-gray-300 hover:bg-gray-100 text-gray-700 px-6 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className="bg-brand-blue hover:opacity-90 text-white px-8 py-3 rounded-lg text-sm font-semibold transition-opacity cursor-pointer"
                >
                  {editingCar ? "Salvar Alterações" : "Cadastrar Veículo"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB: GERENCIAR CONTAS (Apenas Admin) */}
        {activeTab === "usuarios" && isAdmin && (
          <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm">
            <h2 className="text-xl font-extrabold text-brand-blue uppercase mb-6 flex items-center gap-2">
              👥 Gerenciar Contas de Funcionários
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form de Cadastro */}
              <div className="bg-gray-50 border border-gray-150 rounded-xl p-6 h-fit">
                <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Cadastrar Novo Funcionário</h3>
                
                <form onSubmit={handleCreateUser} className="flex flex-col gap-4 text-gray-800">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo</label>
                    <input 
                      type="text"
                      placeholder="Ex: João Silva"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-blue bg-white text-gray-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Login / Usuário</label>
                    <input 
                      type="text"
                      placeholder="Ex: joaosilva"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-blue bg-white text-gray-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Senha</label>
                    <input 
                      type="password"
                      placeholder="Senha de acesso..."
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-blue bg-white text-gray-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cargo / Nível de Acesso</label>
                    <select 
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-blue bg-white text-gray-800"
                      required
                    >
                      <option value="seller">Vendedor</option>
                      <option value="manager">Gerente</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    disabled={actionLoading}
                    className="w-full bg-brand-blue text-white rounded-lg py-2.5 font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer mt-2"
                  >
                    {actionLoading ? "Cadastrando..." : "Cadastrar Funcionário"}
                  </button>
                </form>
              </div>

              {/* Tabela de Usuários */}
              <div className="lg:col-span-2 overflow-x-auto">
                <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Funcionários Ativos</h3>
                
                {usersLoading ? (
                  <div className="py-8 text-center text-gray-400 font-medium">Carregando lista de funcionários...</div>
                ) : usersList.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 font-medium">Nenhum funcionário cadastrado no momento.</div>
                ) : (
                  <div className="min-w-full overflow-hidden border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nome</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Login</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cargo</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 text-gray-700">
                        {usersList.map((u) => {
                          const isSelf = u.id === user?.id || u.email === user?.email;
                          return (
                            <tr key={u.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full uppercase ${
                                  u.role?.toLowerCase() === "admin" 
                                    ? "bg-purple-100 text-purple-800" 
                                    : u.role?.toLowerCase() === "manager" 
                                      ? "bg-blue-100 text-blue-800" 
                                      : "bg-green-100 text-green-800"
                                }`}>
                                  {getRoleBadge(u.role)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {isSelf ? (
                                  <span className="text-xs text-gray-400 italic font-medium px-3 py-1.5">Sua Conta</span>
                                ) : (
                                  <button 
                                    onClick={() => handleDeleteUser(u.id)}
                                    disabled={actionLoading}
                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Excluir
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: MARCAR COMO VENDIDO (CRM) */}
      {showCrmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-[20px] p-8 w-full max-w-[450px] shadow-2xl relative">
            <h3 className="text-lg font-bold text-brand-blue uppercase mb-2">Registrar Venda (CRM)</h3>
            <p className="text-gray-500 text-xs mb-6">Preencha os dados do comprador para salvar no histórico de faturamento.</p>
            
            <form onSubmit={handleConfirmSale} className="flex flex-col gap-4 text-gray-800">
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
                  className="border border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
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
