"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { signIn, signOut } from "next-auth/react";
import DashboardTab from "@/components/erp/DashboardTab";
import EstoqueTab from "@/components/erp/EstoqueTab";
import CrmTab from "@/components/erp/CrmTab";
import PosVendaTab from "@/components/erp/PosVendaTab";
import FinanceiroTab from "@/components/erp/FinanceiroTab";

const PREDEFINED_ACCESSORIES = [
  "Ar-condicionado",
  "Direção hidráulica ou elétrica",
  "Vidros elétricos",
  "Travas elétricas",
  "Retrovisores elétricos",
  "Bancos em couro",
  "Freios ABS",
  "Airbag",
  "Alarme",
  "Sensor de estacionamento",
  "Câmera de ré",
  "Central multimídia / Bluetooth",
  "Volante multifuncional",
  "Rodas de liga leve",
  "Faróis de neblina",
  "Teto solar"
];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null); // Armazena dados do funcionário logado
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("erp_dashboard"); // erp_dashboard, erp_estoque, erp_crm, erp_financeiro, estoque, vendas, cadastrar

  // Estado para gerenciamento de usuários (Apenas Administrador)
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "manager",
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
    images: [], // Lista de URLs de fotos
    category: "Hatch",
    accessories: [],
    isOffer: false,
    promoPrice: "",
  });

  // Upload de Fotos Locais
  const [uploadedImages, setUploadedImages] = useState([]); // Array de objetos { base64, name }
  const [imageUrlInput, setImageUrlInput] = useState(""); // Input local para adicionar imagem via URL
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
  const isAdministrativo = user?.role?.toLowerCase() === "manager" || user?.role?.toLowerCase() === "admin";
  const isVendedor = user?.role?.toLowerCase() === "seller";
  const isPosVendaRole = user?.role?.toLowerCase() === "posvenda" || user?.role?.toLowerCase() === "admin";

  // Tradução do cargo para exibição amigável
  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case "admin": return "Administrador";
      case "manager": return "Administrativo";
      case "seller": return "Vendedor";
      case "posvenda": return "Pós Venda";
      default: return "Funcionário";
    }
  };

  // Proteção automática de abas por nível de acesso (Guarda de Rota)
  useEffect(() => {
    if (!user) return;
    const role = user.role?.toLowerCase();
    if (role === "seller" && !["erp_crm", "estoque"].includes(activeTab)) {
      setActiveTab("erp_crm");
    } else if (role === "manager" && !["erp_estoque", "erp_crm", "erp_financeiro", "estoque", "cadastrar"].includes(activeTab)) {
      setActiveTab("erp_estoque");
    } else if (role === "posvenda" && !["erp_posvenda", "erp_estoque", "erp_crm"].includes(activeTab)) {
      setActiveTab("erp_posvenda");
    }
  }, [user, activeTab]);

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

            const role = session.user.role?.toLowerCase();
            if (role === "seller") {
              setActiveTab("erp_crm");
            } else if (role === "manager") {
              setActiveTab("erp_estoque");
            }

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

  // Inicia edição de um usuário existente
  const startEditUser = (u) => {
    setEditingUser(u);
    setNewUserForm({
      name: u.name || "",
      email: u.email || "",
      password: "",
      role: u.role || "manager",
    });
    setError("");
  };

  // Cancela edição de usuário
  const cancelEditUser = () => {
    setEditingUser(null);
    setNewUserForm({
      name: "",
      email: "",
      password: "",
      role: "manager",
    });
  };

  // Cadastra ou Atualiza um usuário (Apenas Admin)
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError("");
    setActionLoading(true);
    try {
      const isEditing = Boolean(editingUser);
      const url = "/api/admin/users";
      const method = isEditing ? "PUT" : "POST";
      const payload = isEditing 
        ? { id: editingUser.id, ...newUserForm } 
        : newUserForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingUser(null);
        setNewUserForm({
          name: "",
          email: "",
          password: "",
          role: "manager",
        });
        fetchUsers();
      } else {
        const errData = await res.json();
        setError(errData.error || `Erro ao ${isEditing ? "atualizar" : "criar"} funcionário.`);
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
        
        const role = session.user.role?.toLowerCase();
        if (role === "seller") {
          setActiveTab("erp_crm");
        } else if (role === "manager") {
          setActiveTab("erp_estoque");
        } else {
          setActiveTab("erp_dashboard");
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
    setUploadedImages([]);
    setImageUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Selecionar múltiplos arquivos do dispositivo e comprimir no Canvas
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new window.Image();
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
            const name = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            
            setUploadedImages(prev => [...prev, { base64: compressedDataUrl, name }]);
          };
        };
        reader.readAsDataURL(file);
      });
      // Limpa valor do input para permitir selecionar os mesmos arquivos novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Adicionar imagem via link manual (URL)
  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setFormCar(prev => ({
        ...prev,
        images: [...(prev.images || []), imageUrlInput.trim()]
      }));
      setImageUrlInput("");
    }
  };

  // Alternar seleção de acessório
  const handleAccessoryChange = (accessory) => {
    setFormCar(prev => {
      const current = prev.accessories || [];
      const updated = current.includes(accessory)
        ? current.filter(item => item !== accessory)
        : [...current, accessory];
      return { ...prev, accessories: updated };
    });
  };

  // Mascaras de preenchimento
  const handlePriceChange = (val) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return setFormCar(prev => ({ ...prev, price: "" }));
    const formatted = "R$ " + Number(clean).toLocaleString("pt-BR");
    setFormCar(prev => ({ ...prev, price: formatted }));
  };

  const handlePromoPriceChange = (val) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return setFormCar(prev => ({ ...prev, promoPrice: "" }));
    const formatted = "R$ " + Number(clean).toLocaleString("pt-BR");
    setFormCar(prev => ({ ...prev, promoPrice: formatted }));
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

    const uploadedUrls = [];

    // 1. Se houver imagens locais selecionadas, faz upload de cada uma no Supabase Storage
    if (uploadedImages.length > 0) {
      try {
        const uploadPromises = uploadedImages.map(async (imgObj) => {
          const uploadRes = await fetch("/api/admin/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imgObj.base64, imageName: imgObj.name }),
          });

          if (!uploadRes.ok) {
            throw new Error(`Erro de comunicação com o servidor de upload para a imagem ${imgObj.name}.`);
          }

          const uploadResult = await uploadRes.ok ? await uploadRes.json() : {};

          if (uploadResult.error) {
            throw new Error(uploadResult.error);
          }

          return uploadResult.imageUrl;
        });

        const urls = await Promise.all(uploadPromises);
        uploadedUrls.push(...urls);
      } catch (err) {
        setError(`Falha ao fazer upload das imagens: ${err.message}`);
        setActionLoading(false);
        return;
      }
    }

    // 2. Combina as imagens já salvas (ou URLs manuais) com as novas carregadas do dispositivo
    const finalImagesList = [...(formCar.images || []), ...uploadedUrls];
    const firstImageUrl = finalImagesList.length > 0 ? finalImagesList[0] : "";

    // 3. Envia os dados do carro e a lista de URLs pública para o banco de dados (Prisma/PostgreSQL)
    const action = editingCar ? "update" : "create";
    const requestBody = {
      action,
      car: {
        ...formCar,
        imageUrl: firstImageUrl, // Mantém compatibilidade com listagem antiga que usa imageUrl diretamente
        images: finalImagesList,  // Array de todas as fotos salvas
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
          images: [],
          category: "Hatch",
          accessories: [],
          isOffer: false,
          promoPrice: "",
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

    let accessoriesArray = [];
    if (Array.isArray(car.accessories)) {
      accessoriesArray = car.accessories;
    } else if (car.accessories) {
      accessoriesArray = car.accessories.split(",").map(item => item.trim()).filter(Boolean);
    }

    setFormCar({
      title: car.title || "",
      subtitle: car.subtitle || "",
      year: car.year || "",
      mileage: car.mileage || "",
      transmission: car.transmission || "Manual",
      price: car.price || "",
      imageUrl: car.imageUrl || "",
      images: car.images || (car.imageUrl ? [car.imageUrl] : []),
      category: car.category || "Hatch",
      accessories: accessoriesArray,
      isOffer: car.isOffer || false,
      promoPrice: car.promoPrice || "",
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
      
      <main className="flex-grow w-full max-w-[1200px] mx-auto py-5 sm:py-10 px-3 sm:px-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-[26px] sm:text-[32px] font-extrabold text-brand-blue uppercase leading-tight">Painel de Controle</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2 flex flex-wrap items-center gap-1.5">
              <span>Funcionário: <strong className="text-brand-blue">{user?.name}</strong></span>
              <span className="bg-brand-blue/10 text-brand-blue px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase">{getRoleBadge(user?.role)}</span>
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="border border-red-200 text-red-600 hover:bg-red-50 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer self-start sm:self-auto"
          >
            Sair do Painel
          </button>
        </div>

        {/* Tabs Menu */}
        <div className="flex border-b border-gray-200 mb-6 sm:mb-8 gap-2.5 sm:gap-4 overflow-x-auto pb-2 scrollbar-none select-none items-center touch-pan-x w-full">
          <span className="text-[10px] font-extrabold uppercase text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md shrink-0">
            📊 ERP & CRM
          </span>
          
          {isAdmin && (
            <button 
              onClick={() => { setActiveTab("erp_dashboard"); setEditingCar(null); clearUploadStates(); }}
              className={`pb-2 text-xs font-extrabold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === "erp_dashboard" ? "border-brand-blue text-brand-blue" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              📈 Dashboard
            </button>
          )}
          
          {(isAdmin || user?.role?.toLowerCase() === "manager" || user?.role?.toLowerCase() === "posvenda") && (
            <button 
              onClick={() => { setActiveTab("erp_estoque"); setEditingCar(null); clearUploadStates(); }}
              className={`pb-2 text-xs font-extrabold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === "erp_estoque" ? "border-brand-blue text-brand-blue" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              🚗 Estoque & Histórico
            </button>
          )}
          
          <button 
            onClick={() => { setActiveTab("erp_crm"); setEditingCar(null); clearUploadStates(); }}
            className={`pb-2 text-xs font-extrabold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === "erp_crm" ? "border-brand-blue text-brand-blue" : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            🤝 CRM e Funil Vendas
          </button>

          {(isAdmin || user?.role?.toLowerCase() === "posvenda") && (
            <button 
              onClick={() => { setActiveTab("erp_posvenda"); setEditingCar(null); clearUploadStates(); }}
              className={`pb-2 text-xs font-extrabold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === "erp_posvenda" ? "border-brand-blue text-brand-blue" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              🛠️ Pós Venda
            </button>
          )}
          
          {(isAdmin || user?.role?.toLowerCase() === "manager") && (
            <button 
              onClick={() => { setActiveTab("erp_financeiro"); setEditingCar(null); clearUploadStates(); }}
              className={`pb-2 text-xs font-extrabold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === "erp_financeiro" ? "border-brand-blue text-brand-blue" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              💸 Financeiro Geral
            </button>
          )}

          {(isAdmin || user?.role?.toLowerCase() === "manager" || isVendedor) && (
            <>
              <span className="h-4 w-[1px] bg-gray-300 mx-2 shrink-0"></span>

              <span className="text-[10px] font-extrabold uppercase text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md shrink-0">
                🌐 Catálogo Site
              </span>
              
              <button 
                onClick={() => { setActiveTab("estoque"); setEditingCar(null); clearUploadStates(); }}
                className={`pb-2 text-xs font-extrabold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === "estoque" ? "border-brand-blue text-brand-blue" : "border-transparent text-gray-400 hover:text-gray-600"}`}
              >
                📦 Catálogo Ativo ({activeCars.length})
              </button>
            </>
          )}

          {activeTab === "cadastrar" && (
            <button 
              className="pb-2 text-xs font-extrabold border-b-2 whitespace-nowrap transition-colors border-brand-blue text-brand-blue cursor-default"
            >
              ✏️ Editando Anúncio do Site
            </button>
          )}

          {isAdmin && (
            <>
              <span className="h-4 w-[1px] bg-gray-300 mx-2 shrink-0"></span>
              <button 
                onClick={() => { setActiveTab("usuarios"); setEditingCar(null); clearUploadStates(); }}
                className={`pb-2 text-xs font-extrabold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === "usuarios" ? "border-brand-blue text-brand-blue" : "border-transparent text-gray-400 hover:text-gray-600"}`}
              >
                👥 Contas
              </button>
            </>
          )}

          <button 
            onClick={handleLogout}
            className="ml-auto pb-2 text-xs font-bold border-b-2 border-transparent text-red-600 hover:text-red-800 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            🚪 Sair
          </button>
        </div>

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

        {/* ERP TABS RENDERING */}
        {activeTab === "erp_dashboard" && isAdmin && <DashboardTab />}
        {activeTab === "erp_estoque" && (isAdmin || user?.role?.toLowerCase() === "manager" || user?.role?.toLowerCase() === "posvenda") && <EstoqueTab />}
        {activeTab === "erp_crm" && <CrmTab />}
        {activeTab === "erp_posvenda" && (isAdmin || user?.role?.toLowerCase() === "posvenda") && <PosVendaTab />}
        {activeTab === "erp_financeiro" && (isAdmin || user?.role?.toLowerCase() === "manager") && <FinanceiroTab />}

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
                          {(!car.images || car.images.length === 0) && (
                            <span className="inline-flex mt-1 items-center gap-1 bg-amber-50 text-amber-700 border border-amber-250 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                              ⚠️ Pendente de Fotos (Fora do site)
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-gray-600">{car.year}</td>
                        <td className="p-4 text-sm text-gray-600">{car.mileage}</td>
                        <td className="p-4 text-sm"><span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-md font-medium">{car.category}</span></td>
                        <td className="p-4 text-sm font-bold text-brand-blue">
                          {car.isOffer && car.promoPrice ? (
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 line-through font-normal">{car.price}</span>
                              <span className="text-green-600">{car.promoPrice}</span>
                            </div>
                          ) : (
                            car.price
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col items-center gap-1.5">
                            {(!car.images || car.images.length === 0) && (
                              <span className="text-[9px] text-amber-650 font-extrabold text-center uppercase tracking-wider max-w-[150px] bg-amber-50/50 px-2 py-1 rounded border border-amber-200 animate-pulse">
                                📸 Tirar fotos e inserir dados do anúncio
                              </span>
                            )}
                            <div className="flex justify-center items-center gap-3">
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

              {/* Bloco de Oferta Promocional */}
              <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100/70 flex flex-col gap-4">
                <label className="flex items-start sm:items-center gap-3.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={formCar.isOffer}
                    onChange={(e) => setFormCar(prev => ({ ...prev, isOffer: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 sm:mt-0 rounded border-gray-300 text-brand-blue focus:ring-brand-blue cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-brand-blue uppercase block">Marcar como Veículo de Oferta</span>
                    <span className="text-[11px] text-gray-500 font-light mt-0.5 block">Ative esta opção para destacar este carro na seção "Confira Nossas Ofertas" da Home Page.</span>
                  </div>
                </label>

                {formCar.isOffer && (
                  <div className="w-full max-w-[280px] animate-fade-in">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Novo Preço (R$)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: R$ 39.900"
                      value={formCar.promoPrice}
                      onChange={(e) => handlePromoPriceChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-blue bg-white text-gray-800"
                      required={formCar.isOffer}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Imagens do Veículo (Adicione quantas desejar)</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-grow sm:flex-grow-0 border border-dashed border-gray-300 hover:border-brand-blue text-gray-600 hover:text-brand-blue rounded-lg py-3 px-4 text-xs font-bold transition-all bg-gray-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                    {uploadedImages.length > 0 ? `Adicionar mais Fotos (${uploadedImages.length} selecionadas)` : "Escolher Fotos do Celular / Computador"}
                  </button>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="flex-1 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Ou cole o link da foto (URL)..."
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="flex-grow border border-gray-300 rounded-lg p-3 text-xs focus:outline-none focus:border-brand-blue bg-white text-gray-800"
                    />
                    <button 
                      type="button"
                      onClick={handleAddImageUrl}
                      className="bg-brand-blue hover:opacity-90 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-opacity cursor-pointer whitespace-nowrap"
                    >
                      Adicionar Link
                    </button>
                  </div>
                </div>
              </div>

              {/* Pré-visualização de Todas as Fotos */}
              {(((formCar.images && formCar.images.length > 0) || uploadedImages.length > 0)) && (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase text-center block">
                    Fotos Selecionadas ({ (formCar.images?.length || 0) + uploadedImages.length })
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {/* Imagens já salvas ou inseridas via link */}
                    {formCar.images && formCar.images.map((url, index) => (
                      <div key={`saved-${index}`} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white aspect-video shadow-sm">
                        <img 
                          src={url} 
                          alt={`Foto ${index + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            setFormCar(prev => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== index)
                            }));
                          }}
                          className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition-colors cursor-pointer flex items-center justify-center"
                          title="Remover foto"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <span className="absolute bottom-1 left-1 bg-brand-blue/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">Salva/URL</span>
                      </div>
                    ))}

                    {/* Imagens do dispositivo prontas para upload */}
                    {uploadedImages.map((imgObj, index) => (
                      <div key={`local-${index}`} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white aspect-video shadow-sm">
                        <img 
                          src={imgObj.base64} 
                          alt={`Local ${index + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            setUploadedImages(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition-colors cursor-pointer flex items-center justify-center"
                          title="Remover foto"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <span className="absolute bottom-1 left-1 bg-yellow-600/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">Upload Pendente</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-3">Acessórios do Veículo</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
                  {PREDEFINED_ACCESSORIES.map((accessory) => {
                    const isChecked = Array.isArray(formCar.accessories) && formCar.accessories.includes(accessory);
                    return (
                      <label key={accessory} className="flex items-center gap-3 cursor-pointer select-none text-gray-700 text-sm hover:text-brand-blue transition-colors">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => handleAccessoryChange(accessory)}
                          className="w-4 h-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue cursor-pointer"
                        />
                        <span>{accessory}</span>
                      </label>
                    );
                  })}
                </div>
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
              {/* Form de Cadastro / Edição */}
              <div className="bg-gray-50 border border-gray-150 rounded-xl p-6 h-fit">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-700 uppercase">
                    {editingUser ? `Editar Conta: ${editingUser.name}` : "Cadastrar Novo Funcionário"}
                  </h3>
                  {editingUser && (
                    <button 
                      type="button"
                      onClick={cancelEditUser}
                      className="text-[11px] font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      ✕ Cancelar
                    </button>
                  )}
                </div>
                
                <form onSubmit={handleSaveUser} className="flex flex-col gap-4 text-gray-800">
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
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      {editingUser ? "Nova Senha (deixe em branco se não quiser alterar)" : "Senha"}
                    </label>
                    <input 
                      type="password"
                      placeholder={editingUser ? "Manter senha atual..." : "Senha de acesso..."}
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-blue bg-white text-gray-800"
                      required={!editingUser}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cargo / Nível de Acesso</label>
                    <select 
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-blue bg-white text-gray-800 font-semibold"
                      required
                    >
                      <option value="manager">Administrativo</option>
                      <option value="seller">Vendedor</option>
                      <option value="posvenda">Pós Venda</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    disabled={actionLoading}
                    className="w-full bg-brand-blue text-white rounded-lg py-2.5 font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer mt-2"
                  >
                    {actionLoading ? "Salvando..." : editingUser ? "Salvar Alterações" : "Cadastrar Funcionário"}
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
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => startEditUser(u)}
                                  disabled={actionLoading}
                                  className="text-brand-blue hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                                  title="Editar login e senha desta conta"
                                >
                                  ✏️ Editar
                                </button>

                                {isSelf ? (
                                  <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-1 rounded border border-purple-200">
                                    Sua Conta
                                  </span>
                                ) : (
                                  <button 
                                    onClick={() => handleDeleteUser(u.id)}
                                    disabled={actionLoading}
                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-bold"
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
