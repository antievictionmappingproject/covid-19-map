// this tells webpack to use our CSS
import "styles/index.scss";

/******************************************
 * GLOBAL CONSTANTS & FLAGS
 *****************************************/
// note: this matches the breakpoint in styles.css
const MOBILE_BREAKPOINT = 640;
let IS_MOBILE = document.querySelector("body").offsetWidth < MOBILE_BREAKPOINT;

const DESKTOP_BREAKPOINT = 1200;
let IS_DESKTOP =
  document.querySelector("body").offsetWidth > DESKTOP_BREAKPOINT;

/******************************************
 * DATA SOURCES
 *****************************************/
// unique id of the Google sheet that imports desired columns from the rent-strike form responses public sheet
const renStikeSheetId = "1rCZfNXO3gbl5H3cKhGXKIv3samJ1KC4nLhCwwZqrHvU";

// the URI that grabs the sheet text formatted as a CSV
const rentStrikeSheetURI = `https://docs.google.com/spreadsheets/d/${renStikeSheetId}/export?format=csv&id=${renStikeSheetId}`;

// table in CARTO that syncs with the Google sheet data
const cartoSheetSyncTable = "public.emergency_tenant_protections_scored";

// the URIs for CARTO counties &s tates layers
// joined to the moratoriums data
// (all in AEMP CARTO acct)
const cartoCountiesURI = createCountiesCartoURI();
const cartoStatesURI = createStatesCartoURI();
const cartoCitiesURI = createCitiesCartoURI();
const cartoNationsURI = createNationsCartoURI();

// colorScale comes from this ColorBrewer url:
// https://colorbrewer2.org/#type=sequential&scheme=YlGn&n=7
const colorNoData = "#939393";
const fillColorScale = [undefined, "#d9f0a3", "#78c679", "#238443"];
const strokeColorScale = [undefined, "#addd8e", "#41ab5d", "#005a32"];

const policyStrengthLanguage = [
  "",
  "Few protections in place",
  "Some protections in place",
  "Many protections in place",
];

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

// global map layer styling variables
const strokeWeight = 1.5;
const pointRadius = 8;
const fillOpacity = 0.7;

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
inputValues(location.hash);

// check the url hash for params then
// override map default settings if any are present
// assumes params are as follows:
// #lat=<float>&lng=<float>&z=<integer>&states=<boolean>&cities=<boolean>&counties=<boolean>&rentstrike=<boolean>
function inputValues(hash) {
  let input = hash.slice(1).split("&");
  let inputVals = {};
  let i = 0;
  for (i; i < input.length; i++) {
    let [key, value] = input[i].split("=");
    inputVals[key] = value;
  }

  // override the default map config values, if they exist
  if (!isNaN(inputVals.z)) {
    mapConfig.z = parseInt(inputVals.z);
  }

  if (!isNaN(inputVals.lat)) {
    mapConfig.lat = parseFloat(inputVals.lat);
  }

  if (!isNaN(inputVals.lng)) {
    mapConfig.lng = parseFloat(inputVals.lng);
  }

  if (inputVals.cities !== undefined) {
    if (inputVals.cities === "true") {
      mapConfig.cities = true;
    } else if (inputVals.cities === "false") {
      mapConfig.cities = false;
    }
  }

  if (inputVals.counties !== undefined) {
    if (inputVals.counties === "true") {
      mapConfig.counties = true;
    } else if (inputVals.counties === "false") {
      mapConfig.counties = false;
    }
  }

  if (inputVals.states !== undefined) {
    if (inputVals.states === "true") {
      mapConfig.states = true;
    } else if (inputVals.states === "false") {
      mapConfig.states = false;
    }
  }

  if (inputVals.nations !== undefined) {
    if (inputVals.nations === "true") {
      mapConfig.nations = true;
    } else if (inputVals.nations === "false") {
      mapConfig.nations = false;
    }
  }

  if (inputVals.rentstrike !== undefined) {
    if (inputVals.rentstrike === "true") {
      mapConfig.rentStrikes = true;
    } else if (inputVals.rentstrike === "false") {
      mapConfig.rentStrikes = false;
    }
  }
}

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
 * URI HELPERS
 *****************************************/

function createCitiesCartoURI() {
  const query = `SELECT
  municipality, state, country, range, policy_type, policy_summary, link, the_geom
  FROM ${cartoSheetSyncTable}
  WHERE the_geom is not null and admin_scale = 'City'
  ORDER BY range`;

  return `https://ampitup.carto.com/api/v2/sql?q=${query}&format=geojson`;
}

function createCountiesCartoURI() {
  const query = `SELECT
  c.the_geom, c.county, c.state, m.range, m.policy_type, m.policy_summary, m.link, m.range
  FROM us_county_boundaries c
  JOIN ${cartoSheetSyncTable} m
  ON ST_Intersects(c.the_geom, m.the_geom)
  WHERE m.the_geom IS NOT NULL
  AND m.admin_scale = 'County'
  OR m.admin_scale = 'City and County'
  ORDER BY m.range`;

  return `https://ampitup.carto.com/api/v2/sql?q=${query}&format=geojson`;
}

function createStatesCartoURI() {
  const query = `SELECT
  s.the_geom, s.name, s.admin, s.sr_adm0_a3, m.range, m.iso, m.policy_type, m.policy_summary, m.link
  FROM public.states_and_provinces_global s
  INNER JOIN ${cartoSheetSyncTable} m
  ON s.name = m.state
  AND s.sr_adm0_a3 = m.iso
  AND m.admin_scale = 'State'
  ORDER BY m.range`;

  return `https://ampitup.carto.com/api/v2/sql?q=${query}&format=geojson`;
}

function createNationsCartoURI() {
  const query = `SELECT c.the_geom, c.adm0_a3, c.name_en, m.range,
  m.policy_type, m.policy_summary, m.link
  FROM countries c
  INNER JOIN ${cartoSheetSyncTable} m
  ON c.adm0_a3 = m.iso
  AND m.admin_scale = 'Country'
  ORDER BY m.range`;

  return `https://ampitup.carto.com/api/v2/sql?q=${query}&format=geojson`;
}

/******************************************
 * FETCH DATA SOURCES
 *****************************************/

Promise.all([
  fetch(rentStrikeSheetURI)
    .then((res) => {
      if (!res.ok) throw Error("Unable to fetch rent strike sheet data");
      return res.text();
    })
    .then((j) => handleRentStrikeLayer(j)),
  fetch(cartoStatesURI)
    .then((res) => {
      if (!res.ok) throw Error("Unable to fetch states geojson");
      return res.json();
    })
    .then((j) => handleStatesLayer(j)),
  fetch(cartoCountiesURI)
    .then((res) => {
      if (!res.ok) throw Error("Unable to fetch counties geojson");
      return res.json();
    })
    .then((j) => handleCountiesLayer(j)),
  fetch(cartoNationsURI)
    .then((res) => {
      if (!res.ok) throw Error("Unable to fetch nations geojson");
      return res.json();
    })
    .then((j) => handleNationsLayer(j)),
  fetch(cartoCitiesURI)
    .then((res) => {
      if (!res.ok) throw Error("Unable to fetch cities geojson");
      return res.json();
    })
    .then((j) => handleCitiesLayer(j)),
])
  .then(handleData)
  .catch((error) => console.log(error));

/******************************************
 * HANDLE DATA ASYNC RESPONSES
 *****************************************/

function handleData([rentStrikes, states, counties, nations, cities]) {
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

function handleRentStrikeLayer(rentStrikeSheetsText) {
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
  const rentStrikeIcon = new L.Icon({
    iconUrl: "./assets/mapIcons/rent-strike.svg",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    className: "icon-rent-strike",
  });

  // add custom marker icons
  const rentStrikeLayer = L.geoJson(rentStrikeGeoJson, {
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
