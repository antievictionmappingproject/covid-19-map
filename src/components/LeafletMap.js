const defaultConfig = {
  lat: 40.67,
  lng: -97.23,
  z: 4,
  nations: false,
  states: true,
  cities: true,
  counties: true,
  rentStrikes: true,
};

export class LeafletMap {
  dataLayers = new Map();

  constructor(config) {
    this.config = config || defaultConfig;
    this.init();
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

  handleLayersAdded() {
    this.layersControl;
    // .addOverlay(rentStrikes, "Rent Strikes")
    // .addOverlay(cities, "Cities")
    // .addOverlay(counties, "Counties")
    // .addOverlay(states, "States")
    // .addOverlay(nations, "Nations");

    // Apply correct relative order of layers when adding from control.
    this.map.on("overlayadd", function () {
      this.fixZOrder(this.dataLayers);
    });

    // if any layers in the map config are set to false,
    // remove them from the map
    if (!this.mapConfig.nations) {
      this.map.removeLayer(this.dataLayers.get("nations"));
    }

    if (!this.mapConfig.states) {
      this.map.removeLayer(this.dataLayers.get("states"));
    }

    if (!this.mapConfig.counties) {
      this.map.removeLayer(this.dataLayers.get("counties"));
    }

    if (!this.mapConfig.cities) {
      this.map.removeLayer(this.dataLayers.get("cities"));
    }

    if (!this.mapConfig.rentStrikes) {
      this.map.removeLayer(this.dataLayers.get("rentStrikes"));
    }
  }

  // helper methods
  fixZOrder() {
    this.dataLayers.forEach(function (layerGroup) {
      if (this.map.hasLayer(layerGroup)) {
        layerGroup.bringToBack();
      }
    });
  }
}
