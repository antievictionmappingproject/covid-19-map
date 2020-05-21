import "styles/index.scss";
import { LeafletMap } from "./components/LeafletMap";
import { InfoWindow } from "./components/InfoWindow";
import { TitleDetails } from "./components/TitleDetails";
import { getAllData } from "utils/data";

const leafletMap = new LeafletMap();
const infoWindow = new InfoWindow();
const titleDetails = new TitleDetails();

// used by infowindow-template
window.closeInfo = closeInfo;
function closeInfo() {
  leafletMap.closePopup();
  leafletMap.invalidateSize();
}

getAllData().then(function (data) {
  const [, citiesGeoJson, ...rest] = data;
  leafletMap.handleCitiesLayer(citiesGeoJson);
});
