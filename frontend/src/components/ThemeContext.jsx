"use client";

import { createContext, useContext, useEffect } from "react";

const ThemeContext = createContext({
  theme: "light",
});

export function ThemeProvider({ children }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Forçar modo claro em todos os dispositivos independente de preferência do SO
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "light" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
