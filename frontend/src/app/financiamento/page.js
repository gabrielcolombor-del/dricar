import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";

export const metadata = {
  title: "Financiamento de Veículos | DRI-CAR Veículos",
  description: "Conquiste seu seminovo ou usado com as melhores taxas do mercado. Financiamento rápido, fácil e sem burocracia na DRI-CAR Veículos.",
};

export default function FinanciamentoPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070f26] flex flex-col justify-between font-sans transition-colors duration-300">
      <Header />

      <main className="flex-1">
        {/* Banner Hero */}
        <section className="bg-brand-blue dark:bg-[#040817] text-white py-14 md:py-20 px-6 relative overflow-hidden shadow-md dark:border-b dark:border-white/10">
          <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="max-w-[600px] text-center md:text-left">
              <span className="inline-block bg-white/15 text-white text-xs md:text-sm font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4 border border-white/20">
                Condições Especiais
              </span>
              <h1 className="text-[32px] md:text-[46px] font-black uppercase leading-tight tracking-tight mb-4">
                Financie seu Veículo na <span className="text-emerald-400">DRI-CAR</span>
              </h1>
              <p className="text-gray-200 dark:text-gray-300 text-sm md:text-base leading-relaxed font-light mb-8">
                Trabalhamos com os principais bancos e financeiras para garantir a menor taxa de juros e a aprovação mais rápida de Guarapari e região.
              </p>

              <a
                href="https://wa.me/5527999361212?text=Ol%C3%A1%2C%20gostaria%20de%20simular%20o%20financiamento%20de%20um%20ve%C3%ADculo."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm md:text-base py-3.5 px-8 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 uppercase tracking-wide"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
                Simular Financiamento via WhatsApp
              </a>
            </div>

            <div className="relative w-[180px] h-[180px] md:w-[260px] md:h-[260px] flex items-center justify-center">
              <Image
                src="/images/financia.png"
                alt="Financiamento DRI-CAR"
                width={260}
                height={260}
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* Vantagens */}
        <section className="max-w-[1100px] mx-auto py-14 px-6">
          <div className="text-center max-w-[700px] mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight mb-3">
              Por que Financiar Conosco?
            </h2>
            <p className="text-slate-600 dark:text-gray-300 text-sm md:text-base">
              Aprovação facilitada, zero complicação e atendimento personalizado do início ao fim.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-[#0e1b42] p-6 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/40 text-brand-blue dark:text-blue-400 rounded-xl flex items-center justify-center font-extrabold text-xl mb-4">
                ⚡
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base uppercase mb-2">Aprovação Rápida</h3>
              <p className="text-slate-600 dark:text-gray-300 text-xs leading-relaxed">
                Análise de crédito em minutos com resposta imediata dos bancos parceiros.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0e1b42] p-6 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center font-extrabold text-xl mb-4">
                💰
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base uppercase mb-2">As Melhores Taxas</h3>
              <p className="text-slate-600 dark:text-gray-300 text-xs leading-relaxed">
                Parcerias exclusivas com taxas de juros competitivas para caber na sua renda.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0e1b42] p-6 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center font-extrabold text-xl mb-4">
                🚗
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base uppercase mb-2">Usado como Entrada</h3>
              <p className="text-slate-600 dark:text-gray-300 text-xs leading-relaxed">
                Avaliamos seu veículo atual e usamos o valor como entrada no seu novo financiamento.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0e1b42] p-6 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center font-extrabold text-xl mb-4">
                📅
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base uppercase mb-2">Até 60 Meses</h3>
              <p className="text-slate-600 dark:text-gray-300 text-xs leading-relaxed">
                Planos flexíveis de parcelamento em até 60 vezes para sua conveniência.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-slate-100 dark:bg-[#040817] border-t border-b border-slate-200 dark:border-white/10 py-12 px-6 transition-colors duration-300">
          <div className="max-w-[800px] mx-auto text-center space-y-4">
            <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase">
              Quer fazer uma simulação sem compromisso?
            </h3>
            <p className="text-slate-600 dark:text-gray-300 text-sm max-w-[600px] mx-auto">
              Fale com um de nossos especialistas via WhatsApp e descubra as melhores opções de crédito disponíveis para o seu perfil.
            </p>
            <div className="pt-2">
              <a
                href="https://wa.me/5527999361212?text=Ol%C3%A1%2C%20gostaria%20de%20fazer%20uma%20simula%C3%A7%C3%A3o%20de%20financiamento!"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-brand-blue dark:bg-blue-600 hover:bg-slate-900 dark:hover:bg-blue-500 text-white font-extrabold text-sm py-3.5 px-8 rounded-full shadow-md transition-all uppercase"
              >
                Falar com Especialista em Financiamento
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
