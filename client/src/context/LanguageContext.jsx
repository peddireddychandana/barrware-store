import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import i18n, {
  LANGUAGES,
  getStoredLanguage,
  storeLanguage,
} from "@/lib/i18n";

const LanguageContext = createContext(undefined);

/** Persists the chosen language and keeps the document lang attribute in sync. */
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(getStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = useCallback((code) => {
    const next = LANGUAGES.some((lang) => lang.code === code) ? code : "en";
    i18n.changeLanguage(next);
    storeLanguage(next);
    setLanguage(next);
  }, []);

  const value = useMemo(
    () => ({
      language,
      languages: LANGUAGES,
      changeLanguage,
    }),
    [language, changeLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
