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

// the total number of map layers
const NUMBER_OF_MAP_LAYERS = 5;

export class LeafletMap {
  dataLayers = new Map();
  popupTemplate = document.querySelector(".popup-template").innerHTML;
  rentStrikePopupTemplate = document.querySelector(".rentstrike-popup-template")
    .innerHTML;

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

    this.handleAllLayersAdded();
  }

  handleCountiesLayer(geojson) {
    const self = this;
    const layerOptions = {
      style(feature) {
        return self.getLayerStyle(feature);
      },
    };

    const countiesLayer = L.geoJson(geojson, layerOptions);
    countiesLayer.bindPopup(function (layer) {
      const { county, state } = layer.feature.properties;
      const props = {
        ...layer.feature.properties,
        // Show county with state if state field is set
        jurisdictionName: `${county}${state ? `, ${state}` : ""}`,
        jurisdictionType: "County",
        popupName: `${county}${state ? `, ${state}` : ""}`,
        policyStrength: policyStrengthLanguage[layer.feature.properties.range],
      };

      dispatch.call("render-infowindow", null, {
        template: "protections",
        data: props,
      });

      return Mustache.render(self.popupTemplate, props);
    });

    this.dataLayers.set("counties", countiesLayer);

    if (this.config.counties) {
      countiesLayer.addTo(this.map);
    }

    this.handleAllLayersAdded();
  }

  handleStatesLayer(geojson) {
    const self = this;
    const layerOptions = {
      style(feature) {
        return self.getLayerStyle(feature);
      },
    };

    const statesLayer = L.geoJson(geojson, layerOptions);
    statesLayer.bindPopup(function (layer) {
      const { name, admin } = layer.feature.properties;
      const props = {
        ...layer.feature.properties,
        jurisdictionName: `${name}${admin ? `, ${admin}` : ""}`,
        jurisdictionType: "State/Province",
        popupName: name,
        policyStrength: policyStrengthLanguage[layer.feature.properties.range],
      };

      dispatch.call("render-infowindow", null, {
        template: "protections",
        data: props,
      });

      // Overwrite jurisdiction name to remove country
      return Mustache.render(self.popupTemplate, props);
    });

    this.dataLayers.set("states", statesLayer);

    if (this.config.states) {
      statesLayer.addTo(this.map);
    }

    this.handleAllLayersAdded();
  }

  handleNationsLayer(geojson) {
    const self = this;
    const layerOptions = {
      style(feature) {
        return self.getLayerStyle(feature);
      },
    };
    const nationsLayer = L.geoJson(geojson, layerOptions);

    nationsLayer.bindPopup(function (layer) {
      const { name_en } = layer.feature.properties;
      const props = {
        ...layer.feature.properties,
        jurisdictionName: name_en,
        jurisdictionType: "Country",
        popupName: name_en,
        policyStrength: policyStrengthLanguage[layer.feature.properties.range],
      };

      dispatch.call("render-infowindow", null, {
        template: "protections",
        data: props,
      });

      return Mustache.render(self.popupTemplate, props);
    });

    this.dataLayers.set("nations", nationsLayer);

    if (this.config.nations) {
      this.map.addLayer(nationsLayer);
    }

    this.handleAllLayersAdded();
  }

  handleRentStrikeLayer(geojson) {
    const self = this;

    const rentStrikeIcon = new L.Icon({
      iconUrl: "./assets/mapIcons/rent-strike.svg",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      className: "icon-rent-strike",
    });

    // add custom marker icons
    const rentStrikeLayer = L.geoJson(geojson, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {
          icon: rentStrikeIcon,
        });
      },
    });

    //add markers to cluster with options
    const rentStrikeLayerMarkers = L.markerClusterGroup({
      maxClusterRadius: 40,
    }).on("clusterclick", function () {
      if (isMobile()) {
        dispatch.call("title-details-close");
      }
    });

    rentStrikeLayerMarkers
      .addLayer(rentStrikeLayer)
      .bindPopup(function (layer) {
        dispatch.call("render-infowindow", null, {
          template: "rentstrikes",
          data: layer.feature.properties,
        });

        return Mustache.render(
          self.rentStrikePopupTemplate,
          layer.feature.properties
        );
      });

    this.dataLayers.set("rentStrikes", rentStrikeLayerMarkers);

    if (this.config.rentStrikes) {
      this.map.addLayer(rentStrikeLayerMarkers);
    }

    this.handleAllLayersAdded();
  }

  handleAllLayersAdded() {
    if (this.dataLayers.size !== NUMBER_OF_MAP_LAYERS) {
      return;
    }

    const self = this;

    this.dataLayers.forEach(function (layerGroup, name) {
      self.layersControl.addOverlay(layerGroup, name);
    });

    // Apply correct relative order of layers when adding from control.
    this.map.on("overlayadd", function () {
      self.fixZOrder(this.dataLayers);
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
