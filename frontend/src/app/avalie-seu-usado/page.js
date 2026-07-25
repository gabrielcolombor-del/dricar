"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AvalieSeuUsadoPage() {
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    cidade: "",
    marca: "",
    modelo: "",
    ano: "",
    quilometragem: "",
    placa: "",
    cambio: "Manual",
    combustivel: "Flex",
    valorPretendido: "",
    observacoes: "",
  });

  const [photos, setPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const formatPhone = (val) => {
    let clean = val.replace(/\D/g, "").slice(0, 11);
    if (clean.length > 6) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    } else if (clean.length > 2) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    } else if (clean.length > 0) {
      return `(${clean}`;
    }
    return clean;
  };

  const formatCurrency = (val) => {
    const clean = String(val).replace(/\D/g, "");
    if (!clean) return "";
    const num = Number(clean) / 100;
    return "R$ " + num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            file,
            name: file.name,
            preview: reader.result,
            uploadedUrl: null,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.telefone.trim() || !formData.marca.trim() || !formData.modelo.trim()) {
      alert("Por favor, preencha os campos obrigatórios (Nome, WhatsApp, Marca e Modelo).");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Processando fotos...");

    let uploadedUrls = [];

    // Tenta fazer upload das fotos se houver
    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setUploadProgress(`Enviando foto ${i + 1} de ${photos.length}...`);
        try {
          const res = await fetch("/api/public/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: photo.preview,
              imageName: photo.name,
            }),
          });
          const data = await res.json();
          if (data.imageUrl) {
            uploadedUrls.push(data.imageUrl);
          }
        } catch (err) {
          console.error("Erro ao subir imagem:", err);
        }
      }
    }

    setUploadProgress("Gerando mensagem para o WhatsApp...");

    // Monta a mensagem para o WhatsApp da Loja
    let message = `🚗 *NOVA AVALIAÇÃO DE USADO - DRI-CAR*\n\n`;
    message += `👤 *DADOS DO CLIENTE*\n`;
    message += `• *Nome:* ${formData.nome}\n`;
    message += `• *WhatsApp:* ${formData.telefone}\n`;
    if (formData.cidade) message += `• *Cidade/UF:* ${formData.cidade}\n`;

    message += `\n🚘 *DADOS DO VEÍCULO*\n`;
    message += `• *Marca/Modelo:* ${formData.marca.toUpperCase()} ${formData.modelo.toUpperCase()}\n`;
    if (formData.ano) message += `• *Ano:* ${formData.ano}\n`;
    if (formData.quilometragem) message += `• *Quilometragem:* ${formData.quilometragem} km\n`;
    if (formData.placa) message += `• *Placa:* ${formData.placa.toUpperCase()}\n`;
    message += `• *Câmbio:* ${formData.cambio}\n`;
    message += `• *Combustível:* ${formData.combustivel}\n`;
    if (formData.valorPretendido) message += `• *Valor Pretendido:* ${formData.valorPretendido}\n`;
    if (formData.observacoes) message += `• *Opcionais / Detalhes:* ${formData.observacoes}\n`;

    if (uploadedUrls.length > 0) {
      message += `\n📸 *FOTOS DO VEÍCULO (${uploadedUrls.length})*\n`;
      uploadedUrls.forEach((url, idx) => {
        message += `• Foto ${idx + 1}: ${url}\n`;
      });
    } else if (photos.length > 0) {
      message += `\n📸 *FOTOS:* (${photos.length} fotos anexadas para envio no chat)\n`;
    }

    setIsUploading(false);
    setUploadProgress("");

    // Redireciona diretamente para o WhatsApp da DRI-CAR
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5527999361212?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      <Header />

      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="max-w-[850px] mx-auto bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
          {/* Header do Card */}
          <div className="bg-brand-blue text-white p-8 sm:p-10 text-center relative">
            <span className="inline-block bg-white/15 text-white text-xs font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full mb-3 border border-white/20">
              Melhor Avaliação de Guarapari
            </span>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-2">
              Avalie Seu Usado
            </h1>
            <p className="text-gray-200 text-xs sm:text-sm font-light max-w-[600px] mx-auto leading-relaxed">
              Preencha os dados do seu veículo e envie fotos. Nossa equipe fará uma avaliação gratuita e responderá você direto no WhatsApp!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
            {/* Seção 1: Dados do Cliente */}
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b pb-2 border-slate-100">
                <span className="w-6 h-6 rounded-full bg-brand-blue text-white flex items-center justify-center text-xs">1</span>
                Seus Dados de Contato
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-xs text-slate-700 uppercase mb-1">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-xs text-slate-700 uppercase mb-1">
                    WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(27) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-xs text-slate-700 uppercase mb-1">Cidade / UF</label>
                  <input
                    type="text"
                    placeholder="Ex: Guarapari / ES"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Dados do Veículo */}
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b pb-2 border-slate-100">
                <span className="w-6 h-6 rounded-full bg-brand-blue text-white flex items-center justify-center text-xs">2</span>
                Informações do Veículo
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-xs text-slate-700 uppercase mb-1">
                    Marca / Fabricante <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Chevrolet, Toyota..."
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-xs text-slate-700 uppercase mb-1">
                    Modelo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Onix 1.0 Turbo LT"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-xs text-slate-700 uppercase mb-1">Ano Fabricação / Mod.</label>
                  <input
                    type="text"
                    placeholder="Ex: 2021/2022"
                    value={formData.ano}
                    onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-xs text-slate-700 uppercase mb-1">Quilometragem (KM)</label>
                  <input
                    type="text"
                    placeholder="Ex: 45.000"
                    value={formData.quilometragem}
                    onChange={(e) => setFormData({ ...formData, quilometragem: e.target.value.replace(/\D/g, "") })}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-xs text-slate-700 uppercase mb-1">Placa (Opcional)</label>
                  <input
                    type="text"
                    placeholder="ABC1D23"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-bold uppercase focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-xs text-slate-700 uppercase mb-1">Câmbio</label>
                  <select
                    value={formData.cambio}
                    onChange={(e) => setFormData({ ...formData, cambio: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all bg-white"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automático">Automático</option>
                    <option value="CVT">CVT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-xs text-slate-700 uppercase mb-1">Combustível</label>
                  <select
                    value={formData.combustivel}
                    onChange={(e) => setFormData({ ...formData, combustivel: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all bg-white"
                  >
                    <option value="Flex">Flex</option>
                    <option value="Gasolina">Gasolina</option>
                    <option value="Etanol">Etanol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Híbrido / Elétrico">Híbrido / Elétrico</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="block font-bold text-xs text-slate-700 uppercase mb-1">Valor Pretendido (R$)</label>
                <input
                  type="text"
                  placeholder="Ex: R$ 45.000,00"
                  value={formData.valorPretendido}
                  onChange={(e) => setFormData({ ...formData, valorPretendido: formatCurrency(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm text-emerald-700 font-extrabold focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-xs text-slate-700 uppercase mb-1">Opcionais e Observações</label>
                <textarea
                  rows={3}
                  placeholder="Conte-nos mais sobre seu carro (ex: Banco de couro, teto solar, único dono, revisões em concessionária...)"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                />
              </div>
            </div>

            {/* Seção 3: Fotos do Veículo */}
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b pb-2 border-slate-100">
                <span className="w-6 h-6 rounded-full bg-brand-blue text-white flex items-center justify-center text-xs">3</span>
                Fotos do Veículo
              </h2>

              <p className="text-xs text-slate-500 font-medium">
                Adicione fotos do exterior, interior e painel para acelerar a avaliação da nossa equipe.
              </p>

              {/* Upload Box */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100/80 transition-all cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoAdd}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xs border border-slate-200 text-2xl">
                    📸
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    Clique aqui ou arraste para selecionar fotos do seu carro
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Suporta imagens JPG, PNG ou WEBP
                  </span>
                </div>
              </div>

              {/* Grid de Previews */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-xs aspect-square bg-slate-100">
                      <img src={photo.preview} alt="Preview do carro" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md cursor-pointer transition-transform hover:scale-110"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botão de Envio */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-3 uppercase tracking-wide disabled:opacity-50"
              >
                {isUploading ? (
                  <span>{uploadProgress || "Enviando..."}</span>
                ) : (
                  <>
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                    </svg>
                    Enviar Avaliação para o WhatsApp da Loja
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
