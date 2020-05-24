import { dispatch } from "utils/dispatch";
import {
  // defaultMapConfig,
  TOTAL_NUMBER_OF_MAP_LAYERS,
} from "utils/constants";

export class Loading {
  //laodng screen container
  loadingScreen = document.getElementById("loading-container");

  // loaded layers counter
  layersLoaded = 0;

  // optionally pass in the mapconfig to keep
  // track of which layers are set to true
  constructor(/*config*/) {
    // this.config = config || defaultMapConfig;
    this.bindListeners();
  }

  bindListeners() {
    //layer can be passed in here to keep track of
    //which layers have loaded
    dispatch.on("fetch-map-data-resolve", (/*layer*/) => {
      this.registerLayer(/*layer*/);
    });
  }

  //this can be built out more with
  //regards to which layers have loaded
  registerLayer(/*layer*/) {
    this.layersLoaded += 1;
    if (this.layersLoaded === TOTAL_NUMBER_OF_MAP_LAYERS) {
      this.hide();
    }
  }

  hide() {
    this.loadingScreen.setAttribute("hidden", true);
    dispatch.call("loading-screen-hide");
  }
}
