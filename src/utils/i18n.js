import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import translations from "../locale";

const I18N_ATTRIBUTE = "data-i18n";

export const translateContent = () => {
  const elements = document.querySelectorAll(`[${I18N_ATTRIBUTE}]`);
  elements.forEach((el) => {
    el.innerHTML = i18next.t(el.getAttribute(I18N_ATTRIBUTE));
  });
};

// List of all languages we have translations for.
const whitelist = ["en", "pt-BR"];

// Default values for i18next config
const i18nOptions = {
  whitelist,
  fallbackLng: "en",
  debug: process.env.NODE_ENV !== "production",
  resources: translations,
  detection: {
    order: ["querystring", "navigator"],
    lookupQuerystring: "lang",
    checkForSimilarInWhitelist: true,
  },
};

// Initialize i18n next
export const i18nInit = () => {
  i18next
    .use(LanguageDetector)
    .init(i18nOptions)
    .then(() => {
      // First pass of translation
      translateContent();
    });
};
