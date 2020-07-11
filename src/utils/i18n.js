import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import { languages } from "./constants";

export const I18N_ATTRIBUTE = "data-i18n";

export const translateContent = (element) => {
  const selectedDomTree = element || document;
  const elements = selectedDomTree.querySelectorAll(`[${I18N_ATTRIBUTE}]`);
  elements.forEach((el) => {
    const key = el.dataset.i18n;
    const t = i18next.t(key);
    // If translation found set element content as translation.
    if (t !== key) el.innerHTML = t;
    // Otherwise use english as fallback
    else el.innerHTML = i18next.t(key, { lng: "en" });
  });
};

// Default values for i18next config
const i18nOptions = {
  whitelist: languages,
  fallbackLng: "en",
  debug: process.env.NODE_ENV !== "production",
  detection: {
    order: ["querystring", "navigator"],
    lookupQuerystring: "lang",
    checkForSimilarInWhitelist: true,
  },
};

// Initialize i18n next
export const i18nInit = async () => {
  // this code splits the locales JSON imports so that they're not included with the index bundle
  await import(/* webpackChunkName: "locales" */ "../locale").then(
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
