import Mustache from "mustache";
import { dispatch } from "utils/dispatch";
import { translateContent } from "utils/i18n";

export class InfoWindow {
  infowindowContainer = document.getElementById("aemp-infowindow-container");

  infowindowTemplate = document.getElementById("aemp-infowindow-template")
    .innerHTML;

  rentStrikeInfowindowTemplate = document.getElementById(
    "aemp-rentstrike-infowindow-template"
  ).innerHTML;

  searchResultInfowindowTemplate = document.getElementById(
    "search-result-infowindow-template"
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
      case "searchResult":
        this.infowindowContainer.innerHTML =
          `
        <div>
          <p class="infowindow-title">
            <strong data-i18n="infowindow.policy.title"></strong>
          </p>
        </div>
        <div class="aemp-infowindow">
          <a class="aemp-infowindow-close" href="#close">×</a>

          ` +
          data.map((dataItem) =>
            Mustache.render(this.searchResultInfowindowTemplate, dataItem)
          ) +
          "</div>";
        break;

      default:
        break;
    }

    // Translate the page after showing the info window
    translateContent(this.infowindowContainer);

    this.infowindowContainer
      .querySelector(".aemp-infowindow-close")
      .addEventListener("click", () => dispatch.call("close-infowindow"));
    document.getElementById("root").classList.add("aemp-popupopen");
  };
}
