import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <>
      {/* Mobile Footer (Simplified layout) */}
      <footer className="md:hidden bg-[#333333] text-white py-8 px-4 sm:px-6 border-t border-white/5">
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
              <div className="absolute -right-3 bottom-0.5 sm:-right-5 sm:bottom-1.5 w-[32px] h-[32px] sm:w-[44px] sm:h-[44px] -rotate-90 animate-bounce flex items-center justify-center z-10 pointer-events-none">
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

      {/* Desktop Footer (Original 5-column layout) */}
      <footer className="hidden md:block bg-[#333333] text-white py-12 px-6 border-t border-white/5">
        <div className="max-w-[1200px] mx-auto flex flex-row items-start justify-between gap-4">
          
          {/* Maps Section */}
          <div className="flex flex-col items-center">
            <a href="https://maps.app.goo.gl/RJcYwW9h5RPSKYvq9" target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
              <div className="relative w-[150px] h-[150px] rounded-lg overflow-hidden border border-white/10">
                <Image src="/images/maps.png" alt="Como Chegar - Maps" fill className="object-cover" />
              </div>
            </a>
            <span className="font-bold text-sm mt-3 uppercase tracking-wider text-gray-300 text-center">Como Chegar</span>
          </div>

          {/* Links: Comprar */}
          <div className="flex flex-col">
            <h4 className="font-bold text-lg mb-4 text-white uppercase tracking-wider">Comprar</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/veiculos" className="hover:text-white transition-colors">Compre seu Carro</Link></li>
              <li><Link href="/veiculos" className="hover:text-white transition-colors">Compre sua Moto</Link></li>
            </ul>
            <div className="mt-8">
              <a href="https://wa.me/5527999361212" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-white/40 rounded-full py-1.5 px-4 text-xs hover:bg-white hover:text-[#333333] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
                Fale Conosco
              </a>
            </div>
          </div>

          {/* Links: Vender */}
          <div className="flex flex-col">
            <h4 className="font-bold text-lg mb-4 text-white uppercase tracking-wider">Vender</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/veiculos" className="hover:text-white transition-colors">Venda seu Veículo</Link></li>
              <li><Link href="/veiculos" className="hover:text-white transition-colors">Financie seu Veículo</Link></li>
            </ul>
          </div>

          {/* Links: Institucional */}
          <div className="flex flex-col">
            <h4 className="font-bold text-lg mb-4 text-white uppercase tracking-wider">Institucional</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/quem-somos" className="hover:text-white transition-colors">Quem Somos</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Termos de Uso</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Política de Privacidade</Link></li>
            </ul>
          </div>

          {/* Logo & Info */}
          <div className="flex flex-col items-end">
            <Image src="/images/logo branca sem fundo.png" alt="Dri-Car Veículos" width={160} height={50} className="mb-4 object-contain h-[50px] w-auto" />
            
            <div className="flex flex-col items-end gap-1 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <span className="font-bold">COMPRA</span>
                <span>•</span>
                <span className="font-bold">VENDE</span>
                <span>•</span>
                <span className="font-bold">TROCA</span>
                <span>•</span>
                <span className="font-bold">FINANCIA</span>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.273-3.973-6.869-6.87l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <span>27 99936-1212</span>
              </div>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.273-3.973-6.869-6.87l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <span>27 3261-0782</span>
              </div>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.46 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
                <span>@dricar.veiculos</span>
              </div>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}
