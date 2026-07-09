"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import Image from "next/image";
import { useParams } from "next/navigation";

export default function ProductPage() {
  const { id } = useParams();
  const [cars, setCars] = useState([]);
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    async function fetchCars() {
      try {
        const res = await fetch("/api/cars");
        if (res.ok) {
          const data = await res.json();
          setCars(data);
          
          const found = data.find(c => String(c.id) === String(id));
          if (found) {
            setCar(found);
          }
        }
      } catch (err) {
        console.error("Failed to fetch car data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCars();
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center py-40 text-gray-500 font-semibold">
          Carregando informações do veículo...
        </div>
        <Footer />
      </>
    );
  }

  if (!car) {
    return (
      <>
        <Header />
        <div className="flex flex-col justify-center items-center py-40 text-gray-500 gap-4">
          <p className="font-semibold text-lg">Veículo não encontrado em nosso estoque.</p>
          <a href="/veiculos" className="text-brand-blue underline font-bold">Voltar para o catálogo</a>
        </div>
        <Footer />
      </>
    );
  }

  // Split accessories into two columns
  const halfLength = Math.ceil(car.accessories.length / 2);
  const leftColAccessories = car.accessories.slice(0, halfLength);
  const rightColAccessories = car.accessories.slice(halfLength);

  // Recommendations: exclude current car, take up to 5 cars
  const recommendations = cars.filter(c => String(c.id) !== String(id)).slice(0, 5);

  const carImages = car.images && car.images.length > 0 
    ? car.images 
    : (car.imageUrl ? [car.imageUrl] : ["/images/ford ka.png"]);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      setActiveImageIndex(prev => (prev === carImages.length - 1 ? 0 : prev + 1));
    }
    if (isRightSwipe) {
      setActiveImageIndex(prev => (prev === 0 ? carImages.length - 1 : prev - 1));
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <>
      <Header />
      
      <main className="flex-1 w-full max-w-[1200px] mx-auto py-12 px-6">
        {/* Product Details Section */}
        <section className="flex flex-col gap-8 mb-16">
          <div className="flex flex-col lg:flex-row gap-12 items-stretch">
            {/* Gallery Main Image */}
            <div className="flex-1">
              <div 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="relative bg-gray-100 w-full aspect-[4/3] rounded-xl flex items-center justify-center text-gray-400 overflow-hidden shadow-md group"
              >
                {carImages.length > 0 ? (
                  <img 
                    src={carImages[activeImageIndex]} 
                    alt={`${car.title} ${car.subtitle} - Foto ${activeImageIndex + 1}`} 
                    className="w-full h-full object-cover transition-all duration-300" 
                  />
                ) : (
                  <span className="text-sm">Sem Foto</span>
                )}

                {/* Setas de navegação lateral (só aparecem se houver mais de 1 imagem) */}
                {carImages.length > 1 && (
                  <>
                    <button 
                      onClick={() => setActiveImageIndex(prev => (prev === 0 ? carImages.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2.5 shadow-md transition-colors cursor-pointer lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 flex items-center justify-center z-10"
                      title="Anterior"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setActiveImageIndex(prev => (prev === carImages.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2.5 shadow-md transition-colors cursor-pointer lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 flex items-center justify-center z-10"
                      title="Próxima"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Slider pagination dots */}
                {carImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/25 px-3 py-1.5 rounded-full backdrop-blur-xs">
                    {carImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                          activeImageIndex === index ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"
                        }`}
                        title={`Ir para foto ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="w-full lg:w-[400px] flex flex-col justify-start lg:justify-between lg:py-1">
              <div>
                <h1 className="text-[24px] md:text-[32px] font-bold text-gray-800 leading-tight">{car.title}</h1>
                <h2 className="text-[24px] md:text-[32px] font-extrabold text-brand-blue uppercase mb-4 lg:mb-0">{car.subtitle}</h2>
              </div>
              
              <div className="flex flex-col gap-3.5 my-6 lg:my-0 text-md text-gray-700">
                <div className="flex items-center gap-3">
                  <Image src="/images/calendar icon.png" alt="Ano" width={20} height={20} className="opacity-70" unoptimized />
                  <span className="font-medium">{car.year}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Image src="/images/velocimeter.png" alt="KM" width={20} height={20} className="opacity-70" unoptimized />
                  <span className="font-medium">{car.mileage}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Image src="/images/sticks.png" alt="Câmbio" width={20} height={20} className="opacity-70" unoptimized />
                  <span className="font-medium">{car.transmission}</span>
                </div>
              </div>

              <div className="text-[32px] md:text-[40px] font-extrabold text-brand-blue mb-6 lg:mb-0">
                {car.price}
              </div>

              <div className="flex flex-col gap-3">
                <a 
                  href={`https://wa.me/5527999361212?text=Olá! Gostaria de saber mais informações sobre o ${car.title} ${car.subtitle} (${car.year}) anunciado por ${car.price}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-blue text-white rounded-[25px] w-full py-3 text-center font-bold text-lg hover:bg-blue-900 transition-colors shadow-md flex items-center justify-center"
                >
                  Fale conosco
                </a>
                <button className="border border-brand-blue text-brand-blue bg-white rounded-[25px] w-full py-3 text-center font-bold text-lg hover:bg-brand-blue hover:text-white transition-all shadow-sm">
                  Simular Financiamento
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Miniaturas (Thumbnails) abaixo da foto principal e do bloco de Info */}
          {carImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-gray-300">
              {carImages.map((imgUrl, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`relative w-20 sm:w-24 aspect-video rounded-lg overflow-hidden border-2 bg-white flex-shrink-0 transition-all cursor-pointer shadow-sm ${
                    activeImageIndex === index ? "border-brand-blue scale-95" : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img 
                    src={imgUrl} 
                    alt={`Miniatura ${index + 1}`} 
                    className="w-full h-full object-cover" 
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Acessórios e outros */}
        {car.accessories.length > 0 && (
          <section className="mb-16">
            <h3 className="text-[24px] font-bold text-black mb-6">Acessórios e outros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              <ul className="list-disc list-inside space-y-2">
                {leftColAccessories.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <ul className="list-disc list-inside space-y-2">
                {rightColAccessories.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Você também pode gostar */}
        {recommendations.length > 0 && (
          <section className="mb-16">
            <h3 className="text-[24px] font-bold text-black mb-6">Você também pode gostar:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {recommendations.map((car, index) => (
                <CarCard key={index} {...car} />
              ))}
            </div>
          </section>
        )}

      </main>

      <Footer />
    </>
  );
}
