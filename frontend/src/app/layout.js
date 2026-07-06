import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Dri-Car Veículos",
  description: "Encontre seu próximo carro na Dri-Car Veículos. As melhores ofertas de Hatch, Sedan e SUVs.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} antialiased h-full`}>
      <body className="min-h-full flex flex-col bg-brand-white text-brand-blue">
        {children}
      </body>
    </html>
  );
}
