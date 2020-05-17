// this tells webpack to use our CSS
import "styles/index.scss";
import { getAllData } from "utils/data";
import { paseUriHash } from "utils/parse-hash";
import {
  colorNoData,
  fillColorScale,
  strokeColorScale,
  strokeWeight,
  pointRadius,
  fillOpacity,
  policyStrengthLanguage,
  MOBILE_BREAKPOINT,
  DESKTOP_BREAKPOINT,
} from "utils/constants";

/******************************************
 * GLOBAL CONSTANTS & FLAGS
 *****************************************/
// note: this matches the breakpoint in styles.css
let IS_MOBILE = document.querySelector("body").offsetWidth < MOBILE_BREAKPOINT;
let IS_DESKTOP =
  document.querySelector("body").offsetWidth > DESKTOP_BREAKPOINT;

/******************************************
 * MAP SETUP & MAP CONTROLS
 *****************************************/

// options for configuring the Leaflet map
// don't add the default zoom ui and attribution as they're customized first then added layer
const mapOptions = {
  zoomControl: false,
  attributionControl: false,
  maxBounds: [
    [-85.05, -190], // lower left
    [85.05, 200], // upper right
  ],
};

// setting the initial zoom settings
let initialMapZoom = 4;
if (IS_MOBILE) {
  initialMapZoom = 3;
} else if (IS_DESKTOP) {
  initialMapZoom = 5;
}

// initial values, if not given by the url
let mapConfig = {
  lat: 40.67,
  lng: -97.23,
  z: initialMapZoom,
  nations: false,
  states: true,
  cities: true,
  counties: true,
  rentStrikes: true,
};

// read url hash input & maybe override mapConfig props
paseUriHash(mapConfig);

// create a new map instance by referencing the appropriate html element by its "id" attribute
const map = L.map("map", mapOptions).setView(
  [mapConfig.lat, mapConfig.lng],
  mapConfig.z
);

// the collapsable <details> element below the map title
const titleDetails = document
  .getElementById("aemp-titlebox")
  .querySelector("details");

titleDetails.addEventListener("toggle", () => {
  if (titleDetails.open) {
    document.getElementById("aemp-titlebox").classList.remove("collapsed");
  } else {
    document.getElementById("aemp-titlebox").classList.add("collapsed");
  }
});

function checkIsMobile() {
  IS_MOBILE = document.querySelector("body").offsetWidth < MOBILE_BREAKPOINT;
}

function toggleTitleDetails() {
  if (titleDetails.open) {
    titleDetails.removeAttribute("open");
  } else {
    titleDetails.setAttribute("open", true);
  }
}

// used by infowindow-template
window.closeInfo = closeInfo;
function closeInfo() {
  map.closePopup();
  map.invalidateSize();
}

map.on("popupopen", function (e) {
  document.getElementById("root").classList.add("aemp-popupopen");

  if (IS_MOBILE) {
    titleDetails.open && toggleTitleDetails();
    map.invalidateSize();
  }

  map.setView(e.popup._latlng, map.getZoom(), { animate: true });
});

map.on("popupclose", function () {
  document.getElementById("root").classList.remove("aemp-popupopen");
  document.getElementById("aemp-infowindow-container").innerHTML = "";
  if (IS_MOBILE)
    setTimeout(function () {
      map.invalidateSize();
    }, 100);
});

map.on("click", function () {
  if (IS_MOBILE) {
    titleDetails.open = false;
  }
});

let resizeWindow;
window.addEventListener("resize", function () {
  clearTimeout(resizeWindow);
  resizeWindow = setTimeout(handleWindowResize, 250);
});

function handleWindowResize() {
  checkIsMobile();
  map.invalidateSize();
}

L.control
  .attribution({ prefix: "Data sources by: " })
  .addAttribution(
    "<a href='https://www.antievictionmap.com/' target='_blank'>Anti-Eviction Mapping Project</a>"
  )
  .addAttribution(
    "<a href='https://www.openstreetmap.org' target='_blank'>Open Street Map Contributors</a>"
  )
  .addTo(map);

L.control.zoom({ position: "bottomright" }).addTo(map);

// Map layers control: add the layers later after their data has been fetched
const layersControl = L.control
  .layers(null, null, { position: "topright", collapsed: false })
  .addTo(map);

// Get the popup & infowindow templates from the HTML.
// We can do this here because the template will never change.
const popupTemplate = document.querySelector(".popup-template").innerHTML;
const infowindowTemplate = document.getElementById("aemp-infowindow-template")
  .innerHTML;
const nationInfowindowTemplate = document.getElementById(
  "aemp-infowindow-template"
).innerHTML;

const rentStrikePopupTemplate = document.querySelector(
  ".rentstrike-popup-template"
).innerHTML;
const rentStrikeInfowindowTemplate = document.getElementById(
  "aemp-rentstrike-infowindow-template"
).innerHTML;
// Add base layer
L.tileLayer(
  "https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png",
  {
    minZoom: 1,
    maxZoom: 18,
  }
).addTo(map);

/******************************************
 * HANDLE DATA ASYNC RESPONSES
 *****************************************/

function handleData([
  rentStrikeSheetsText,
  citiesGeoJson,
  countiesGeoJson,
  statesGeoJson,
  nationsGeoJson,
]) {
  const rentStrikeRows = d3
    .csvParse(rentStrikeSheetsText, d3.autoType)
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

  // add the states, cities, counties, and rentstrikes layers to the map
  // and save the layers output
  const nations = handleNationsLayer(nationsGeoJson);
  const states = handleStatesLayer(statesGeoJson);
  const counties = handleCountiesLayer(countiesGeoJson);
  const cities = handleCitiesLayer(citiesGeoJson);
  const rentStrikes = handleRentStrikeLayer(rentStrikeGeoJson);

  // add layers to map layers control UI
  layersControl
    .addOverlay(rentStrikes, "Rent Strikes")
    .addOverlay(cities, "Cities")
    .addOverlay(counties, "Counties")
    .addOverlay(states, "States")
    .addOverlay(nations, "Nations");

  // Apply correct relative order of layers when adding from control.
  map.on("overlayadd", function () {
    // Top of list is top layer
    fixZOrder([cities, counties, states, nations]);
  });

  // if any layers in the map config are set to false,
  // remove them from the map
  if (!mapConfig.nations) {
    map.removeLayer(nations);
  }

  if (!mapConfig.states) {
    map.removeLayer(states);
  }

  if (!mapConfig.counties) {
    map.removeLayer(counties);
  }

  if (!mapConfig.cities) {
    map.removeLayer(cities);
  }

  if (!mapConfig.rentStrikes) {
    map.removeLayer(rentStrikes);
  }
}

/******************************************
 * HANDLE ADDING MAP LAYERS
 *****************************************/

// Ensures that map overlay pane layers are displayed in the correct Z-Order
function fixZOrder(dataLayers) {
  dataLayers.forEach(function (layerGroup) {
    if (map.hasLayer(layerGroup)) {
      layerGroup.bringToBack();
    }
  });
}

function handleCitiesLayer(geojson) {
  // styling for the cities layer: style cities conditionally according to moratorium rating scale 1 to 3
  const pointToLayer = (feature, latlng) => {
    return L.circleMarker(latlng, {
      color: strokeColorScale[feature.properties.range] || colorNoData,
      fillColor: fillColorScale[feature.properties.range] || colorNoData,
      fillOpacity: fillOpacity,
      radius: pointRadius,
      weight: strokeWeight,
    });
  };

  // Create the Leaflet layer for the cities data
  const citiesLayer = L.geoJson(geojson, {
    pointToLayer: pointToLayer,
  });

  // Add popups to the layer
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

    const renderedInfo = Mustache.render(infowindowTemplate, props);
    document.getElementById(
      "aemp-infowindow-container"
    ).innerHTML = renderedInfo;
    // Override jurisdiction name for popup
    return Mustache.render(popupTemplate, props);
  });

  // Add data to the map
  citiesLayer.addTo(map);

  return citiesLayer;
}

function handleCountiesLayer(geojson) {
  const layerOptions = {
    style: (feature) => {
      // style counties based on strength of protections
      return {
        color: strokeColorScale[feature.properties.range] || colorNoData,
        fillColor: fillColorScale[feature.properties.range] || colorNoData,
        fillOpacity: fillOpacity,
        weight: strokeWeight,
      };
    },
  };

  // Create the Leaflet layer for the counties data
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
    const renderedInfo = Mustache.render(infowindowTemplate, props);
    document.getElementById(
      "aemp-infowindow-container"
    ).innerHTML = renderedInfo;
    return Mustache.render(popupTemplate, props);
  });

  countiesLayer.addTo(map);
  return countiesLayer;
}

function handleStatesLayer(geojson) {
  // styling for the states layer: style states conditionally according to moratorium rating scale 1 to 3
  const layerOptions = {
    style: (feature) => {
      return {
        color: strokeColorScale[feature.properties.range] || colorNoData,
        fillColor: fillColorScale[feature.properties.range] || colorNoData,
        fillOpacity: fillOpacity,
        weight: strokeWeight,
      };
    },
  };

  // Create the Leaflet layer for the states data
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
    const renderedInfo = Mustache.render(infowindowTemplate, props);
    document.getElementById(
      "aemp-infowindow-container"
    ).innerHTML = renderedInfo;
    // Overwrite jurisdiction name to remove country
    return Mustache.render(popupTemplate, props);
  });

  statesLayer.addTo(map);

  return statesLayer;
}

function handleRentStrikeLayer(geoJson) {
  const rentStrikeIcon = new L.Icon({
    iconUrl: "./assets/mapIcons/rent-strike.svg",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    className: "icon-rent-strike",
  });

  // add custom marker icons
  const rentStrikeLayer = L.geoJson(geoJson, {
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
    if (IS_MOBILE) {
      titleDetails.open = false;
    }
  });

  rentStrikeLayerMarkers.addLayer(rentStrikeLayer).bindPopup(function (layer) {
    const renderedInfo = Mustache.render(
      rentStrikeInfowindowTemplate,
      layer.feature.properties
    );
    document.getElementById(
      "aemp-infowindow-container"
    ).innerHTML = renderedInfo;
    return Mustache.render(rentStrikePopupTemplate, layer.feature.properties);
  });

  map.addLayer(rentStrikeLayerMarkers);

  return rentStrikeLayerMarkers;
}

function handleNationsLayer(geojson) {
  const layerOptions = {
    style: (feature) => {
      return {
        color: strokeColorScale[feature.properties.range] || colorNoData,
        fillColor: fillColorScale[feature.properties.range] || colorNoData,
        fillOpacity: fillOpacity,
        weight: strokeWeight,
      };
    },
  };

  // Create the Leaflet layer for the nations data
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
    const renderedInfo = Mustache.render(nationInfowindowTemplate, props);
    document.getElementById(
      "aemp-infowindow-container"
    ).innerHTML = renderedInfo;
    return Mustache.render(popupTemplate, props);
  });

  map.addLayer(nationsLayer);

  return nationsLayer;
}

/******************************************
 * FETCH DATA SOURCES
 * Fetch all data sources then kick things off!
 *****************************************/

getAllData()
  .then(handleData)
  .catch((error) => console.log(error));
