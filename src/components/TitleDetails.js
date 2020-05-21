import { dispatch } from "utils/dispatch";

/**
 * TitleDetails: // the collapsable <details> element in the <header>
 */
export class TitleDetails {
  titleDetails = document
    .getElementById("aemp-titlebox")
    .querySelector("details");

  constructor() {
    this.bindListeners();
  }

  bindListeners = () => {
    this.titleDetails.addEventListener("toggle", function () {
      if (this.open) {
        document.getElementById("aemp-titlebox").classList.remove("collapsed");
      } else {
        document.getElementById("aemp-titlebox").classList.add("collapsed");
      }
    });

    dispatch.on("title-details-toggle", this.toggleTitleDetails);
    dispatch.on("title-details-open", this.openTitleDetails);
    dispatch.on("title-details-close", this.closeTitleDetails);
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
