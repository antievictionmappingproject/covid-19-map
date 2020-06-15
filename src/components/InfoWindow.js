import Mustache from "mustache";
import i18next from "i18next";
import { dispatch } from "utils/dispatch";
import { I18N_ATTRIBUTE } from "utils/i18n";

export class InfoWindow {
  infowindowContainer = document.getElementById("aemp-infowindow-container");

  infowindowTemplate = document.getElementById("aemp-infowindow-template")
    .innerHTML;

  rentStrikeInfowindowTemplate = document.getElementById(
    "aemp-rentstrike-infowindow-template"
  ).innerHTML;

  constructor() {
    this.bindListeners();
  }

  bindListeners() {
    dispatch.on("render-infowindow", this.render);
    dispatch.on("close-infowindow.self", this.closeInfoWindow);
  }

  closeInfoWindow = () => {
    document.getElementById("root").classList.remove("aemp-popupopen");
    this.infowindowContainer.innerHTML = null;
  };

  translateInfoWindowContent = () => {
    const i18nEls = this.infowindowContainer.querySelectorAll(
      `[${I18N_ATTRIBUTE}]`
    );
    i18nEls.forEach((el) => {
      const key = el.dataset.i18n;
      const t = i18next.t(key);
      if (t !== key) el.innerHTML = t;
    });
  };

  render = (props) => {
    const { template, data } = props;
    switch (template) {
      case "protections":
        this.infowindowContainer.innerHTML = Mustache.render(
          this.infowindowTemplate,
          data
        );
        break;
      case "rentstrikes":
        this.infowindowContainer.innerHTML = Mustache.render(
          this.rentStrikeInfowindowTemplate,
          data
        );
        break;
      default:
        break;
    }
    this.infowindowContainer
      .querySelector(".aemp-infowindow-close")
      .addEventListener("click", () => dispatch.call("close-infowindow"));
    document.getElementById("root").classList.add("aemp-popupopen");

    // Translate the page after showing the info window
    this.translateInfoWindowContent();
  };
}
