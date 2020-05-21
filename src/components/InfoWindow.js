import { dispatch } from "utils/dispatch";

export class InfoWindow {
  infowindowContainer = document.getElementById("aemp-infowindow-container");

  infowindowTemplate = document.getElementById("aemp-infowindow-template")
    .innerHTML;

  nationInfowindowTemplate = document.getElementById("aemp-infowindow-template")
    .innerHTML;

  rentStrikePopupTemplate = document.querySelector(".rentstrike-popup-template")
    .innerHTML;

  rentStrikeInfowindowTemplate = document.getElementById(
    "aemp-rentstrike-infowindow-template"
  ).innerHTML;

  constructor() {
    this.bindListeners();
  }

  closeInfoWindow = () => {
    document.getElementById("root").classList.remove("aemp-popupopen");
    this.infowindowContainer.innerHTML = null;
  };

  bindListeners() {
    dispatch.on("render-infowindow", this.render);
    dispatch.on("close-infowindow", this.closeInfoWindow);
  }

  render = (props) => {
    const { template, data } = props;
    switch (template) {
      case "protections":
        this.infowindowContainer.innerHTML = Mustache.render(
          this.infowindowTemplate,
          data
        );
        break;
      case "rentstrike":
        this.infowindowContainer.innerHTML = Mustache.render(
          this.rentStrikeInfowindowTemplate,
          data
        );
        break;
      default:
        break;
    }
    document.getElementById("root").classList.add("aemp-popupopen");
  };
}
