"use strict";

class Translator {
  constructor(options = {}) {
    this._options = Object.assign({}, this.defaultConfig, options);
    this._lang = this.getLanguage();
    this._elements = document.querySelectorAll("[i18n]");
  }

  getLanguage() {
    if (!this._options.detectLanguage) {
      return this._options.defaultLanguage;
    }

    var stored = localStorage.getItem("language");

    if (this._options.persist && stored) {
      return stored;
    }

    var lang = navigator.languages
      ? navigator.languages[0]
      : navigator.language;

    return lang.substr(0, 2);
  }

  async load(lang = null) {
    if (lang) {
      if (!this._options.languages.includes(lang)) {
        return;
      }

      this._lang = lang;
    }

    const translation = await Translator.getTranslation(
      this._options.filesLocation,
      this._lang
    );

    this.translate(translation);
    this.toggleLangTag();

    if (this._options.persist) {
      localStorage.setItem("language", this._lang);
    }
  }

  toggleLangTag() {
    if (document.documentElement.lang !== this._lang) {
      document.documentElement.lang = this._lang;
    }
  }

  translate(translation) {
    function replace(element) {
      const translationId = element.getAttribute("i18n");
      const text = translationId
        .split(".")
        .reduce((obj, i) => obj[i], translation);

      if (text) {
        element.innerHTML = text;
      }
    }

    this._elements.forEach(replace);
  }

  get defaultConfig() {
    return {
      persist: false,
      languages: ["en"],
      defaultLanguage: "en",
      filesLocation: "/i18n",
    };
  }

  static async getTranslation(filesLocation, lang) {
    var path = `${filesLocation}/${lang}.json`;

    const res = await fetch(path);
    if (res.ok) {
      const body = await res.json();
      return body;
    }
    throw Error("Error fetching data");
  }
}

export default Translator;
