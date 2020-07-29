import Mustache from "mustache";
import i18next from "i18next";
import L from "lib/leaflet";

import { dispatch } from "utils/dispatch";
import {
  defaultMapConfig,
  isMobile,
  TOTAL_NUMBER_OF_MAP_LAYERS,
} from "utils/constants";
import { getAutocompleteMapLocation } from "utils/data";
import { getCartoData } from "../utils/data";
import * as queries from "../utils/queries";
import {
  usStateAbbrevToName,
  indiaStateAbbrevToName,
} from "../utils/constants";
import { mapLayersConfig } from "../map-layers";

export class LeafletMap {
  // dataLayers: look up table to store layer groups in the form of
  // { layerGroup: <Leaflet layer group>, zIndex: <integer> }
  dataLayers = new Map();

  // Mustache templates for popup HTML
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
      "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
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

    // Apply correct relative order of layers when adding from control.
    this.map.on("overlayadd", () => {
      this.fixZOrder();
    });

    let resizeWindow;
    window.addEventListener("resize", function () {
      clearTimeout(resizeWindow);
      resizeWindow = setTimeout(self.handleWindowResize, 250);
    });

    dispatch.on("close-infowindow.map", this.handleInfoWindowClose);
    dispatch.on("fetch-map-data-resolve.map", this.handleAddLayer);
    dispatch.on("fetch-map-data-reject.map", this.handleLayerError);
    dispatch.on(
      "choose-autocomplete-element.map",
      this.findAutocompleteLocation
    );
  }

  handleWindowResize = () => {
    if (isMobile()) {
      this.map.invalidateSize();
    }
  };

  handleInfoWindowClose = () => {
    this.map.closePopup();
    if (isMobile()) {
      this.map.invalidateSize();
    }
  };

  handleAddLayerError = (error) => {
    console.error(error);
    this.toggleLoadingIndicator(false); //hide loading indicator
  };

  handleAddLayer = ({ key, layerConfig, data }) => {
    const self = this;
    let layerGroup;

    switch (layerConfig.type) {
      case "point":
        layerGroup = handlePointLayer();
        break;

      case "polygon":
        layerGroup = handlePolygonLayer();
        break;

      case "marker-cluster":
        layerGroup = handleMarkerCluster();
        break;

      default:
        throw Error("Unrecognized map layer type");
    }

    function handlePointLayer() {
      return L.geoJson(data, {
        pointToLayer: layerConfig.pointToLayer,
        onEachFeature: layerConfig.onEachFeature,
      });
    }

    function handlePolygonLayer() {
      return L.geoJson(data, {
        style(feature) {
          return layerConfig.style(feature);
        },
        onEachFeature: layerConfig.onEachFeature,
      });
    }

    function handleMarkerCluster() {
      const markerLayer = L.geoJson(data, {
        pointToLayer: layerConfig.pointToLayer,
      });

      const markerClusterGroup = L.markerClusterGroup({
        maxClusterRadius: 40,
      }).on("clusterclick", function () {
        if (isMobile()) {
          dispatch.call("title-details-close");
        }
      });

      markerClusterGroup.addLayer(markerLayer).bindPopup(function (layer) {
        dispatch.call("render-infowindow", null, {
          template: "rentstrikes",
          data: layer.feature.properties,
        });

        return Mustache.render(
          self.rentStrikePopupTemplate,
          layerConfig.props(layer)
        );
      });

      return markerClusterGroup;
    }

    if (layerConfig.type !== "marker-cluster") {
      layerGroup.bindPopup(function (layer) {
        const props = layerConfig.props(layer);
        dispatch.call("render-infowindow", null, {
          template: "protections",
          data: props,
        });
        return Mustache.render(self.popupTemplate, props);
      });
    }

    // Create layer group with localised name
    const localizedName = i18next.t(layerConfig.nameI18n) || layerConfig.name;
    this.dataLayers.set(localizedName, {
      layerGroup,
      zIndex: layerConfig.zIndex,
    });

    if (this.config[key]) {
      layerGroup.addTo(this.map);
    }

    this.fixZOrder();
    this.handleAllLayersAdded();
  };

  handleAllLayersAdded = () => {
    // if all layers have been added to this.dataLayers add the layers toggle UI
    if (this.dataLayers.size !== TOTAL_NUMBER_OF_MAP_LAYERS) {
      return;
    }

    this.dataLayers.forEach(({ layerGroup }, name) => {
      this.layersControl.addOverlay(layerGroup, name);
    });

    //hide the loading indicator
    this.toggleLoadingIndicator(false);
  };

  fixZOrder = () => {
    const layers = Array.from(this.dataLayers.values()).sort(
      (a, b) => b.zIndex - a.zIndex
    );
    layers.forEach(({ layerGroup }) => {
      if (this.map.hasLayer(layerGroup)) {
        layerGroup.bringToFront();
      }
    });
  };

  toggleLoadingIndicator = (isLoading) => {
    if (isLoading) {
      dispatch.call("show-loading-indicator");
    } else {
      dispatch.call("hide-loading-indicator");
    }
  };

  findAutocompleteLocation = async (value) => {
    try {
      let location = await getAutocompleteMapLocation(value.trim());
      let resource = location.resourceSets[0].resources[0];
      let center = resource.point.coordinates;
      const markerIcon = L.icon({ iconUrl: L.Icon.Default });
      this.map.setView(center, 5);
      const marker = new L.marker(center, { icon: markerIcon });
      marker.addTo(this.map);
      let markerContent = `
          <div class="popup-container locality-popup-container">
              <p class="popup-title"><strong>${resource.name}</strong></p>
          </div>
      `;
      marker.bindPopup(markerContent).openPopup();
      this.showSearchResultProtections(resource);
    } catch (e) {
      dispatch.call("search-bar-no-data", this, e);
    }
  };

  showSearchResultProtections = async (resource) => {
    let protections = await this.getSearchResultProtections(resource);
    console.log("protections:");
    protections.forEach((key, val) => {
      console.log(`${key}:${val}`);
    });
    dispatch.call("render-infowindow", null, {
      template: "searchResult",
      data: protections,
    });
  };

  getSearchResultProtections = async (resource) => {
    //this is necessary because Bing sometimes returns full state names and other times as two-letter abbreviations
    if (resource.address.countryRegion === "United States") {
      let stateName = resource.address.adminDistrict;
      if (
        stateName.length === 2 &&
        usStateAbbrevToName[stateName.toLowerCase()]
      ) {
        Object.assign(resource.address, {
          adminDistrict: usStateAbbrevToName[stateName.toLowerCase()],
        });
      }
    }
    //India too
    if (resource.address.countryRegion === "India") {
      let stateName = resource.address.adminDistrict;
      if (
        stateName.length === 2 &&
        indiaStateAbbrevToName[stateName.toLowerCase()]
      ) {
        Object.assign(resource.address, {
          adminDistrict: indiaStateAbbrevToName[stateName.toLowerCase()],
        });
      }
    }
    return [
      "locality",
      "adminDistrict2",
      "adminDistrict",
      "countryRegion",
    ].reduce(async (prevPromise, adminLevel) => {
      let mapObj = await prevPromise;
      if (!resource.address[adminLevel]) {
        return mapObj;
      }
      const protection = await this.queryForProtectionByLocation(
        adminLevel,
        resource.address[adminLevel]
      );
      let plainLanguageAdminLevel = {
        locality: "cities",
        adminDistrict2: "counties",
        adminDistrict: "states",
        countryRegion: "nations",
      }[adminLevel];
      if (protection && protection.features.length) {
        return mapObj.concat(
          mapLayersConfig[plainLanguageAdminLevel].props(
            Object.assign({}, { feature: protection.features[0] })
          )
        );
      }
      return mapObj;
    }, Promise.resolve([]));
  };
  queryForProtectionByLocation = async (adminLevel, locationName) => {
    try {
      return await getCartoData(
        queries.searchResultProtectionsQuery(adminLevel, locationName)
      );
    } catch (e) {
      console.log(
        `no protections data from ${adminLevel} named ${locationName}`
      );
      return null;
    }
  };
}
