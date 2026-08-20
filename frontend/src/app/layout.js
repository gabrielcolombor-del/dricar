import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeContext";

const kantumruy = localFont({
  src: "../../public/fonts/KantumruyPro-Bold.ttf",
  variable: "--font-kantumruy",
  weight: "700",
  display: "swap",
});

const louisGeorge = localFont({
  src: "../../public/fonts/LouisGeorgeCafeLight.ttf",
  variable: "--font-louis-george",
  weight: "300",
  display: "swap",
});

export const metadata = {
  title: "Dri-Car Veículos",
  description: "Encontre seu próximo carro na Dri-Car Veículos. As melhores ofertas de Hatch, Sedan e SUVs.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${kantumruy.variable} ${louisGeorge.variable} antialiased h-full`}>
      <body className="min-h-full flex flex-col bg-brand-white text-brand-blue dark:bg-[#070f26] dark:text-slate-100 transition-colors duration-300">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
