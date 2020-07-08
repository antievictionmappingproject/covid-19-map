import L, { rentStrikeIcon } from "lib/leaflet";
import {
  colorNoData,
  fillColorScale,
  strokeColorScale,
  strokeWeight,
  pointRadius,
  fillOpacity,
  policyStrengthLayerClassNames,
} from "utils/constants";
import * as queries from "./utils/queries";
import { formatDate } from "./utils/datetime";

export const mapLayersConfig = {
  cities: {
    name: "City Protections",
    nameI18n: "layer-select.cities",
    type: "point",
    query: queries.citiesCartoQuery,
    zIndex: 1,
    props(layer) {
      const {
        municipality,
        state,
        country,
        end_date_legist,
        end_date_rent_relief,
        end_date_court,
        end_date_earliest,
        ...rest
      } = layer.feature.properties;
      return {
        // Build city name with state and country if supplied
        jurisdictionName: `${municipality}${state ? `, ${state}` : ""}${
          country ? `, ${country}` : ""
        }`,
        jurisdictionType: "City",
        jurisdictionTypeI18n: "city",
        popupName: municipality,
        endDateLegist: formatDate(end_date_legist),
        endDateRentRelief: formatDate(end_date_rent_relief),
        endDateCourt: formatDate(end_date_court),
        endDateEarliest: formatDate(end_date_earliest),
        ...rest,
      };
    },
    style(feature) {
      return {
        color: strokeColorScale[feature.properties.range] || colorNoData,
        fillColor: fillColorScale[feature.properties.range] || colorNoData,
        fillOpacity: 0.85,
        radius: pointRadius,
        weight: strokeWeight,
      };
    },
    pointToLayer(feature, latlng) {
      return L.circleMarker(latlng, mapLayersConfig.cities.style(feature));
    },
    onEachFeature(feature, layer) {
      // class name is used for applying pattern fills to polygons
      if (feature.properties.has_expired_protections) {
        layer.options.className =
          policyStrengthLayerClassNames[feature.properties.range] +
          "--city-level";
      }
    },
  },

  counties: {
    name: "County Protections",
    nameI18n: "layer-select.counties",
    type: "polygon",
    query: queries.countiesCartoQuery,
    zIndex: 2,
    props(layer) {
      const {
        state,
        county,
        end_date_legist,
        end_date_rent_relief,
        end_date_court,
        end_date_earliest,
        ...rest
      } = layer.feature.properties;
      return {
        // Show county with state if state field is set
        jurisdictionName: `${county}${state ? `, ${state}` : ""}`,
        jurisdictionType: "County",
        jurisdictionTypeI18n: "county",
        popupName: `${county}${state ? `, ${state}` : ""}`,
        endDateLegist: formatDate(end_date_legist),
        endDateRentRelief: formatDate(end_date_rent_relief),
        endDateCourt: formatDate(end_date_court),
        endDateEarliest: formatDate(end_date_earliest),
        ...rest,
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
    onEachFeature(feature, layer) {
      // class name is used for applying pattern fills to polygons
      if (feature.properties.has_expired_protections) {
        layer.options.className =
          policyStrengthLayerClassNames[feature.properties.range];
      }
    },
  },

  states: {
    name: "State/Province Protections",
    nameI18n: "layer-select.states",
    type: "polygon",
    query: queries.statesCartoQuery,
    zIndex: 3,
    props(layer) {
      const {
        name,
        admin,
        end_date_legist,
        end_date_rent_relief,
        end_date_court,
        end_date_earliest,
        ...rest
      } = layer.feature.properties;
      return {
        jurisdictionName: `${name}${admin ? `, ${admin}` : ""}`,
        jurisdictionType: "State/Province",
        jurisdictionTypeI18n: "state-province",
        popupName: name,
        endDateLegist: formatDate(end_date_legist),
        endDateRentRelief: formatDate(end_date_rent_relief),
        endDateCourt: formatDate(end_date_court),
        endDateEarliest: formatDate(end_date_earliest),
        ...rest,
      };
    },
    style(feature) {
      return {
        fillColor: fillColorScale[feature.properties.range] || colorNoData,
        color: strokeColorScale[feature.properties.range] || colorNoData,
        fillOpacity: fillOpacity,
        weight: strokeWeight,
      };
    },
    onEachFeature(feature, layer) {
      // class name is used for applying pattern fills to polygons
      if (feature.properties.has_expired_protections) {
        layer.options.className =
          policyStrengthLayerClassNames[feature.properties.range];
      }
    },
  },

  nations: {
    name: "National Protections",
    nameI18n: "layer-select.nations",
    type: "polygon",
    query: queries.countriesCartoQuery,
    zIndex: 4,
    props(layer) {
      const { name_en, end_date_earliest, ...rest } = layer.feature.properties;
      return {
        endDateEarliest: formatDate(end_date_earliest),
        jurisdictionName: name_en,
        jurisdictionType: "Country",
        jurisdictionTypeI18n: "nation",
        popupName: name_en,
        ...rest,
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
    onEachFeature(feature, layer) {
      // class name is used for applying pattern fills to polygons
      if (feature.properties.has_expired_protections) {
        layer.options.className =
          policyStrengthLayerClassNames[feature.properties.range];
      }
    },
  },

  rentStrikes: {
    name: "Housing Justice Actions",
    nameI18n: "layer-select.housingJusticeAction",
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
