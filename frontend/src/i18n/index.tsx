import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translateTag } from "./tags";
import { translateError } from "./errors";

export type Language = "en" | "zh";
export const LANGUAGE_STORAGE_KEY = "arcadeiq.ui.language";

function initialLanguage(): Language {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "en" || saved === "zh") return saved;
  } catch { /* Language switching still works when browser storage is unavailable. */ }
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

function messages(language: Language) {
  return {
    language,
    t: (english: string, chinese: string) => language === "zh" ? chinese : english,
    tag: (value: string) => translateTag(value, language),
    error: (value: string) => translateError(value, language),
    collectionName: (value: string) => language === "zh" && value === "Default Shortlist" ? "默认收藏夹" : value,
    money: (value: number) => value === 0 ? (language === "zh" ? "免费" : "Free")
      : `${language === "zh" ? "US$" : "$"}${value.toFixed(2)}`,
    number: (value: number) => Intl.NumberFormat(language === "zh" ? "zh-CN" : "en", { notation: "compact" }).format(value),
  };
}

const LanguageContext = createContext<(ReturnType<typeof messages> & { setLanguage: (language: Language) => void }) | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>(initialLanguage);
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title = language === "zh" ? "ArcadeIQ · 游戏探索" : "ArcadeIQ · Game discovery";
  }, [language]);
  const value = useMemo(() => ({
    ...messages(language),
    setLanguage(next: Language) {
      updateLanguage(next);
      try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next); }
      catch { /* Keep the selected language for this session without affecting saved games. */ }
    },
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useI18n must be used within LanguageProvider");
  return context;
}
