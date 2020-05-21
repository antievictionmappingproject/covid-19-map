import { dispatch } from "utils/dispatch";
import {
  defaultMapConfig,
  colorNoData,
  fillColorScale,
  strokeColorScale,
  strokeWeight,
  pointRadius,
  fillOpacity,
  policyStrengthLanguage,
  isMobile,
} from "utils/constants";

export class LeafletMap {
  dataLayers = new Map([
    ["cities", null],
    ["counties", null],
    ["states", null],
    ["nations", null],
    ["rentstrikes", null],
  ]);

  popupTemplate = document.querySelector(".popup-template").innerHTML;

  constructor(config) {
    this.config = config || defaultMapConfig;
    this.init();
    this.bindListeners();
  }

  init() {
    const { lat, lng, z } = this.config;

    this.map = L.map("map", {
      zoomControl: false,
      attributionControl: false,
      maxBounds: [
        [-85.05, -190], // lower left
        [85.05, 200], // upper right
      ],
    });

    this.map.setView([lat, lng], z);

    this.attributionControl = L.control
      .attribution({ prefix: "Data sources by: " })
      .addAttribution(
        "<a href='https://www.antievictionmap.com/' target='_blank'>Anti-Eviction Mapping Project</a>"
      )
      .addAttribution(
        "<a href='https://www.openstreetmap.org' target='_blank'>Open Street Map Contributors</a>"
      )
      .addTo(this.map);

    this.zoomControl = L.control
      .zoom({ position: "bottomright" })
      .addTo(this.map);

    this.layersControl = L.control
      .layers(null, null, { position: "topright", collapsed: false })
      .addTo(this.map);

    this.basemapLayer = L.tileLayer(
      "https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png",
      {
        minZoom: 1,
        maxZoom: 18,
      }
    ).addTo(this.map);
  }

  bindListeners() {
    const self = this;
    this.map.on("popupopen", function (e) {
      document.getElementById("root").classList.add("aemp-popupopen");

      if (isMobile()) {
        dispatch.call("title-details-close");
        self.map.invalidateSize();
      }

      self.map.setView(e.popup._latlng, self.map.getZoom(), { animate: true });
    });

    this.map.on("popupclose", function () {
      document.getElementById("root").classList.remove("aemp-popupopen");
      dispatch.call("close-infowindow");
      if (isMobile())
        setTimeout(function () {
          self.map.invalidateSize();
        }, 100);
    });

    this.map.on("click", function () {
      if (isMobile()) {
        dispatch.call("title-details-close");
      }
    });

    let resizeWindow;
    window.addEventListener("resize", function () {
      clearTimeout(resizeWindow);
      resizeWindow = setTimeout(self.handleWindowResize, 250);
    });
  }

  handleWindowResize = () => {
    if (isMobile()) {
      this.map.invalidateSize();
    }
  };

  handleCitiesLayer(geojson) {
    const self = this;
    const pointToLayer = (feature, latlng) => {
      return L.circleMarker(latlng, this.getLayerStyle(feature));
    };

    const citiesLayer = L.geoJson(geojson, {
      pointToLayer: pointToLayer,
    });

    citiesLayer.bindPopup(function (layer) {
      // This function is called whenever a feature on the layer is clicked

      // Render the template with all of the properties. Mustache ignores properties
      // that aren't used in the template, so this is fine.
      const { municipality, state, country } = layer.feature.properties;
      const props = {
        ...layer.feature.properties,
        // Build city name with state and country if supplied
        jurisdictionName: `${municipality}${state ? `, ${state}` : ""}${
          country ? `, ${country}` : ""
        }`,
        jurisdictionType: "City",
        popupName: municipality,
        policyStrength: policyStrengthLanguage[layer.feature.properties.range],
      };

      dispatch.call("render-infowindow", null, {
        template: "protections",
        data: props,
      });

      return Mustache.render(self.popupTemplate, props);
    });

    this.dataLayers.set("cities", citiesLayer);

    if (this.config.cities) {
      citiesLayer.addTo(this.map);
    }
  }

  handleCountiesLayer() {}

  handleStatesLayer() {}

  handleNationsLayer() {}

  handleRentStrikeLayer() {}

  handleAllLayersAdded() {
    this.dataLayers.forEach(function (layerGroup, name) {
      this.layersControl.addOverlay(layerGroup, name);
    });

    // Apply correct relative order of layers when adding from control.
    this.map.on("overlayadd", function () {
      this.fixZOrder(this.dataLayers);
    });
  }

  getLayerStyle(feature) {
    return {
      color: strokeColorScale[feature.properties.range] || colorNoData,
      fillColor: fillColorScale[feature.properties.range] || colorNoData,
      fillOpacity: fillOpacity,
      radius: pointRadius,
      weight: strokeWeight,
    };
  }

  // helper methods
  fixZOrder() {
    this.dataLayers.forEach(function (layerGroup) {
      if (this.map.hasLayer(layerGroup)) {
        layerGroup.bringToBack();
      }
    });
  }

  invalidateSize() {
    this.map.invalidateSize();
  }

  closePopup() {
    this.map.closePopup();
  }
}
