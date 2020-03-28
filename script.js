console.clear();

/******************************************
 * GLOBAL CONSTANTS & FLAGS
 *****************************************/
// note: this matches the breakpoint in styles.css
const MOBILE_BREAKPOINT = 640;
let IS_MOBILE = document.querySelector("body").offsetWidth < MOBILE_BREAKPOINT;

/******************************************
 * DATA SOURCES
 *****************************************/
// unique id of the sheet that imports desired columns from the form responses sheet
const sheetId = "1AkYjbnLbWW83LTm6jcsRjg78hRVxWsSKQv1eSssDHSM";

// the URI that grabs the sheet text formatted as a CSV
const sheetURI = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&id=${sheetId}`;

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

// create a new map instance by referencing the appropriate html element by its "id" attribute
const map = L.map("map", mapOptions).setView([34.03, -82.2], 5);

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
  if (IS_MOBILE) setTimeout(function(){ map.invalidateSize() }, 100);
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
  fetch(sheetURI).then(res => {
    if (!res.ok) throw Error("Unable to fetch moratoriums sheet data");
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

function handleData([sheetsText, statesGeoJson]) {
  const rows = d3
    .csvParse(sheetsText, d3.autoType)
    .map(({ passed, ...rest }) => ({
      passed: passed === "TRUE" ? "Yes" : "No",
      ...rest
    }));

  const statesData = rows
    .filter(row => row.admin_scale === "State")
    .reduce((acc, { state, ...rest }) => {
      return acc.set(state, rest);
    }, new Map());

  const localitiesData = rows.filter(
    row => row.admin_scale !== "State" && row.lat !== null && row.lon !== null && row.admin_scale !=="County"
  );
  console.log(localitiesData);
  const countiesData = rows.filter(
    row => row.admin_scale !== "State" && row.lat !== null && row.lon !== null && row.admin_scale !=="City"
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

  // convert the regular moratorium JSON into valid GeoJSON
  const countiesGeoJson = {
    type: "FeatureCollection",
    features: countiesData.map(({ cartodb_id, lat, lon, ...rest }) => ({
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

  // add both the states layer and localities layer to the map
  // and save the layer output
  const states = handleStatesLayer(statesGeoJson);
  const counties = handleCountiesLayer(countiesGeoJson);
  const localities = handleLocalitiesLayer(localitiesGeoJson);

  // icons for the legend / layer control
  let cityIcon = "<svg width="+ 2.4* pointRadius +" height="+ 2.4* pointRadius +"><circle cx="+ 1.2*pointRadius +" cy="+ 1.2*pointRadius +" r=" + pointRadius + " stroke='#4dac26' stroke-width=" + strokeWeight + " fill='#b8e186' fill-opacity='" +fillOpacity + "'/></svg>"
  let countyIcon = "<svg width="+ 3.4* pointRadius +" height="+ 3.4* pointRadius +"><circle cx="+ 1.7*pointRadius +" cy="+ 1.7*pointRadius +" r=" + 1.5*pointRadius + " stroke='#4dac26' stroke-width=" + strokeWeight*2 + " fill='#b8e186' fill-opacity='"+fillOpacity/3+"'/></svg>"

  // add layers to layers control
  layersControl
    .addOverlay(localities, "Cities" + cityIcon)
    .addOverlay(counties, "Counties" + countyIcon)
    .addOverlay(states, "States");
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

  // Move the map view so that the localitiesLayer is visible
  map.fitBounds(localitiesLayer.getBounds(), {
    paddingTopLeft: [12, 120],
    paddingBottomRight: [12, 12]
  });

  return localitiesLayer;
}

function handleCountiesLayer(geojson) {
  // styling for the localities layer: style localities conditionally according to a presence of a moratorium
  const pointToLayer = (feature, latlng) => {
    // style localities based on whether their moratorium has passed
    if (feature.properties.passed === "Yes") {
      return L.circleMarker(latlng, {
        color: "#4dac26",
        fillColor: "#b8e186",
        fillOpacity: fillOpacity / 3,
        radius: pointRadius*1.5,
        weight: strokeWeight*2
      });
    } else {
      return L.circleMarker(latlng, {
        color: "#d01c8b",
        fillColor: "#f1b6da",
        fillOpacity: fillOpacity/3,
        radius: pointRadius*1.5,
        weight: strokeWeight*2
      });
    }
  };

  // Create the Leaflet layer for the localities data
  const countiesLayer = L.geoJson(geojson, {
    pointToLayer: pointToLayer
  });

  // Add popups to the layer
  countiesLayer.bindPopup(function(layer) {
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
  countiesLayer.addTo(map);

  // Move the map view so that the localitiesLayer is visible
  map.fitBounds(countiesLayer.getBounds(), {
    paddingTopLeft: [12, 120],
    paddingBottomRight: [12, 12]
  });

  return countiesLayer;
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
  statesLayer.bringToBack();
  
  return statesLayer;
}

