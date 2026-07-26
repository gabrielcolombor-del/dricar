"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const checkAndApplyTheme = () => {
      // O modo escuro funciona EXCLUSIVAMENTE para dispositivos móveis (< 768px) caso o sistema do usuário esteja em modo escuro.
      // Em telas desktop (>= 768px), o site permanece 100% no Modo Claro (Light Mode), independente da preferência do SO.
      const isMobile = window.innerWidth < 768;
      const isSystemDark = mediaQuery.matches;

      if (isMobile && isSystemDark) {
        setTheme("dark");
        document.documentElement.classList.add("dark");
      } else {
        setTheme("light");
        document.documentElement.classList.remove("dark");
      }
    };

    // Checagem inicial
    checkAndApplyTheme();

    // Escutar alterações do SO e redimensionamento da janela
    const handleSystemChange = () => checkAndApplyTheme();
    const handleResize = () => checkAndApplyTheme();

    mediaQuery.addEventListener("change", handleSystemChange);
    window.addEventListener("resize", handleResize);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
