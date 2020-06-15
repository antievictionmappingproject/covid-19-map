import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const I18N_ATTRIBUTE = "data-i18n";

// Fallbacks to the existing content, but if a translation is found override content with translation
export const translateContent = () => {
  const elements = document.querySelectorAll(`[${I18N_ATTRIBUTE}]`);
  elements.forEach((el) => {
    const i18nKey = el.getAttribute(I18N_ATTRIBUTE);
    const translation = i18next.t(i18nKey);
    // i18next returns the key if no translation found, so only override content if key found.
    if (translation !== i18nKey) el.innerHTML = translation;
  });
};

// List of all languages we have translations for.
const whitelist = ["en", "pt-BR"];

// Default values for i18next config
const i18nOptions = {
  whitelist,
  fallbackLng: "en",
  debug: process.env.NODE_ENV !== "production",
  detection: {
    order: ["querystring", "navigator"],
    lookupQuerystring: "lang",
    checkForSimilarInWhitelist: true,
  },
};

// Initialize i18n next
export const i18nInit = () => {
  // this code splits the locales JSON imports so that they're not included with the index bundle
  import(/* webpackChunkName: "locales" */ "../locale").then(
    ({ default: translations }) => {
      i18nOptions.resources = translations;
      i18next
        .use(LanguageDetector)
        .init(i18nOptions)
        .then(() => {
          // First pass of translation
          translateContent();
        });
    }
  );
};
