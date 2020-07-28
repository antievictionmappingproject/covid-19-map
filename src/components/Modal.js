import { dispatch } from "utils/dispatch";

export class LoadingIndicator {
  modalContainer = document.getElementById("modal-container");

  constructor() {
    this.bindListeners();
  }

  bindListeners() {
    dispatch.on("show-modal", this.show);
    dispatch.on("hide-modal", this.hide);
  }

  show = () => {
    this.modalContainer.hidden = false;
  };

  hide = () => {
    this.modalContainer.hidden = true;
  };
}
