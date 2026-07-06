import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-brand-blue text-brand-white w-full py-4 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-50">
      <div className="flex-1">
        <Link href="/" className="inline-block">
          <Image
            src="/images/logo branca sem fundo.png"
            alt="Dri-Car Veículos"
            width={160}
            height={50}
            className="object-contain h-[50px] w-auto"
            priority
          />
        </Link>
      </div>

      <nav className="hidden md:flex flex-1 items-center justify-center gap-10">
        <Link href="/quem-somos" className="text-[15px] font-medium hover:text-gray-300 transition-colors">
          Quem Somos
        </Link>
        <Link href="/veiculos" className="text-[15px] font-medium hover:text-gray-300 transition-colors">
          Compre
        </Link>
        <Link href="#" className="text-[15px] font-medium hover:text-gray-300 transition-colors">
          Venda
        </Link>
        <Link href="#" className="text-[15px] font-medium hover:text-gray-300 transition-colors">
          Financiamento
        </Link>
      </nav>

      <div className="flex-1 flex justify-end">
        <a href="#" className="flex items-center gap-2 border border-white rounded-[25px] py-2 px-6 text-[14px] font-medium hover:bg-white hover:text-brand-blue transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          Converse Conosco
        </a>
      </div>
    </header>
  );
}
