"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchCars() {
      try {
        const res = await fetch("/api/cars");
        if (res.ok) {
          const data = await res.json();
          setCars(data);
        }
      } catch (err) {
        console.error("Failed to fetch cars:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCars();

    // Consult the database/spreadsheet periodically every 30 seconds
    const interval = setInterval(fetchCars, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/veiculos?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/veiculos");
    }
  };

  return (
    <>
      <Header />
      
      <main className="flex-1 w-full bg-white">
        
        {/* Hero Section */}
        <section className="relative w-full h-[450px] md:h-[600px] flex items-center justify-center">
          <Image 
            src="/images/imagem fundo.png" 
            alt="Hero Background" 
            fill 
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-black/10" /> 
          
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative z-10 bg-white p-7 rounded-[20px] w-[90%] max-w-[650px] shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
            <h3 className="font-bold text-[18px] mb-5 text-gray-800">Busque por um carro</h3>
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input 
                type="text" 
                placeholder="Pesquise por marca, modelo." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-[25px] py-3.5 pl-12 pr-4 text-[15px] focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
              />
            </div>
          </form>
        </section>

        {/* Highlights Section */}
        <section className="max-w-[1100px] mx-auto py-12 md:py-20 px-6 flex flex-col md:flex-row gap-8 justify-center items-center">
          
          <div className="bg-brand-blue text-white rounded-[25px] p-6 sm:p-10 w-full md:w-[525px] h-auto min-h-[280px] md:h-[340px] flex flex-col relative shadow-xl hover:-translate-y-1 transition-transform">
            <h3 className="text-[22px] md:text-[26px] font-extrabold uppercase mb-4 md:mb-6 leading-tight w-[65%] sm:w-[60%] mt-2 md:mt-8">
              Troque seu carro
            </h3>
            <p className="text-[14px] md:text-[15px] text-gray-200 leading-relaxed font-light mb-6 md:mb-8 max-w-[65%] sm:max-w-[85%]">
              Quer trocar de carro? Avaliamos seu usado na hora e facilitamos a troca pelo modelo ideal para você!
            </p>
            <a href="/veiculos" className="underline mt-auto inline-block text-[15px] font-medium">Saiba mais</a>
            <div className="absolute bottom-4 right-4 md:top-6 md:right-8 w-[100px] h-[100px] md:w-[150px] md:h-[150px] flex items-center justify-center">
              <Image src="/images/troca.png" alt="Troque seu carro" width={150} height={150} className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="bg-[#F8F8F8] text-brand-blue rounded-[25px] p-6 sm:p-10 w-full md:w-[525px] h-auto min-h-[280px] md:h-[340px] flex flex-col relative shadow-md hover:-translate-y-1 transition-transform border border-gray-100">
            <h3 className="text-[22px] md:text-[26px] font-extrabold uppercase mb-4 md:mb-6 leading-tight w-[65%] sm:w-[60%] mt-2 md:mt-8">
              Financiamento
            </h3>
            <p className="text-[14px] md:text-[15px] text-gray-600 leading-relaxed font-light mb-6 md:mb-8 max-w-[65%] sm:max-w-[85%]">
              Conquiste seu carro com parcelas que cabem no seu bolso. Financiamento rápido, fácil e sem complicação!
            </p>
            <a href="/veiculos" className="underline mt-auto inline-block text-[15px] font-medium">Saiba mais</a>
            <div className="absolute bottom-4 right-4 md:top-6 md:right-8 w-[90px] h-[90px] md:w-[130px] md:h-[130px] flex items-center justify-center">
              <Image src="/images/financia.png" alt="Financiamento" width={130} height={130} className="w-full h-full object-contain" />
            </div>
          </div>

        </section>

        {/* Mais Buscados */}
        <section className="bg-[#F8F8F8] py-20 border-t border-b border-gray-200">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-[32px] font-extrabold text-brand-blue uppercase leading-none mb-1">Carros</h2>
                <h4 className="text-[20px] font-bold text-gray-800 lowercase">mais buscados</h4>
              </div>
              <Link href="/veiculos" className="font-bold text-[15px] text-gray-800 hover:text-brand-blue transition-colors">
                ver todos
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12 text-gray-500 font-semibold">Carregando estoque...</div>
            ) : cars.length === 0 ? (
              <div className="flex justify-center py-12 text-gray-500 font-semibold">Nenhum veículo disponível no momento.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {cars.slice(0, 10).map((car, index) => (
                  <CarCard key={index} {...car} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Categorias */}
        <section className="max-w-[1200px] mx-auto py-20 px-6">
          <h2 className="text-[32px] font-extrabold text-brand-blue uppercase leading-none mb-1">Navegue</h2>
          <h4 className="text-[20px] font-bold text-gray-800 lowercase mb-10">pelas nossas categorias</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative px-4">
            {/* Arrows */}
            <div className="hidden md:flex absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center text-gray-400 cursor-pointer hover:text-brand-blue transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </div>
            <div className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center text-gray-400 cursor-pointer hover:text-brand-blue transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </div>

            {/* Categoria Cards */}
            <Link href="/veiculos?category=Hatch" className="relative h-[180px] sm:h-[280px] rounded-2xl overflow-hidden cursor-pointer group shadow-lg">
              <Image src="/images/Hatch.png" alt="Hatch" fill className="object-cover absolute inset-0" />
              <div className="bg-gradient-to-t from-black/80 via-black/20 to-transparent w-full h-full absolute inset-0 z-10" />
              <div className="bg-blue-900 w-full h-full absolute inset-0 mix-blend-overlay opacity-30 group-hover:opacity-10 transition-opacity z-10" />
              <h3 className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 text-white text-[20px] sm:text-[24px] font-bold z-20">Hatch</h3>
            </Link>
            <Link href="/veiculos?category=Sedan" className="relative h-[180px] sm:h-[280px] rounded-2xl overflow-hidden cursor-pointer group shadow-lg">
              <Image src="/images/seddan.png" alt="Sedan" fill className="object-cover absolute inset-0" />
              <div className="bg-gradient-to-t from-black/80 via-black/20 to-transparent w-full h-full absolute inset-0 z-10" />
              <div className="bg-blue-900 w-full h-full absolute inset-0 mix-blend-overlay opacity-30 group-hover:opacity-10 transition-opacity z-10" />
              <h3 className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 text-white text-[20px] sm:text-[24px] font-bold z-20">Sedan</h3>
            </Link>
            <Link href="/veiculos?category=SUVs" className="relative h-[180px] sm:h-[280px] rounded-2xl overflow-hidden cursor-pointer group shadow-lg">
              <Image src="/images/suv.png" alt="SUVs" fill className="object-cover absolute inset-0" />
              <div className="bg-gradient-to-t from-black/80 via-black/20 to-transparent w-full h-full absolute inset-0 z-10" />
              <div className="bg-blue-900 w-full h-full absolute inset-0 mix-blend-overlay opacity-30 group-hover:opacity-10 transition-opacity z-10" />
              <h3 className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 text-white text-[20px] sm:text-[24px] font-bold z-20">SUVs</h3>
            </Link>
          </div>
        </section>

        {/* Ofertas */}
        <section className="bg-[#F8F8F8] py-20 border-t border-gray-200">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-[32px] font-extrabold text-brand-blue uppercase leading-none mb-1">Confira</h2>
                <h4 className="text-[20px] font-bold text-gray-800 lowercase">nossas ofertas</h4>
              </div>
              <Link href="/veiculos" className="font-bold text-[15px] text-gray-800 hover:text-brand-blue transition-colors">
                ver todos
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12 text-gray-500 font-semibold">Carregando ofertas...</div>
            ) : cars.length === 0 ? (
              <div className="flex justify-center py-12 text-gray-500 font-semibold">Nenhuma oferta disponível no momento.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Showcase different cars or same from list */}
                {cars.slice(0, 10).reverse().map((car, index) => (
                  <CarCard key={index} {...car} />
                ))}
              </div>
            )}
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
