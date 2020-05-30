import { dispatch } from "utils/dispatch";

export class InfoWindow {
  infowindowContainer = document.getElementById("aemp-infowindow-container");

  infowindowTemplate = document.getElementById("aemp-infowindow-template")
    .innerHTML;

  rentStrikeInfowindowTemplate = document.getElementById(
    "aemp-rentstrike-infowindow-template"
  ).innerHTML;

  constructor(translator) {
    this.bindListeners();
    this.translator = translator;
  }

  bindListeners() {
    dispatch.on("render-infowindow", this.render);
    dispatch.on("close-infowindow.self", this.closeInfoWindow);
  }

  closeInfoWindow = () => {
    document.getElementById("root").classList.remove("aemp-popupopen");
    this.infowindowContainer.innerHTML = null;
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

    // Query elements again
    this.translator._elements = document.querySelectorAll("[i18n]");
    // Run localisation again
    this.translator.load();
  };
}
