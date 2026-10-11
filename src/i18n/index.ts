import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { LANGUAGES } from "@/lib/constants";
import ar from "./locales/ar";
import de from "./locales/de";
import en from "./locales/en";
import es from "./locales/es";
import fr from "./locales/fr";
import it from "./locales/it";
import pt from "./locales/pt";
import ru from "./locales/ru";
import tr from "./locales/tr";
import zh from "./locales/zh";

export const STORAGE_LANG_KEY = "sahloul.desk.lang";

export const resources = {
  fr: { translation: fr },
  ar: { translation: ar },
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
  it: { translation: it },
  tr: { translation: tr },
  pt: { translation: pt },
  ru: { translation: ru },
  zh: { translation: zh },
};

export const SUPPORTED_LANGS = LANGUAGES.map((l) => l.code);

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "fr",
    supportedLngs: SUPPORTED_LANGS,
    nonExplicitSupportedLngs: true,
    load: "currentOnly",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: STORAGE_LANG_KEY,
    },
    react: { useSuspense: false },
  });

/** Applies `lang` + `dir` to <html> — called on every language change. */
export function syncDocumentLang(lng: string) {
  const code = (lng || "fr").split("-")[0];
  const dir = code === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = code;
  document.documentElement.dir = dir;
}

syncDocumentLang(i18n.language || "fr");
i18n.on("languageChanged", syncDocumentLang);

export default i18n;
