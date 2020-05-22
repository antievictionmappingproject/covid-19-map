import "styles/index.scss";
import { LeafletMap } from "./components/LeafletMap";
import { InfoWindow } from "./components/InfoWindow";
import { TitleDetails } from "./components/TitleDetails";
import { getAllData } from "utils/data";

import { mapLayersConfig } from "./map-layers";

const leafletMap = new LeafletMap();
// eslint-disable-next-line
const infoWindow = new InfoWindow();
// eslint-disable-next-line
const titleDetails = new TitleDetails();

// used by infowindow-template
window.closeInfo = closeInfo;
function closeInfo() {
  leafletMap.closePopup();
  leafletMap.invalidateSize();
}

// handle adding the map layers once all async responses have resolved
function handleData(data) {
  const [rentStrikes, cities, counties, states, nations] = data;

  // since the rent-strike data is returned as text,
  // first convert it to JSON, then to GeoJSON before passing to Leaflet
  const rentStrikeRows = d3
    .csvParse(rentStrikes, d3.autoType)
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
    }));

  const rentStrikeGeoJson = {
    type: "FeatureCollection",
    features: rentStrikeRows.map(({ Longitude, Latitude, ...rest }, index) => ({
      type: "Feature",
      id: index,
      properties: rest,
      geometry: {
        type: "Point",
        coordinates: [Longitude, Latitude],
      },
    })),
  };

  const dataHash = {
    rentStrikes: rentStrikeGeoJson,
    cities,
    counties,
    states,
    nations,
  };

  for (let [key, config] of Object.entries(mapLayersConfig)) {
    config.data = dataHash[key];
    leafletMap.handleAddLayer(config, key);
  }
}

getAllData().then(handleData);
