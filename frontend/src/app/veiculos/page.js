"use client";

import { useState, useEffect, Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import { useSearchParams } from "next/navigation";

function VeiculosContent() {
  const searchParams = useSearchParams();
  const searchFilter = searchParams.get("search");
  const categoryFilter = searchParams.get("category");

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preco, setPreco] = useState(70000); // Default to max to show all initially
  const [km, setKm] = useState(110000); // Default to max
  const [ano, setAno] = useState(2013); // Default to min to show all

  useEffect(() => {
    async function fetchCars() {
      try {
        const res = await fetch("/api/cars");
        if (res.ok) {
          const data = await res.json();
          setCars(data);
          
          // Dynamically adjust slider maximums if data exists
          if (data.length > 0) {
            const prices = data.map(c => Number(c.price.replace(/\D/g, "")));
            const maxPrice = Math.max(...prices);
            setPreco(maxPrice);

            const kms = data.map(c => Number(c.mileage.replace(/\D/g, "")));
            const maxKm = Math.max(...kms);
            setKm(maxKm);
          }
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

  const getPercentage = (value, min, max) => {
    if (max === min) return 100;
    return ((value - min) / (max - min)) * 100;
  };

  const formatPrice = (val) => {
    return `R$ ${val.toLocaleString("pt-BR")}`;
  };

  const formatKm = (val) => {
    return `${val.toLocaleString("pt-BR")} km`;
  };

  // Filters calculation
  const filteredCars = cars.filter((car) => {
    // 1. Text Search (title / subtitle)
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchTitle = car.title.toLowerCase().includes(q);
      const matchSubtitle = car.subtitle.toLowerCase().includes(q);
      if (!matchTitle && !matchSubtitle) return false;
    }

    // 2. Category Search
    if (categoryFilter) {
      if (car.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    }

    // 3. Price Filter (car price <= slider value)
    const priceVal = Number(car.price.replace(/\D/g, ""));
    if (priceVal > preco) return false;

    // 4. KM Filter (car mileage <= slider value)
    const kmVal = Number(car.mileage.replace(/\D/g, ""));
    if (kmVal > km) return false;

    // 5. Year Filter (car year >= slider value)
    const yearVal = Number(car.year.split("/")[0]);
    if (yearVal < ano) return false;

    return true;
  });

  const precoPercent = getPercentage(preco, 34000, 150000); // Expanded range for jeep compass
  const kmPercent = getPercentage(km, 32000, 110000);
  const anoPercent = getPercentage(ano, 2013, 2024);

  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto py-12 px-6 flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-[300px] flex-shrink-0">
        <div className="bg-brand-gray p-6 rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-brand-blue">Filtre sua busca</h3>
            <button 
              onClick={() => {
                setPreco(150000);
                setKm(110000);
                setAno(2013);
              }} 
              className="text-sm underline text-gray-500 hover:text-brand-blue transition-colors"
            >
              limpar filtros
            </button>
          </div>
          
          <div className="mb-6">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input 
                type="text" 
                placeholder="Pesquise por marca, modelo." 
                className="w-full border border-gray-300 rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-brand-blue bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <h4 className="font-bold text-sm text-brand-blue mb-3">Marca e Modelo</h4>
              <div className="flex flex-col gap-3">
                <select className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-white">
                  <option>Marca</option>
                </select>
                <select className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-white">
                  <option>Modelo</option>
                </select>
              </div>
            </div>

            {/* Preço Filter */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-bold text-sm text-brand-blue mb-6">Preço</h4>
              <div className="px-2 relative pb-2 pt-6">
                <div 
                  className="absolute bg-brand-blue text-white text-[11px] font-bold py-1 px-2.5 rounded shadow-sm -translate-x-1/2 top-0 whitespace-nowrap mb-2 transition-all duration-75"
                  style={{ left: `${precoPercent}%` }}
                >
                  {formatPrice(preco)}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-brand-blue" />
                </div>
                
                <input 
                  type="range" 
                  min={34000} 
                  max={150000} 
                  step={1000}
                  value={preco} 
                  onChange={(e) => setPreco(Number(e.target.value))}
                  className="w-full accent-brand-blue cursor-pointer" 
                />
                <div className="flex justify-between text-xs mt-2 text-gray-500">
                  <span>34mil</span>
                  <span>150mil</span>
                </div>
              </div>
            </div>

            {/* KM Filter */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-bold text-sm text-brand-blue mb-6">KM</h4>
              <div className="px-2 relative pb-2 pt-6">
                <div 
                  className="absolute bg-brand-blue text-white text-[11px] font-bold py-1 px-2.5 rounded shadow-sm -translate-x-1/2 top-0 whitespace-nowrap mb-2 transition-all duration-75"
                  style={{ left: `${kmPercent}%` }}
                >
                  {formatKm(km)}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-brand-blue" />
                </div>

                <input 
                  type="range" 
                  min={32000} 
                  max={110000} 
                  step={1000}
                  value={km}
                  onChange={(e) => setKm(Number(e.target.value))}
                  className="w-full accent-brand-blue cursor-pointer" 
                />
                <div className="flex justify-between text-xs mt-2 text-gray-500">
                  <span>32mil</span>
                  <span>110mil</span>
                </div>
              </div>
            </div>

            {/* Ano Filter */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-bold text-sm text-brand-blue mb-6">Ano</h4>
              <div className="px-2 relative pb-2 pt-6">
                <div 
                  className="absolute bg-brand-blue text-white text-[11px] font-bold py-1 px-2.5 rounded shadow-sm -translate-x-1/2 top-0 whitespace-nowrap mb-2 transition-all duration-75"
                  style={{ left: `${anoPercent}%` }}
                >
                  {ano}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-brand-blue" />
                </div>

                <input 
                  type="range" 
                  min={2013} 
                  max={2024} 
                  step={1}
                  value={ano}
                  onChange={(e) => setAno(Number(e.target.value))}
                  className="w-full accent-brand-blue cursor-pointer" 
                />
                <div className="flex justify-between text-xs mt-2 text-gray-500">
                  <span>2013</span>
                  <span>2024</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-bold text-sm text-brand-blue mb-3">Categoria, Câmbio e Cor</h4>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Categoria</span>
                  <select className="border border-gray-300 rounded-md py-1 px-2 text-sm bg-white w-32">
                    <option>Categoria</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Câmbio</span>
                  <select className="border border-gray-300 rounded-md py-1 px-2 text-sm bg-white w-32">
                    <option>Câmbio</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Cor</span>
                  <select className="border border-gray-300 rounded-md py-1 px-2 text-sm bg-white w-32">
                    <option>Cor</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Cars Grid */}
      <section className="flex-1">
        {loading ? (
          <div className="flex justify-center py-12 text-gray-500 font-semibold">Carregando catálogo...</div>
        ) : filteredCars.length === 0 ? (
          <div className="flex justify-center py-12 text-gray-500 font-semibold">Nenhum veículo encontrado com os filtros atuais.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map((car, index) => (
              <CarCard key={index} {...car} />
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-4 text-xl font-bold text-gray-400">
            <span className="text-brand-blue border-b-2 border-brand-blue px-2">1</span>
            <span className="cursor-pointer hover:text-brand-blue transition-colors">2</span>
            <span className="cursor-pointer hover:text-brand-blue transition-colors">3</span>
            <span className="cursor-pointer hover:text-brand-blue transition-colors">{">"}</span>
          </div>
          <span className="text-sm text-gray-500">
            {filteredCars.length} de {cars.length} veículos
          </span>
        </div>
      </section>
    </main>
  );
}

export default function VeiculosPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="flex justify-center py-20 text-gray-500 font-semibold">Carregando catálogo...</div>}>
        <VeiculosContent />
      </Suspense>
      <Footer />
    </>
  );
}
