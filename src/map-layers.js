import {
  colorNoData,
  fillColorScale,
  strokeColorScale,
  strokeWeight,
  pointRadius,
  fillOpacity,
  policyStrengthLanguage,
} from "utils/constants";

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
    data: null,
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
    name: "Counties",
    type: "polygon",
    data: null,
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
        radius: pointRadius,
        weight: strokeWeight,
      };
    },
  },

  states: {
    name: "States",
    type: "polygon",
    data: null,
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
        radius: pointRadius,
        weight: strokeWeight,
      };
    },
  },

  nations: {
    name: "Nations",
    type: "polygon",
    data: null,
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
        radius: pointRadius,
        weight: strokeWeight,
      };
    },
  },

  rentStrikes: {
    name: "Rent Strikes",
    type: "marker-cluster",
    data: null,
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
