import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Language, type Theme, type Translations } from "./translations";

export interface AppPreferencesContextType {
  language: Language;
  theme: Theme;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  t: Translations;
}

const AppPreferencesContext = createContext<AppPreferencesContextType | undefined>(undefined);

const STORAGE_LANG_KEY = "ziwachain_lang";
const STORAGE_THEME_KEY = "ziwachain_theme";

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlLang = params.get("lang");
        if (urlLang === "en" || urlLang === "sw") {
          localStorage.setItem(STORAGE_LANG_KEY, urlLang);
          return urlLang;
        }
        const stored = localStorage.getItem(STORAGE_LANG_KEY);
        if (stored === "en" || stored === "sw") return stored;
        if (navigator.language && navigator.language.startsWith("sw")) return "sw";
      } catch (e) {}
    }
    return "en";
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlTheme = params.get("theme");
        if (urlTheme === "light" || urlTheme === "dark") {
          localStorage.setItem(STORAGE_THEME_KEY, urlTheme);
          return urlTheme;
        }
        const stored = localStorage.getItem(STORAGE_THEME_KEY);
        if (stored === "light" || stored === "dark") return stored;
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
          return "dark";
        }
      } catch (e) {}
    }
    return "light";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_LANG_KEY, lang);
        document.documentElement.setAttribute("lang", lang);
      } catch (e) {}
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_THEME_KEY, newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        if (newTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch (e) {}
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Sync with document on mount and when preferences change
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", language);
      document.documentElement.setAttribute("data-theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [language, theme]);

  const value: AppPreferencesContextType = {
    language,
    theme,
    setLanguage,
    setTheme,
    toggleTheme,
    t: translations[language],
  };

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences(): AppPreferencesContextType {
  const context = useContext(AppPreferencesContext);
  if (!context) {
    throw new Error("useAppPreferences must be used within an AppPreferencesProvider");
  }
  return context;
}
