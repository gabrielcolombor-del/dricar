import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function QuemSomosPage() {
  return (
    <>
      <Header />
      
      <main className="flex-1 w-full bg-white">
        
        {/* Banner Title */}
        <section className="bg-[#F8F8F8] py-16 border-b border-gray-200">
          <div className="max-w-[1200px] mx-auto px-6">
            <h1 className="text-[40px] font-extrabold text-brand-blue uppercase leading-none mb-2">Quem Somos</h1>
            <p className="text-gray-600 text-lg">Conheça a história e os valores que movem a Dri-Car Veículos.</p>
          </div>
        </section>

        {/* Story Section */}
        <section className="max-w-[1200px] mx-auto py-20 px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            
            {/* Story Text */}
            <div className="flex-1 space-y-6 text-gray-700">
              <h2 className="text-[32px] font-bold text-gray-800 leading-tight">Nossa História</h2>
              
              <p className="text-[16px] leading-relaxed font-light">
                A <strong>Dri-Car Veículos</strong> nasceu em 2012 com um propósito claro: transformar a experiência de compra e venda de automóveis na nossa região. O que começou como um sonho familiar, operando com apenas cinco carros no estoque, rapidamente se tornou referência de credibilidade, transparência e qualidade no mercado automotivo.
              </p>
              
              <p className="text-[16px] leading-relaxed font-light">
                Fundada pelos irmãos Colombo, apaixonados por motores e determinados a oferecer um atendimento diferenciado, a Dri-Car consolidou sua trajetória pautada na confiança mútua com cada cliente. Para nós, vender um carro não é apenas uma transação comercial, mas sim a realização de um sonho e a entrega de segurança e liberdade para a sua família.
              </p>

              <p className="text-[16px] leading-relaxed font-light">
                Ao longo dos anos, expandimos nossa estrutura física, ampliamos nossas parcerias financeiras para garantir as melhores taxas de financiamento do mercado e selecionamos a dedo cada veículo que entra em nosso showroom. Hoje, contamos com uma equipe técnica altamente qualificada que realiza vistorias rigorosas em 100% do nosso estoque.
              </p>
            </div>

            {/* Store Photo */}
            <div className="w-full lg:w-[500px] flex-shrink-0">
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#F8F8F8]">
                <Image 
                  src="/images/foto loja.webp" 
                  alt="Showroom Dri-Car Veículos" 
                  fill 
                  className="object-cover"
                  priority
                />
              </div>
            </div>

          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="bg-[#F8F8F8] py-20 border-t border-b border-gray-200">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Mission */}
              <div className="bg-white p-8 rounded-[20px] shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-brand-blue/10 flex items-center justify-center mb-6 text-brand-blue">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 3.89a14.98 14.98 0 00-6.16 12.12A14.98 14.98 0 009.63 20.1m5.96-5.73V20.1m0-5.73l-5.96 5.73" /></svg>
                </div>
                <h3 className="text-xl font-bold text-brand-blue mb-4 uppercase">Missão</h3>
                <p className="text-gray-600 text-[15px] leading-relaxed font-light">
                  Oferecer veículos seminovos com procedência garantida e atendimento excepcional, proporcionando a melhor experiência de compra e venda com total segurança e satisfação.
                </p>
              </div>

              {/* Vision */}
              <div className="bg-white p-8 rounded-[20px] shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-brand-blue/10 flex items-center justify-center mb-6 text-brand-blue">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-brand-blue mb-4 uppercase">Visão</h3>
                <p className="text-gray-600 text-[15px] leading-relaxed font-light">
                  Ser reconhecida como a concessionária seminova líder em confiança e qualidade no estado, expandindo nossa presença digital e mantendo a proximidade com nossos clientes.
                </p>
              </div>

              {/* Values */}
              <div className="bg-white p-8 rounded-[20px] shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-brand-blue/10 flex items-center justify-center mb-6 text-brand-blue">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0110 21a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0114 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-brand-blue mb-4 uppercase">Valores</h3>
                <p className="text-gray-600 text-[15px] leading-relaxed font-light">
                  Transparência absoluta, honestidade, paixão pelo que fazemos, respeito aos clientes e colaboradores, e compromisso irrestrito com a segurança e conformidade.
                </p>
              </div>

            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
