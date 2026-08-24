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
  weight: "100 900",
  display: "swap",
});

export const metadata = {
  title: "Dri-Car Veículos",
  description: "Encontre seu próximo carro na Dri-Car Veículos. As melhores ofertas de Hatch, Sedan e SUVs.",
};

export const viewport = {
  colorScheme: "light",
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" style={{ colorScheme: "light" }} className={`${kantumruy.variable} ${louisGeorge.variable} antialiased h-full`}>
      <body className="min-h-full flex flex-col bg-brand-white text-brand-blue transition-colors duration-300">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
