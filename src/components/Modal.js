import { dispatch } from "utils/dispatch";

export class Modal {
  modalContainer = document.getElementById("modal-container");
  closeButton = document.querySelector(".modal-close");

  constructor() {
    this.bindListeners();
  }

  bindListeners() {
    dispatch.on("show-modal", this.show);
    dispatch.on("hide-modal", this.hide);

    this.closeButton.addEventListener("click", () => {
      dispatch.call("hide-modal");
    });
  }

  show = () => {
    // the default for the corresponding DOM element is false
    this.modalContainer.hidden = false;
  };

  hide = () => {
    this.modalContainer.hidden = true;
  };
}
