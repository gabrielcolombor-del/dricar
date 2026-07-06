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

  return (
    <>
      <Header />
      
      <main className="flex-1 w-full max-w-[1200px] mx-auto py-12 px-6">
        {/* Product Details Section */}
        <section className="flex flex-col lg:flex-row gap-12 mb-16">
          {/* Gallery */}
          <div className="flex-1">
            <div className="relative bg-gray-200 w-full aspect-[4/3] lg:aspect-video rounded-xl flex items-center justify-center text-gray-400 mb-4 overflow-hidden shadow-md">
              {car.imageUrl ? (
                <Image src={car.imageUrl} alt={`${car.title} ${car.subtitle}`} fill className="object-cover" priority />
              ) : (
                <span className="text-sm">Sem Foto</span>
              )}
            </div>
            {/* Gallery pagination dots */}
            <div className="flex justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-700"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
            </div>
          </div>

          {/* Info */}
          <div className="w-full lg:w-[400px] flex flex-col justify-center">
            <h1 className="text-[32px] font-bold text-gray-800 leading-tight">{car.title}</h1>
            <h2 className="text-[32px] font-extrabold text-brand-blue uppercase mb-6">{car.subtitle}</h2>
            
            <div className="flex flex-col gap-3.5 mb-8 text-md text-gray-700">
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

            <div className="text-[40px] font-extrabold text-brand-blue mb-8">
              {car.price}
            </div>

            <div className="flex flex-col gap-4">
              <a 
                href={`https://wa.me/5527999361212?text=Olá! Gostaria de saber mais informações sobre o ${car.title} ${car.subtitle} (${car.year}) anunciado por ${car.price}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-blue text-white rounded-[25px] w-full py-4 text-center font-bold text-lg hover:bg-blue-900 transition-colors shadow-md"
              >
                Fale conosco
              </a>
              <button className="border border-brand-blue text-brand-blue bg-white rounded-[25px] w-full py-4 text-center font-bold text-lg hover:bg-brand-blue hover:text-white transition-all shadow-sm">
                Simular Financiamento
              </button>
            </div>
          </div>
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
