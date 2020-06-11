import i18next from "i18next";

const I18N_ATTRIBUTE = "data-i18n";

const getElementsWithI18n = () => {
  const elements = Array.from(document.querySelectorAll(`[${I18N_ATTRIBUTE}]`));
  return elements.map((el) => {
    return [el, el.getAttribute(I18N_ATTRIBUTE)];
  });
};

export const translateContent = () => {
  console.log("start translation");
  // Get all elements that have "data-i18n" attribute
  const translationElements = getElementsWithI18n();

  translationElements.forEach((el) => {
    console.log(i18next.getResource("en"));
    el[0].innerHTML = i18next.t(el[1]);
  });
};
