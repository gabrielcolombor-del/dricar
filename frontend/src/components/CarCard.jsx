import Image from "next/image";
import Link from "next/link";
import { getCarSlug } from "@/lib/slug";

export default function CarCard({ id, slug, title, subtitle, year, mileage, transmission, price, imageUrl, isOffer, promoPrice, brand, model, description }) {
  const carSlug = slug || getCarSlug({ id, title, subtitle, brand, model, description });

  return (
    <div className="bg-white dark:bg-[#0e1b42] dark:border dark:border-white/10 dark:hover:border-blue-400/50 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 group h-full">
      
      {/* Imagem */}
      <div className="relative w-full aspect-[4/3] bg-[#E5E5E5] dark:bg-slate-800 overflow-hidden shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover animate-fade-in" />
        ) : (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 mb-2 opacity-50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="text-sm">Sem Foto</span>
          </div>
        )}

        {isOffer && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-extrabold uppercase px-2 py-1 rounded shadow-md z-10 tracking-wider">
            Oferta
          </span>
        )}
      </div>
      
      <div className="px-4 pt-4 pb-4 flex flex-col flex-grow items-center justify-between">
        {/* Título - Centralizado pelo meio vertical com altura fixa para 2 linhas */}
        <div className="h-[46px] w-full flex items-center justify-center text-center px-1">
          <h3 className="text-[17px] font-medium text-gray-800 dark:text-white leading-tight line-clamp-2">{title}</h3>
        </div>

        {/* Subtítulo - Centralizado pelo meio vertical com altura fixa */}
        <div className="h-[28px] w-full flex items-center justify-center text-center mt-1 mb-3 px-1">
          <p className="text-[12px] font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide truncate">{subtitle}</p>
        </div>
        
        {/* Ícones de Especificações */}
        <div className="w-full flex flex-col gap-2 mb-4 px-2 h-[52px] justify-center">
          <div className="flex items-center justify-center gap-3">
            <Image src="/images/calendar icon.png" alt="Ano" width={18} height={18} className="opacity-80 dark:invert" unoptimized />
            <span className="text-[12px] font-medium text-gray-700 dark:text-gray-200">{year}</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Image src="/images/sticks.png" alt="Câmbio" width={18} height={18} className="opacity-80 dark:invert" unoptimized />
            <span className="text-[12px] font-medium text-gray-700 dark:text-gray-200">{transmission}</span>
          </div>
        </div>
        
        {/* Preço - Centralizado pelo meio vertical com altura fixa */}
        <div className="text-center mb-4 flex flex-col items-center justify-center h-[46px] w-full">
          {isOffer && promoPrice ? (
            <>
              <span className="text-[12px] text-gray-400 dark:text-gray-400 line-through leading-none mb-1 font-normal">de {price}</span>
              <span className="font-extrabold text-[20px] text-green-600 dark:text-green-400 leading-none">por {promoPrice}</span>
            </>
          ) : (
            <span className="font-extrabold text-[20px] text-gray-900 dark:text-white leading-normal">{price}</span>
          )}
        </div>
        
        {/* Botão */}
        <div className="w-full mt-auto">
          <Link href={`/veiculos/${carSlug}`} className="bg-brand-blue dark:bg-blue-600 text-white rounded-[25px] w-full py-2 text-center block font-semibold text-[13px] hover:bg-blue-900 dark:hover:bg-blue-500 transition-colors shadow">
            Saiba mais
          </Link>
        </div>
      </div>
    </div>
  );
}
