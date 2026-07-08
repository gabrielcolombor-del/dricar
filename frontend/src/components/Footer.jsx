import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#333333] text-white py-8 px-4 sm:px-6 border-t border-white/5">
      <div className="max-w-[900px] mx-auto flex flex-row items-center justify-between gap-3 sm:gap-6 w-full">
        
        {/* Left Column: Maps Section */}
        <div className="flex flex-col items-center flex-1 min-w-0">
          <a 
            href="https://maps.app.goo.gl/RJcYwW9h5RPSKYvq9" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block hover:opacity-80 transition-opacity relative"
          >
            <div className="relative w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] rounded-lg overflow-hidden border border-white/10">
              <Image src="/images/maps.png" alt="Como Chegar - Maps" fill className="object-cover" />
            </div>
            {/* Click Indicator Overlay */}
            <div className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 w-[20px] h-[20px] sm:w-[28px] sm:h-[28px] bg-white/95 rounded-full p-1 shadow-md animate-bounce flex items-center justify-center border border-black/5 z-10">
              <img src="/images/icon_click.png" alt="Clique para ver o mapa" className="w-full h-full object-contain" />
            </div>
          </a>
          <span className="font-bold text-[9px] sm:text-xs mt-2.5 uppercase tracking-wider text-gray-300 text-center">Como Chegar</span>
        </div>

        {/* Center Column: Links: Institucional */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0">
          <h4 className="font-bold text-[11px] sm:text-sm mb-2 sm:mb-3 text-white uppercase tracking-wider">Institucional</h4>
          <ul className="space-y-1.5 text-[10px] sm:text-xs text-gray-300">
            <li><Link href="/quem-somos" className="hover:text-white transition-colors block truncate">Quem Somos</Link></li>
            <li><Link href="/veiculos" className="hover:text-white transition-colors block truncate">Compre</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors block truncate">Termos</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors block truncate">Privacidade</Link></li>
          </ul>
        </div>

        {/* Right Column: Logo & WhatsApp Button */}
        <div className="flex flex-col items-center sm:items-end flex-1 min-w-0">
          <div className="relative w-[110px] h-[35px] sm:w-[140px] sm:h-[44px] mb-2.5 sm:mb-3">
            <Image 
              src="/images/logo branca sem fundo.png" 
              alt="Dri-Car Veículos" 
              fill
              className="object-contain" 
            />
          </div>
          
          <a 
            href="https://wa.me/5527999361212" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 sm:gap-2 bg-white text-[#333333] hover:bg-gray-100 transition-colors rounded-full py-1.5 px-3 sm:py-2 sm:px-5 text-[9px] sm:text-xs font-bold shadow-md cursor-pointer active:scale-95 transition-all text-center whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
            Fale Conosco
          </a>
        </div>

      </div>
    </footer>
  );
}
