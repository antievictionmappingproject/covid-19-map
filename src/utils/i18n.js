import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import translations from "../locale";

const I18N_ATTRIBUTE = "data-i18n";

export const translateContent = () => {
  // Get all elements that have "data-i18n" attribute
  const elements = document.querySelectorAll(`[${I18N_ATTRIBUTE}]`);
  // Return list of lists, where first item is the element and the second is the value of the attribute
  elements.forEach((el) => {
    el.innerHTML = i18next.t(el.getAttribute(I18N_ATTRIBUTE));
  });
};

// Default values for i18next config
const i18nOptions = {
  whitelist: ["en", "pt-BR"],
  fallbackLng: "en",
  debug: process.env.NODE_ENV !== "production",
  resources: translations,
  detection: {
    // order and from where user language should be detected
    order: ["querystring", "localStorage", "navigator"],

    lookupQuerystring: "lng",
    lookupLocalStorage: "i18nextLng",

    // cache user language on
    caches: ["localStorage"],
    // languages to not persist (cookie, localStorage)
    excludeCacheFor: ["cookie", "cimode"],
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
