import Image from "next/image";
import Link from "next/link";

export default function CarCard({ id, title, subtitle, year, mileage, transmission, price, imageUrl }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 group">
      
      {/* Imagem */}
      <div className="relative w-full aspect-[4/3] bg-[#E5E5E5] overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover animate-fade-in" />
        ) : (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 mb-2 opacity-50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="text-sm">Sem Foto</span>
          </div>
        )}
      </div>
      
      <div className="px-4 pt-4 pb-4 flex flex-col flex-grow items-center">
        {/* Título e Subtítulo */}
        <h3 className="text-[17px] font-medium text-gray-800 leading-tight text-center">{title}</h3>
        <p className="text-[12px] font-medium text-gray-500 uppercase tracking-wide mb-3 mt-1 text-center">{subtitle}</p>
        
        {/* Ícones de Específicações */}
        <div className="w-full flex flex-col gap-2 mb-4 px-2">
          <div className="flex items-center justify-center gap-3">
            <Image src="/images/calendar icon.png" alt="Ano" width={18} height={18} className="opacity-80" unoptimized />
            <span className="text-[12px] font-medium text-gray-700">{year}</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Image src="/images/sticks.png" alt="Câmbio" width={18} height={18} className="opacity-80" unoptimized />
            <span className="text-[12px] font-medium text-gray-700">{transmission}</span>
          </div>
        </div>
        
        {/* Preço */}
        <div className="text-center font-extrabold text-[20px] text-gray-900 mb-4">
          {price}
        </div>
        
        {/* Botão */}
        <div className="w-full mt-auto">
          <Link href={`/veiculos/${id}`} className="bg-brand-blue text-white rounded-[25px] w-full py-2 text-center block font-semibold text-[13px] hover:bg-blue-900 transition-colors">
            Saiba mais
          </Link>
        </div>
      </div>
    </div>
  );
}
