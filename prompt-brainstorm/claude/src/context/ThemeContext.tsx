import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";
type GeekMode = "geek" | "enjoyer";

interface UIContextValue {
  theme: Theme;
  toggleTheme: () => void;
  geekMode: GeekMode;
  toggleGeekMode: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [geekMode, setGeekMode] = useState<GeekMode>("geek");

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  return (
    <UIContext.Provider
      value={{
        theme,
        toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
        geekMode,
        toggleGeekMode: () => setGeekMode((g) => (g === "geek" ? "enjoyer" : "geek")),
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
