import { dispatch } from "utils/dispatch";
import {
  defaultMapConfig,
  isMobile,
  TOTAL_NUMBER_OF_MAP_LAYERS,
} from "utils/constants";

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
    this.toggleLoadingIndicator(true); //show loading indicator
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
      });
    }

    function handlePolygonLayer() {
      return L.geoJson(data, {
        style(feature) {
          return layerConfig.style(feature);
        },
      });
    }

    function handleMarkerCluster() {
      // rent strikes data is regular JSON & requires additional parsing for conversion to GeoJSON
      const geojson = {
        type: "FeatureCollection",
        features: data
          .filter(
            ({ Strike_Status, Latitude, Longitude }) =>
              Strike_Status !== null && Longitude !== null && Latitude !== null
          )
          .map(({ Strike_Status, ...rest }) => ({
            status:
              Strike_Status === "Yes / Sí / 是 / Oui" || Strike_Status === "Yes"
                ? "Yes"
                : "Unsure",

            ...rest,
          }))
          .map(({ Longitude, Latitude, ...rest }, index) => ({
            type: "Feature",
            id: index,
            properties: rest,
            geometry: {
              type: "Point",
              coordinates: [Longitude, Latitude],
            },
          })),
      };

      const markerLayer = L.geoJson(geojson, {
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

    this.dataLayers.set(layerConfig.name, {
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
}
