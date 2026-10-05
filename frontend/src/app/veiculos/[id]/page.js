"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import Image from "next/image";
import { useParams } from "next/navigation";
import { findCarBySlugOrId } from "@/lib/slug";

export default function ProductPage() {
  const params = useParams();
  const id = params?.id || params?.slug;
  const [cars, setCars] = useState([]);
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isModalOpen]);

  useEffect(() => {
    async function fetchCars() {
      try {
        const res = await fetch("/api/cars");
        if (res.ok) {
          const data = await res.json();
          setCars(data);
          
          const found = findCarBySlugOrId(data, id);
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
  const recommendations = cars.filter(c => String(c.id) !== String(car.id)).slice(0, 5);

  const carImages = car.images && car.images.length > 0 
    ? car.images 
    : (car.imageUrl ? [car.imageUrl] : ["/images/ford ka.png"]);

  const handleTouchStart = (e) => {
    touchStartRef.current = e.targetTouches[0].clientX;
    touchEndRef.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartRef.current === null) return;
    
    const distance = touchEndRef.current !== null ? touchStartRef.current - touchEndRef.current : 0;
    
    // It's a tap. Real mobile devices often suppress native clicks if touch handlers exist.
    // So we explicitly open the modal here.
    if (touchEndRef.current === null || Math.abs(distance) < 10) {
      setIsModalOpen(true);
      touchStartRef.current = null;
      touchEndRef.current = null;
      return;
    }

    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      setActiveImageIndex(prev => (prev === carImages.length - 1 ? 0 : prev + 1));
    } else if (isRightSwipe) {
      setActiveImageIndex(prev => (prev === 0 ? carImages.length - 1 : prev - 1));
    }
    
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  return (
    <>
      <Header />
      
      {/* Fullscreen Image Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black flex flex-col touch-none overscroll-none">
          
          {/* Header do modal */}
          <div className="flex items-center justify-between p-4 z-50 bg-black/80">
            <span className="text-white font-bold text-base md:text-lg px-1 md:px-2">
              {activeImageIndex + 1} / {carImages.length}
            </span>
            <div className="flex items-center gap-3 md:gap-5 text-white px-1 md:px-2">
              {/* Zoom */}
              <button className="hover:text-gray-300 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                </svg>
              </button>
              {/* Play */}
              <button className="hover:text-gray-300 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                </svg>
              </button>
              {/* Fullscreen */}
              <button className="hover:text-gray-300 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              </button>
              {/* Grid */}
              <button className="hover:text-gray-300 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 0120.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </button>
              {/* Close */}
              <button 
                onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
                className="hover:text-gray-300 transition-colors ml-1 md:ml-2"
                title="Fechar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 md:w-7 md:h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Container da imagem */}
          <div 
            className="relative flex-1 w-full flex items-center justify-center p-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img 
              src={carImages[activeImageIndex]} 
              alt="Foto ampliada" 
              className="w-full h-auto max-h-full object-contain select-none cursor-default"
            />
            
            {carImages.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => (prev === 0 ? carImages.length - 1 : prev - 1)); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-3 shadow-lg transition-colors z-50 cursor-pointer border border-white/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => (prev === carImages.length - 1 ? 0 : prev + 1)); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-3 shadow-lg transition-colors z-50 cursor-pointer border border-white/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </>
            )}
          </div>
          
          {/* Miniaturas do Modal (Bottom) */}
          {carImages.length > 1 && (
            <div className="w-full bg-black/90 p-4 pt-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
                {carImages.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex(index); }}
                    className={`relative w-20 aspect-[4/3] rounded overflow-hidden flex-shrink-0 transition-all cursor-pointer ${
                      activeImageIndex === index ? "border-2 border-red-600 opacity-100" : "border-2 border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img 
                      src={imgUrl} 
                      alt={`Miniatura modal ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <main className="flex-1 w-full max-w-[1200px] mx-auto py-12 px-6">
        {/* Product Details Section */}
        <section className="flex flex-col gap-8 mb-16">
          <div className="flex flex-col lg:flex-row gap-12 items-stretch">
            {/* Gallery Main Image */}
            <div className="flex-1">
              <div 
                onClick={() => setIsModalOpen(true)}
                className="relative bg-gray-100 dark:bg-slate-800/80 w-full aspect-[4/3] rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 overflow-hidden shadow-md group border border-transparent dark:border-white/10 cursor-pointer hover:opacity-95 transition-opacity"
              >
                {carImages.length > 0 ? (
                  <img 
                    src={carImages[activeImageIndex]} 
                    alt={`${car.title} ${car.subtitle} - Foto ${activeImageIndex + 1}`} 
                    className="w-full h-full object-cover transition-all duration-300 pointer-events-none" 
                  />
                ) : (
                  <span className="text-sm z-10 relative pointer-events-none">Sem Foto</span>
                )}

                {/* Setas de navegação lateral (só aparecem se houver mais de 1 imagem) */}
                {carImages.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => (prev === 0 ? carImages.length - 1 : prev - 1)); }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2.5 shadow-md transition-colors cursor-pointer lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 flex items-center justify-center z-10"
                      title="Anterior"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => (prev === carImages.length - 1 ? 0 : prev + 1)); }}
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
                        onClick={(e) => { e.stopPropagation(); setActiveImageIndex(index); }}
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
                <h1 className="text-[24px] md:text-[32px] font-bold text-gray-800 dark:text-white leading-tight">{car.title}</h1>
                <h2 className="text-[24px] md:text-[32px] font-extrabold text-brand-blue dark:text-blue-400 uppercase mb-4 lg:mb-0">{car.subtitle}</h2>
              </div>
              
              <div className="flex flex-col gap-3.5 my-6 lg:my-0 text-md text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-3">
                  <Image src="/images/calendar icon.png" alt="Ano" width={20} height={20} className="opacity-70 dark:invert dark:brightness-200" unoptimized />
                  <span className="font-medium">{car.year}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Image src="/images/velocimeter.png" alt="KM" width={20} height={20} className="opacity-70 dark:invert dark:brightness-200" unoptimized />
                  <span className="font-medium">{car.mileage}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Image src="/images/sticks.png" alt="Câmbio" width={20} height={20} className="opacity-70 dark:invert dark:brightness-200" unoptimized />
                  <span className="font-medium">{car.transmission}</span>
                </div>
              </div>

              <div className="flex flex-col mb-6 lg:mb-0">
                {car.isOffer && car.promoPrice ? (
                  <>
                    <span className="text-sm md:text-md text-gray-400 dark:text-gray-500 line-through font-normal mb-1">{car.price}</span>
                    <span className="text-[32px] md:text-[40px] font-extrabold text-green-600 dark:text-emerald-400 leading-none">{car.promoPrice}</span>
                  </>
                ) : (
                  <span className="text-[32px] md:text-[40px] font-extrabold text-brand-blue dark:text-blue-400 leading-none">{car.price}</span>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <a 
                  href={`https://wa.me/5527996361212?text=Olá! Gostaria de saber mais informações sobre o ${car.title} ${car.subtitle} (${car.year}) anunciado por ${car.isOffer && car.promoPrice ? car.promoPrice : car.price}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-blue dark:bg-blue-600 text-white rounded-[25px] w-full py-3 text-center font-bold text-lg hover:bg-blue-900 dark:hover:bg-blue-500 transition-colors shadow-md flex items-center justify-center cursor-pointer"
                >
                  Fale conosco
                </a>
                <a
                  href={`https://wa.me/5527996361212?text=Olá! Gostaria de fazer uma simulação de financiamento para o ${car.title} ${car.subtitle} (${car.year}) anunciado por ${car.isOffer && car.promoPrice ? car.promoPrice : car.price}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-brand-blue dark:border-blue-400 text-brand-blue dark:text-blue-400 bg-white dark:bg-transparent rounded-[25px] w-full py-3 text-center font-bold text-lg hover:bg-brand-blue dark:hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center cursor-pointer"
                >
                  Simular Financiamento
                </a>
              </div>
            </div>
          </div>

          {/* Lista de Miniaturas (Thumbnails) abaixo da foto principal e do bloco de Info */}
          {carImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
              {carImages.map((imgUrl, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`relative w-20 sm:w-24 aspect-video rounded-lg overflow-hidden border-2 bg-white dark:bg-slate-800 flex-shrink-0 transition-all cursor-pointer shadow-sm ${
                    activeImageIndex === index ? "border-brand-blue dark:border-blue-400 scale-95" : "border-transparent hover:border-gray-300 dark:hover:border-slate-600"
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
            <h3 className="text-[24px] font-bold text-black dark:text-white mb-6">Acessórios e outros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
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
            <h3 className="text-[24px] font-bold text-black dark:text-white mb-6">Você também pode gostar:</h3>
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
