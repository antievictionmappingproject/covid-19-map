console.clear();

/******************************************
 * GLOBAL CONSTANTS & FLAGS
 *****************************************/
// note: this matches the breakpoint in styles.css
const MOBILE_BREAKPOINT = 640;
let IS_MOBILE = document.querySelector("body").offsetWidth < MOBILE_BREAKPOINT;

const DESKTOP_BREAKPOINT = 1200;
let IS_DESKTOP = document.querySelector("body").offsetWidth > DESKTOP_BREAKPOINT;

/******************************************
 * DATA SOURCES
 *****************************************/
// unique id of the sheet that imports desired columns from the form responses sheet
const moratoriumSheetId = "1AkYjbnLbWW83LTm6jcsRjg78hRVxWsSKQv1eSssDHSM";
const renStikeSheetId = "1rCZfNXO3gbl5H3cKhGXKIv3samJ1KC4nLhCwwZqrHvU";

// the URI that grabs the sheet text formatted as a CSV
const moratoriumSheetURI = `https://docs.google.com/spreadsheets/d/${moratoriumSheetId}/export?format=csv&id=${moratoriumSheetId}`;
const rentStrikeSheetURI = `https://docs.google.com/spreadsheets/d/${renStikeSheetId}/export?format=csv&id=${renStikeSheetId}`;

// states geojson url
const statesGeoJsonURI = "./states.geojson";

/******************************************
 * MAP SETUP & MAP CONTROLS
 *****************************************/

// options for configuring the Leaflet map
// don't add the default zoom ui and attribution as they're customized first then added layer
const mapOptions = { zoomControl: false, attributionControl: false };

// global map layer styling variables
const strokeWeight = 1.5;
const pointRadius = 8;
const fillOpacity = 0.7;

// setting the initial zoom settings
if (IS_MOBILE){
  initialMapZoom = 3;
}
else if (IS_DESKTOP){
  initialMapZoom = 5;
}

// initial values, if not given by the url
let mapConfig = {
  lat: 40.67,
  lng: -97.23,
  z: 4,
  states: true,
  cities: true,
  counties: true,
  rentStrikes: true
};

// read url hash input
let hash = location.hash;
let input = inputValues(hash);

// breaks up the url into an array; should be in the form
// #lat= & lng= & z= & state= & cities= & counties=
function inputValues(hash) {
  let input = hash.slice(1).split("&");
// splitting the hash by &, then creating an array
  let inputVals = {};
  for (i = 0; i < input.length; i++){
    let [key, value] = input[i].split("=");
    inputVals[key] = value;
  }

  // overriding the default values, if relevant
  if(!isNaN(inputVals.z)){
    mapConfig.z = parseInt(inputVals.z);
  }

  if(!isNaN(inputVals.lat)){
    mapConfig.lat = parseFloat(inputVals.lat);
  }

  if(!isNaN(inputVals.lng)){
    mapConfig.lng = parseFloat(inputVals.lng);
  }

  if(inputVals.cities !== undefined){
    if(inputVals.cities === "true"){
      mapConfig.cities = true;
    } else if(inputVals.cities === "false"){
      mapConfig.cities = false;
    }
  }

  if(inputVals.counties !== undefined){
    if(inputVals.counties === "true"){
      mapConfig.counties = true;
    } else if(inputVals.counties === "false"){
      mapConfig.counties = false;
    }
  }

  if(inputVals.states !== undefined){
    if(inputVals.states === "true"){
      mapConfig.states = true;
    } else if(inputVals.states === "false"){
      mapConfig.states = false;
    }
  }

  if(inputVals.rentstrike !== undefined){
    if(inputVals.rentstrike === "true"){
      mapConfig.rentStrikes = true;
    } else if(inputVals.rentstrike === "false"){
      mapConfig.rentStrikes = false;
    }
  }
}

// create a new map instance by referencing the appropriate html element by its "id" attribute
const map = L.map("map", mapOptions).setView([mapConfig.lat,mapConfig.lng], mapConfig.z);

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
function closeInfo() {
  map.closePopup();
  map.invalidateSize();
}

map.on("popupopen", function(e) {
  document.getElementById("root").classList.add("aemp-popupopen");

  if (IS_MOBILE) {
    titleDetails.open && toggleTitleDetails();
    map.invalidateSize();
  }

  map.setView(e.popup._latlng, map.getZoom(), { animate: true });
});

map.on("popupclose", function(e) {
  document.getElementById("root").classList.remove("aemp-popupopen");
  document.getElementById("aemp-infowindow-container").innerHTML = "";
  if (IS_MOBILE)
    setTimeout(function() {
      map.invalidateSize();
    }, 100);
});

map.on("click", function() {
  if (IS_MOBILE) {
    titleDetails.open = false;
  }
});

let resizeWindow;
window.addEventListener("resize", function() {
  clearTimeout(resizeWindow);
  resizeWindow = setTimeout(handleWindowResize, 250);
});

function handleWindowResize() {
  checkIsMobile();
  map.invalidateSize();
}

const attribution = L.control
  .attribution({ prefix: "Data sources by: " })
  .addAttribution(
    "<a href='https://www.antievictionmap.com/' target='_blank'>Anti-Eviction Mapping Project</a>"
  )
  .addAttribution(
    "<a href='https://www.openstreetmap.org' target='_blank'>Open Street Map Contributors</a>"
  )
  .addTo(map);

const zoomControl = L.control.zoom({ position: "bottomright" }).addTo(map);

// Map layers control: add the layers later after their data has been fetched
const layersControl = L.control
  .layers(null, null, { position: "topright", collapsed: false })
  .addTo(map);

// Get the popup template from the HTML.
// We can do this here because the template will never change.
const popupTemplate = document.querySelector(".popup-template").innerHTML;
const infowindowTemplate = document.getElementById("aemp-infowindow-template")
  .innerHTML;

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
    maxZoom: 18
  }
).addTo(map);

/******************************************
 * FETCH DATA SOURCES
 *****************************************/

Promise.all([
  fetch(moratoriumSheetURI).then(res => {
    if (!res.ok) throw Error("Unable to fetch moratoriums sheet data");
    return res.text();
  }),
  fetch(rentStrikeSheetURI).then(res => {
    if (!res.ok) throw Error("Unable to fetch rent strike sheet data");
    return res.text();
  }),
  fetch(statesGeoJsonURI).then(res => {
    if (!res.ok) throw Error("Unable to fetch states geojson");
    return res.json();
  })
])
  .then(handleData)
  .catch(error => console.log(error));

/******************************************
 * HANDLE DATA ASYNC RESPONSES
 *****************************************/

function handleData([
  moratoriumSheetsText,
  rentStrikeSheetsText,
  statesGeoJson
]) {
  const moratoriumRows = d3
    .csvParse(moratoriumSheetsText, d3.autoType)
    .map(({ passed, ...rest }) => ({
      passed: passed === "TRUE" ? "Yes" : "No",
      ...rest
    }));

  const rentStrikeRows = d3
    .csvParse(rentStrikeSheetsText, d3.autoType)
    .filter(row => row.Strike_Status !== null)
    .map(({ Strike_Status, ...rest }) => ({
      status:
        Strike_Status === "Yes / Sí / 是 / Oui" || Strike_Status === "Yes"
          ? "Yes"
          : "Unsure",
      ...rest
    }));

  const statesData = moratoriumRows
    .filter(row => row.admin_scale === "State")
    .reduce((acc, { state, ...rest }) => {
      return acc.set(state, rest);
    }, new Map());

  const localitiesData = moratoriumRows.filter(
    row => row.admin_scale !== "State" && row.lat !== null && row.lon !== null
  );

  // convert the regular moratorium JSON into valid GeoJSON
  const localitiesGeoJson = {
    type: "FeatureCollection",
    features: localitiesData.map(({ cartodb_id, lat, lon, ...rest }) => ({
      type: "Feature",
      id: cartodb_id,
      properties: rest,
      geometry: {
        type: "Point",
        coordinates: [lon, lat]
      }
    }))
  };

  // join states moratorium data to states geojson
  statesGeoJson.features.forEach(feature => {
    const { properties } = feature;
    if (statesData.has(properties.name)) {
      feature.properties = {
        ...statesData.get(properties.name),
        ...properties
      };
    }
  });

  rentStrikeData = rentStrikeRows.filter(
    row => row.Latitude !== null && row.Longitude !== null
  );

  const rentStrikeGeoJson = {
    type: "FeatureCollection",
    features: rentStrikeData.map(({ Longitude, Latitude, ...rest }, index) => ({
      type: "Feature",
      id: index,
      properties: rest,
      geometry: {
        type: "Point",
        coordinates: [Longitude, Latitude]
      }
    }))
  };

  // add both the states layer and localities layer to the map
  // and save the layer output
  const states = handleStatesLayer(statesGeoJson);
  const localities = handleLocalitiesLayer(localitiesGeoJson);
  const rentStrikes = handleRentStrikeLayer(rentStrikeGeoJson);

  // add layers to layers control
  layersControl
    .addOverlay(localities, "Cities/Counties")
    .addOverlay(states, "States")
    .addOverlay(rentStrikes, "Rent Strikes");

  if (!mapConfig.states){
    map.removeLayer(states);
  }

  // include once there are counties
  //  if (!mapConfig.counties){
  //    map.removeLayer(localities);}//change this to cities once counties are split out

  if (!mapConfig.cities){
    map.removeLayer(localities);//change this to cities once counties are split out
  }

  if (!mapConfig.rentStrikes){
    map.removeLayer(rentStrikes);
  }
}

/******************************************
 * HANDLE ADDING MAP LAYERS
 *****************************************/

function handleLocalitiesLayer(geojson) {
  // styling for the localities layer: style localities conditionally according to a presence of a moratorium
  const pointToLayer = (feature, latlng) => {
    // style localities based on whether their moratorium has passed
    if (feature.properties.passed === "Yes") {
      return L.circleMarker(latlng, {
        color: "#4dac26",
        fillColor: "#b8e186",
        fillOpacity: fillOpacity,
        radius: pointRadius,
        weight: strokeWeight
      });
    } else {
      return L.circleMarker(latlng, {
        color: "#d01c8b",
        fillColor: "#f1b6da",
        fillOpacity: fillOpacity,
        radius: pointRadius,
        weight: strokeWeight
      });
    }
  };

  // Create the Leaflet layer for the localities data
  const localitiesLayer = L.geoJson(geojson, {
    pointToLayer: pointToLayer
  });

  // Add popups to the layer
  localitiesLayer.bindPopup(function(layer) {
    // This function is called whenever a feature on the layer is clicked

    // Render the template with all of the properties. Mustache ignores properties
    // that aren't used in the template, so this is fine.
    const renderedInfo = Mustache.render(
      infowindowTemplate,
      layer.feature.properties
    );
    document.getElementById(
      "aemp-infowindow-container"
    ).innerHTML = renderedInfo;
    return Mustache.render(popupTemplate, layer.feature.properties);
  });

  // Add data to the map
  localitiesLayer.addTo(map);


  return localitiesLayer;
}

function handleStatesLayer(geojson) {
  // styling for the states layer: style states conditionally according to a presence of a moratorium
  const layerOptions = {
    style: feature => {
      // style states based on whether their moratorium has passed
      if (feature.properties.passed === "Yes") {
        return {
          color: "#4dac26",
          fillColor: "#b8e186",
          fillOpacity: fillOpacity,
          weight: strokeWeight
        };
      } else if (feature.properties.passed === "No") {
        return {
          color: "#d01c8b",
          fillColor: "#f1b6da",
          fillOpacity: fillOpacity,
          weight: strokeWeight
        };
      } else {
        return {
          stroke: false,
          fill: false
        };
      }
    }
  };

  // Create the Leaflet layer for the states data
  const statesLayer = L.geoJson(geojson, layerOptions);

  statesLayer.bindPopup(function(layer) {
    const renderedInfo = Mustache.render(
      infowindowTemplate,
      layer.feature.properties
    );
    document.getElementById(
      "aemp-infowindow-container"
    ).innerHTML = renderedInfo;
    return Mustache.render(popupTemplate, layer.feature.properties);
  });

  statesLayer.addTo(map);

  return statesLayer;
}

function handleRentStrikeLayer(geoJson) {
  const iconSize = [60, 60];
  const iconAnchor = [27, 20];
  const rentStrikeYesIcon = new L.Icon({
    iconUrl: "./assets/mapIcons/rent-strike-blue.png",
    iconSize: iconSize,
    iconAnchor: iconAnchor
  });

  const rentStrikeUnsureIcon = new L.Icon({
    iconUrl: "./assets/mapIcons/rent-strike-orange.png",
    iconSize: [60, 60],
    iconAnchor: iconAnchor
  });

  // add custom marker icons
  const rentStrikeLayer = L.geoJson(geoJson, {
    pointToLayer: function(feature, latlng) {
      const { status } = feature.properties;
      return L.marker(latlng, {
        icon: status === "Yes" ? rentStrikeYesIcon : rentStrikeUnsureIcon
      });
    }
  });
  //add markers to cluster with options
  const rentStrikeLayerMarkers = L.markerClusterGroup({
    maxClusterRadius: 40
  }).on("clusterclick", function() {
    if (IS_MOBILE) {
      titleDetails.open = false;
    }
  });

  rentStrikeLayerMarkers.addLayer(rentStrikeLayer).bindPopup(function(layer) {
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