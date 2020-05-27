import {
  colorNoData,
  fillColorScale,
  strokeColorScale,
  strokeWeight,
  pointRadius,
  fillOpacity,
  policyStrengthLanguage,
} from "utils/constants";
import { renStrikeSheetId } from "./utils/config";
import * as queries from "./utils/queries";

const rentStrikeIcon = new L.Icon({
  iconUrl: "./assets/mapIcons/rent-strike.svg",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  className: "icon-rent-strike",
});

export const mapLayersConfig = {
  cities: {
    name: "Cities",
    type: "point",
    query: queries.citiesCartoQuery,
    zIndex: 1,
    props(layer) {
      const { municipality, state, country } = layer.feature.properties;
      return {
        ...layer.feature.properties,
        // Build city name with state and country if supplied
        jurisdictionName: `${municipality}${state ? `, ${state}` : ""}${
          country ? `, ${country}` : ""
        }`,
        jurisdictionType: "City",
        popupName: municipality,
        policyStrength: policyStrengthLanguage[layer.feature.properties.range],
      };
    },
    style(feature) {
      return {
        color: strokeColorScale[feature.properties.range] || colorNoData,
        fillColor: fillColorScale[feature.properties.range] || colorNoData,
        fillOpacity: fillOpacity,
        radius: pointRadius,
        weight: strokeWeight,
      };
    },
    pointToLayer(feature, latlng) {
      return L.circleMarker(latlng, mapLayersConfig.cities.style(feature));
    },
  },
};

window.mapLayersConfig = mapLayersConfig;
