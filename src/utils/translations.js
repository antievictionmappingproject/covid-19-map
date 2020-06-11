import i18next from "i18next";

const I18N_ATTRIBUTE = "data-i18n";

const getElementsWithI18n = () => {
  const elements = Array.from(document.querySelectorAll(`[${I18N_ATTRIBUTE}]`));
  // Return list of lists, where first item is the element and the second is the value of the attribute
  return elements.map((el) => {
    return [el, el.getAttribute(I18N_ATTRIBUTE)];
  });
};

export const translateContent = () => {
  // Get all elements that have "data-i18n" attribute
  const translationElements = getElementsWithI18n();

  translationElements.forEach((el) => {
    // Translate content inside each element
    el[0].innerHTML = i18next.t(el[1]);
  });
};
