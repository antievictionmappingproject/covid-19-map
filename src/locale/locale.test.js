const en = require("./en.json");
const ptBR = require("./pt-BR.json");

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
  it("has the same keys in every file", () => {
    const enKeys = keyify(en);
    const translations = { ptBR };
    // Get the list of keys for each localisation file
    const translationKeys = Object.values(translations).map((translation) => {
      return keyify(translation);
    });

    // For all translations
    translationKeys.forEach((translation, index) => {
      // Check against the english file
      expect(
        enKeys.sort(),
        `Comparing en with ${Object.keys(translations)[index]}`
      ).toEqual(translation.sort());
    });
  });
});
