import { dispatch } from "utils/dispatch";

export class LoadingIndicator {
  constructor() {
    this.bindListeners();
  }

  bindListeners() {
    dispatch.on("show-loading-indicator", this.show);
    dispatch.on("hide-loading-indicator", this.hide);
  }

  show() {
    // the default for the corresponding DOM element is false
    document.getElementById("loading-container").setAttribute("hidden", false);
  }

  hide() {
    document.getElementById("loading-container").setAttribute("hidden", true);
  }
}
