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
  
  // Dynamic filter state bounds
  const [minPriceLimit, setMinPriceLimit] = useState(0);
  const [maxPriceLimit, setMaxPriceLimit] = useState(150000);
  const [minKmLimit, setMinKmLimit] = useState(0);
  const [maxKmLimit, setMaxKmLimit] = useState(110000);
  const [minYearLimit, setMinYearLimit] = useState(2013);
  const [maxYearLimit, setMaxYearLimit] = useState(2024);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Active filter state
  const [preco, setPreco] = useState(150000);
  const [km, setKm] = useState(110000);
  const [ano, setAno] = useState(2013);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTransmission, setSelectedTransmission] = useState("");
  const [localSearch, setLocalSearch] = useState("");

  // Mobile drawer state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    async function fetchCars() {
      try {
        const res = await fetch("/api/cars");
        if (res.ok) {
          const data = await res.json();
          setCars(data);
          
          // Dynamically adjust slider bounds if data exists
          if (data.length > 0) {
            const prices = data.map(c => Number(c.price.replace(/\D/g, ""))).filter(p => !isNaN(p));
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const maxPrice = prices.length > 0 ? Math.max(...prices) : 150000;
            setMinPriceLimit(minPrice);
            setMaxPriceLimit(maxPrice);

            const kms = data.map(c => Number(c.mileage.replace(/\D/g, ""))).filter(k => !isNaN(k));
            const minKm = kms.length > 0 ? Math.min(...kms) : 0;
            const maxKm = kms.length > 0 ? Math.max(...kms) : 110000;
            setMinKmLimit(minKm);
            setMaxKmLimit(maxKm);

            const years = data.map(c => Number(c.year.split("/")[0])).filter(y => !isNaN(y));
            const minYear = years.length > 0 ? Math.min(...years) : 2013;
            const maxYear = years.length > 0 ? Math.max(...years) : 2024;
            setMinYearLimit(minYear);
            setMaxYearLimit(maxYear);

            if (isFirstLoad) {
              setPreco(maxPrice);
              setKm(maxKm);
              setAno(minYear);
              setIsFirstLoad(false);
            }
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

  // Synchronize URL search parameters with React state
  useEffect(() => {
    if (searchFilter) {
      setLocalSearch(searchFilter);
    }
    if (categoryFilter) {
      setSelectedCategory(categoryFilter);
    }
  }, [searchFilter, categoryFilter]);

  // Derived options for filter selects
  const brands = Array.from(new Set(cars.map(c => c.brand))).filter(Boolean).sort();
  const models = Array.from(new Set(cars.filter(c => !selectedBrand || c.brand === selectedBrand).map(c => c.model))).filter(Boolean).sort();
  const categories = Array.from(new Set(cars.map(c => c.category))).filter(Boolean).sort();
  const transmissions = Array.from(new Set(cars.map(c => c.transmission))).filter(Boolean).sort();

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
    // 1. Text Search (title / subtitle / brand / model)
    if (localSearch) {
      const q = localSearch.toLowerCase();
      const matchTitle = car.title?.toLowerCase().includes(q);
      const matchSubtitle = car.subtitle?.toLowerCase().includes(q);
      const matchBrand = car.brand?.toLowerCase().includes(q);
      const matchModel = car.model?.toLowerCase().includes(q);
      if (!matchTitle && !matchSubtitle && !matchBrand && !matchModel) return false;
    }

    // 2. Brand Filter
    if (selectedBrand && car.brand !== selectedBrand) return false;

    // 3. Model Filter
    if (selectedModel && car.model !== selectedModel) return false;

    // 4. Category Filter
    if (selectedCategory && car.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;

    // 5. Transmission Filter
    if (selectedTransmission && car.transmission !== selectedTransmission) return false;

    // 6. Price Filter (car price <= slider value)
    const priceVal = Number(car.price.replace(/\D/g, ""));
    if (priceVal > preco) return false;

    // 7. KM Filter (car mileage <= slider value)
    const kmVal = Number(car.mileage.replace(/\D/g, ""));
    if (kmVal > km) return false;

    // 8. Year Filter (car year >= slider value)
    const yearVal = Number(car.year.split("/")[0]);
    if (yearVal < ano) return false;

    return true;
  });

  const handleClearFilters = () => {
    setPreco(maxPriceLimit);
    setKm(maxKmLimit);
    setAno(minYearLimit);
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedCategory("");
    setSelectedTransmission("");
    setLocalSearch("");
  };

  const precoPercent = getPercentage(preco, minPriceLimit, maxPriceLimit);
  const kmPercent = getPercentage(km, minKmLimit, maxKmLimit);
  const anoPercent = getPercentage(ano, minYearLimit, maxYearLimit);

  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto py-8 md:py-12 px-6 flex flex-col md:flex-row gap-8">
      {/* Mobile Filter Header Toggle */}
      <div className="md:hidden flex justify-between items-center bg-brand-gray p-4 rounded-xl border border-gray-200">
        <div className="flex flex-col">
          <span className="font-bold text-brand-blue text-md">Filtros</span>
          <span className="text-[12px] text-gray-500">{filteredCars.length} veículos encontrados</span>
        </div>
        <button 
          onClick={() => setIsFiltersOpen(!isFiltersOpen)} 
          className="bg-brand-blue text-white px-5 py-2.5 rounded-[25px] text-sm font-semibold flex items-center gap-2 transition-all hover:bg-opacity-95 shadow-sm active:scale-95 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
            {isFiltersOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            )}
          </svg>
          {isFiltersOpen ? "Fechar" : "Filtrar"}
        </button>
      </div>

      {/* Sidebar Filters */}
      <aside className={`w-full md:w-[300px] flex-shrink-0 transition-all duration-300 ${isFiltersOpen ? "block" : "hidden md:block"}`}>
        <div className="bg-brand-gray p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-brand-blue">Filtre sua busca</h3>
            <button 
              onClick={handleClearFilters} 
              className="text-sm underline text-gray-500 hover:text-brand-blue transition-colors cursor-pointer"
            >
              limpar filtros
            </button>
          </div>
          
          {/* Text Search Input */}
          <div className="mb-6">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input 
                type="text" 
                placeholder="Pesquise por marca, modelo..." 
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-brand-blue bg-white text-gray-800"
              />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Brand & Model */}
            <div>
              <h4 className="font-bold text-sm text-brand-blue mb-3">Marca e Modelo</h4>
              <div className="flex flex-col gap-3">
                <select 
                  value={selectedBrand} 
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    setSelectedModel("");
                  }}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-white text-gray-700 focus:outline-none focus:border-brand-blue"
                >
                  <option value="">Marca (Todas)</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
                <select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-white text-gray-700 focus:outline-none focus:border-brand-blue disabled:bg-gray-100 disabled:text-gray-400"
                  disabled={!selectedBrand}
                >
                  <option value="">Modelo (Todos)</option>
                  {models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preço Filter */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-bold text-sm text-brand-blue mb-6">Preço Máximo</h4>
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
                  min={minPriceLimit} 
                  max={maxPriceLimit} 
                  step={1000}
                  value={preco} 
                  onChange={(e) => setPreco(Number(e.target.value))}
                  className="w-full accent-brand-blue cursor-pointer" 
                />
                <div className="flex justify-between text-[11px] mt-2 text-gray-500">
                  <span>{formatPrice(minPriceLimit)}</span>
                  <span>{formatPrice(maxPriceLimit)}</span>
                </div>
              </div>
            </div>

            {/* KM Filter */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-bold text-sm text-brand-blue mb-6">KM Máxima</h4>
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
                  min={minKmLimit} 
                  max={maxKmLimit} 
                  step={1000}
                  value={km}
                  onChange={(e) => setKm(Number(e.target.value))}
                  className="w-full accent-brand-blue cursor-pointer" 
                />
                <div className="flex justify-between text-[11px] mt-2 text-gray-500">
                  <span>{formatKm(minKmLimit)}</span>
                  <span>{formatKm(maxKmLimit)}</span>
                </div>
              </div>
            </div>

            {/* Ano Filter */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-bold text-sm text-brand-blue mb-6">Ano Mínimo</h4>
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
                  min={minYearLimit} 
                  max={maxYearLimit} 
                  step={1}
                  value={ano}
                  onChange={(e) => setAno(Number(e.target.value))}
                  className="w-full accent-brand-blue cursor-pointer" 
                />
                <div className="flex justify-between text-[11px] mt-2 text-gray-500">
                  <span>{minYearLimit}</span>
                  <span>{maxYearLimit}</span>
                </div>
              </div>
            </div>

            {/* Category & Transmission */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-bold text-sm text-brand-blue mb-3">Categoria e Câmbio</h4>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Categoria</span>
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border border-gray-300 rounded-md py-1 px-2 text-sm bg-white w-36 text-gray-700 focus:outline-none focus:border-brand-blue"
                  >
                    <option value="">Todas</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Câmbio</span>
                  <select 
                    value={selectedTransmission} 
                    onChange={(e) => setSelectedTransmission(e.target.value)}
                    className="border border-gray-300 rounded-md py-1 px-2 text-sm bg-white w-36 text-gray-700 focus:outline-none focus:border-brand-blue"
                  >
                    <option value="">Todos</option>
                    {transmissions.map(trans => (
                      <option key={trans} value={trans}>{trans}</option>
                    ))}
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
            Mostrando {filteredCars.length} de {cars.length} veículos
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
