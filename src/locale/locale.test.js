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
  const translations = { en, ptBR };
  it("has the same keys in every file", () => {
    const translationKeys = Object.values(translations).map((translation) => {
      return keyify(translation);
    });

    translationKeys.forEach((translation, index) => {
      if (index < translationKeys.length - 1) {
        expect(
          translation,
          `Comparing ${Object.keys(translations)[index]} with ${
            Object.keys(translations)[index + 1]
          }`
        ).toEqual(translationKeys[index + 1]);
      }
    });
  });
});
