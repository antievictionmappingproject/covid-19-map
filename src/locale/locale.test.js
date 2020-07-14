const en = require("./en.json");
const ptBR = require("./pt-BR.json");
const es = require("./es.json");

const keyify = (obj, prefix = "") =>
  Object.keys(obj).reduce((res, el) => {
    if (Array.isArray(obj[el])) {
      return res;
    } else if (typeof obj[el] === "object" && obj[el] !== null) {
      return [...res, ...keyify(obj[el], prefix + el + ".")];
    } else {
      return [...res, prefix + el];
    }
  }, []);

describe("Validate translations", () => {
  const translations = { en, ptBR, es };
  it("has the same keys in every file", () => {
    // Get the list of keys for each localisation file
    const translationKeys = Object.values(translations).map((translation) => {
      return keyify(translation);
    });

    // For all translations
    translationKeys.forEach((translation, index) => {
      // If the translation isn't the last one
      if (index < translationKeys.length - 1) {
        // Loop through remaining translations
        translationKeys.slice(index).forEach((otherTranslation, otherIndex) => {
          // Check that the keys match from the first translation to all remaining
          expect(
            translation.sort(),
            `Comparing ${Object.keys(translations)[index]} with ${
              Object.keys(translations)[index + otherIndex]
            }`
          ).toEqual(otherTranslation.sort());
        });
      }
    });
  });
});
