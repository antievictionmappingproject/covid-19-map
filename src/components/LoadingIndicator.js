import { dispatch } from "utils/dispatch";

export class LoadingIndicator {
  loadingContainer = document.getElementById("loading-container");

  constructor() {
    this.bindListeners();
  }

  bindListeners() {
    dispatch.on("show-loading-indicator", this.show);
    dispatch.on("hide-loading-indicator", this.hide);
  }

  show = () => {
    // the default for the corresponding DOM element is false
    this.loadingContainer.hidden = false;
  };

  hide = () => {
    this.loadingContainer.hidden = true;
  };
}
