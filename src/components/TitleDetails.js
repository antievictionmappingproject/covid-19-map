import { dispatch } from "utils/dispatch";

/**
 * TitleDetails: // the collapsable <details> element in the <header>
 */
export class TitleDetails {
  titleBox = document.getElementById("aemp-titlebox");

  titleDetails = document
    .getElementById("aemp-titlebox")
    .querySelector("details");

  toggleButton = document.getElementById("aemp-titlebox-toggle");

  constructor() {
    this.bindListeners();
  }

  bindListeners = () => {
    const self = this;

    this.titleDetails.addEventListener("toggle", function () {
      if (this.open) {
        document.getElementById("aemp-titlebox").classList.remove("collapsed");
      } else {
        document.getElementById("aemp-titlebox").classList.add("collapsed");
      }
    });

    this.toggleButton.addEventListener("click", function () {
      const { className } = document.getElementById("aemp-titlebox");
      self.toggleTitleBox(className);
    });

    dispatch.on("title-details-toggle", this.toggleTitleDetails);
    dispatch.on("title-details-open", this.openTitleDetails);
    dispatch.on("title-details-close", this.closeTitleDetails);
  };

  toggleTitleBox = (className) => {
    if (className === "aemp-titlebox-open") {
      this.titleBox.className = "aemp-titlebox-closed";
    } else {
      this.titleBox.className = "aemp-titlebox-open";
    }
  };

  closeTitleDetails = () => {
    this.titleDetails.open = false;
  };

  openTitleDetails = () => {
    this.titleDetails.open = true;
  };

  toggleTitleDetails = () => {
    if (this.titleDetails.open) {
      this.titleDetails.open = false;
    } else {
      this.titleDetails.open = true;
    }
  };
}
