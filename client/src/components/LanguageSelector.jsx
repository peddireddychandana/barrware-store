import { Globe, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";

/** Header language dropdown: English / Hindi / Telugu, persisted between visits. */
const LanguageSelector = ({ className = "" }) => {
  const { t } = useTranslation();
  const { language, languages, changeLanguage } = useLanguage();

  return (
    <div className={`relative group ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-label={t("common.language")}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-full border border-border bg-secondary/50 hover:border-primary transition-colors text-steel hover:text-primary"
      >
        <Globe className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide">
          {language}
        </span>
        <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
      </button>
      <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all z-50">
        <ul
          role="listbox"
          aria-label={t("common.language")}
          className="bg-card/95 backdrop-blur-lg border border-border rounded-lg p-1.5 min-w-36 card-shadow"
        >
          {languages.map((lang) => (
            <li key={lang.code} role="option" aria-selected={lang.code === language}>
              <button
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center justify-between gap-3 py-2 px-3 text-sm rounded-md transition-colors ${
                  lang.code === language
                    ? "text-primary bg-secondary"
                    : "text-muted-foreground hover:text-primary hover:bg-secondary/60"
                }`}
              >
                <span>{lang.nativeLabel}</span>
                {lang.code === language && <Check className="w-4 h-4" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LanguageSelector;
