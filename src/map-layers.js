import {
  colorNoData,
  fillColorScale,
  strokeColorScale,
  strokeWeight,
  pointRadius,
  fillOpacity,
  policyStrengthLanguage,
} from "utils/constants";
import * as queries from "./utils/queries";

const rentStrikeIcon = new L.Icon({
  iconUrl: "./assets/mapIcons/rent-strike.svg",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  className: "icon-rent-strike",
});

export const mapLayersConfig = {
  cities: {
    name: "City Protections",
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

  counties: {
    name: "County Protections",
    type: "polygon",
    query: queries.countiesCartoQuery,
    zIndex: 2,
    props(layer) {
      const { state, county } = layer.feature.properties;
      return {
        ...layer.feature.properties,
        // Show county with state if state field is set
        jurisdictionName: `${county}${state ? `, ${state}` : ""}`,
        jurisdictionType: "County",
        popupName: `${county}${state ? `, ${state}` : ""}`,
        policyStrength: policyStrengthLanguage[layer.feature.properties.range],
      };
    },
    style(feature) {
      return {
        color: strokeColorScale[feature.properties.range] || colorNoData,
        fillColor: fillColorScale[feature.properties.range] || colorNoData,
        fillOpacity: fillOpacity,
        weight: strokeWeight,
      };
    },
  },

  states: {
    name: "State/Province Protections",
    type: "polygon",
    query: queries.statesCartoQuery,
    zIndex: 3,
    props(layer) {
      const { name, admin } = layer.feature.properties;
      return {
        ...layer.feature.properties,
        ...layer.feature.properties,
        jurisdictionName: `${name}${admin ? `, ${admin}` : ""}`,
        jurisdictionType: "State/Province",
        popupName: name,
        policyStrength: policyStrengthLanguage[layer.feature.properties.range],
      };
    },
    style(feature) {
      return {
        color: strokeColorScale[feature.properties.range] || colorNoData,
        fillColor: fillColorScale[feature.properties.range] || colorNoData,
        fillOpacity: fillOpacity,
        weight: strokeWeight,
      };
    },
  },

  nations: {
    name: "National Protections",
    type: "polygon",
    query: queries.countriesCartoQuery,
    zIndex: 4,
    props(layer) {
      const { name_en } = layer.feature.properties;
      return {
        ...layer.feature.properties,
        jurisdictionName: name_en,
        jurisdictionType: "Country",
        popupName: name_en,
        policyStrength: policyStrengthLanguage[layer.feature.properties.range],
      };
    },
    style(feature) {
      return {
        color: strokeColorScale[feature.properties.range] || colorNoData,
        fillColor: fillColorScale[feature.properties.range] || colorNoData,
        fillOpacity: fillOpacity,
        weight: strokeWeight,
      };
    },
  },

  rentStrikes: {
    name: "Housing Justice Actions",
    type: "marker-cluster",
    query: queries.housingActionsCartoQuery,
    zIndex: 0, // markers have their very own layer pane in Leaflet so don't need a z-index value
    props(layer) {
      return layer.feature.properties;
    },
    pointToLayer(feature, latlng) {
      return L.marker(latlng, {
        icon: rentStrikeIcon,
      });
    },
  },
};

window.mapLayersConfig = mapLayersConfig;
