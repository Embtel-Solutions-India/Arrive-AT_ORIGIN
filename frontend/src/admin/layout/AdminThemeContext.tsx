import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

export type AdminTheme = "dark" | "light";

export interface AdminThemeContextType {
  theme: AdminTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: AdminTheme) => void;
}

const STORAGE_KEY = "sb_admin_theme";

const AdminThemeContext = createContext<AdminThemeContextType | null>(null);

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    } catch {
      // Ignore localStorage errors
    }
    // Default to the signature cosmic dark theme
    return "dark";
  });

  const setTheme = useCallback((newTheme: AdminTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // Synchronize document attribute for global CSS and inputs
  useEffect(() => {
    const root = document.querySelector(".admin-root");
    if (root) {
      root.setAttribute("data-theme", theme);
      if (theme === "light") {
        root.classList.add("admin-theme-light");
        root.classList.remove("admin-theme-dark");
      } else {
        root.classList.add("admin-theme-dark");
        root.classList.remove("admin-theme-light");
      }
    }
  }, [theme]);

  const value = useMemo<AdminThemeContextType>(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme, setTheme]
  );

  return (
    <AdminThemeContext.Provider value={value}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme(): AdminThemeContextType {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error("useAdminTheme must be used within an AdminThemeProvider");
  }
  return context;
}
