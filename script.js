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
  if (IS_MOBILE)
    setTimeout(function() {
      map.invalidateSize();
    }, 100);
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

// Promise.all([
//   fetch(sheetURI).then(res => {
//     if (!res.ok) throw Error("Unable to fetch moratoriums sheet data");
//     return res.text();
//   }),
//   fetch(statesGeoJsonURI).then(res => {
//     if (!res.ok) throw Error("Unable to fetch states geojson");
//     return res.json();
//   })
// ])
//   .then(handleData)
// .then(getCartoData)
// .then(({ cartoUri, countiesData }) => {
//   fetch(cartoUri)
//     .then(res => {
//       if (!res.ok) throw Error("Unable to fetch CARTO data");
//       return res.json();
//     })
//     .then(cartoData => {
//       handleCartoData(cartoData, countiesData);
//     });
// })
// .catch(error => console.log(error));

fetch(sheetURI)
  .then(res => {
    if (!res.ok) throw Error("Unable to fetch moratoriums sheet data");
    return res.text();
  })
  .then(handleSheetsData)
  .then(rows => {
    const cartoUri = createCartoUri(rows);

    //get all the data
    Promise.all([
      fetch(statesGeoJsonURI).then(res => {
        if (!res.ok) throw Error("Unable to fetch states geojson");
        return res.json();
      }),
      fetch(cartoUri).then(res => {
        if (!res.ok) throw Error("Unable to fetch CARTO data");
        return res.json();
      })
    ])
      .then(([statesGeoJson, countiesCartoData]) => ({
        sheetsRows: rows,
        statesGeoJson,
        countiesCartoData
      }))
      .then(handleGeoData);
  });

/******************************************
 * HANDLE DATA ASYNC RESPONSES
 *****************************************/
/////
function handleSheetsData(sheetsText) {
  const rows = d3
    .csvParse(sheetsText, d3.autoType)
    .map(({ passed, ...rest }) => ({
      passed: passed === "TRUE" ? "Yes" : "No",
      ...rest
    }));

  return rows;
}

function handleGeoData({ sheetsRows, statesGeoJson, countiesCartoData }) {
  console.log(countiesCartoData);

  const statesData = sheetsRows
    .filter(row => row.admin_scale === "State")
    .reduce((acc, { state, ...rest }) => {
      return acc.set(state, rest);
    }, new Map());

  const localitiesData = sheetsRows.filter(
    row => row.admin_scale === "City" && row.lat !== null && row.lon !== null
  );

  //create the counties data
  const countiesData = sheetsRows.filter(row => row.admin_scale === "County");

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

  countiesGeoJson = {
    type: "FeatureCollection",
    features: countiesCartoData.rows.map(
      ({ the_geom, state, county }, index) => {
        const properties = countiesData.filter(
          row =>
            row.municipality
              .replace(" County", "")
              .replace("Miami-Dade", "Dade")
              .replace("County of ", "")
              .replace(" (unincorporated)", "")
              .replace(" County", "") === county &&
            row.state.replace("Illinoise", "Illinois") === state
        );

        return {
          type: "Feature",
          id: index,
          properties,
          geometry: JSON.parse(the_geom)
        };
      }
    )
  };

  console.log(countiesGeoJson);

  // add both the states layer and localities layer to the map
  // and save the layer output
  const states = handleStatesLayer(statesGeoJson);
  const counties = handleCountiesCartoLayer(countiesGeoJson);
  const localities = handleLocalitiesLayer(localitiesGeoJson);
  
  // add layers to layers control
  layersControl
    .addOverlay(localities, "Cities")
    .addOverlay(counties, "Counties")
    .addOverlay(states, "States");
}

function createCartoUri(rows) {
  const countiesData = rows.filter(row => row.admin_scale === "County");

  const predicateString = countiesData
    .map(({ state, municipality }) => {
      return {
        state,
        municipality
      };
    })
    .reduce(
      (acc, row) =>
        `${acc} county LIKE '${row.municipality
          .replace(" County", "")
          .replace("Miami-Dade", "Dade")
          .replace("County of ", "")
          .replace(" (unincorporated)", "")
          .replace(" County", "")}' AND state LIKE '${row.state.replace(
          "Illinoise",
          "Illinois"
        )}' OR`,
      "WHERE"
    )
    .slice(0, -3);

  cartoQuery = `SELECT county, state, ST_AsGeoJSON(the_geom) as the_geom from public.us_county_boundaries ${predicateString}`;

  console.log(cartoQuery);

  return `https://ampitup.carto.com/api/v2/sql?q=${cartoQuery}`;
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

function handleCountiesCartoLayer(geojson) {
  // style layer based on whether their moratorium has passed
  const layerOptions = {
    style: feature => {
      const yesOptions = {
        color: "#4dac26",
        fillColor: "#b8e186",
        fillOpacity: fillOpacity,
        weight: strokeWeight
      };

      const noOptions = {
        color: "#d01c8b",
        fillColor: "#f1b6da",
        fillOpacity: fillOpacity,
        weight: strokeWeight
      };

      const splitOptions = {
        color: "#E0E0E0",
        fillColor: "#707070",
        fillOpacity: fillOpacity,
        weight: strokeWeight
      };

      const elseOptions = {
        stroke: false,
        fill: false
      };

      if (feature.properties.length > 1) {
        const featurePropertiesPassed = Array.from(
          new Set(feature.properties.map(row => row.passed))
        );

        if (
          featurePropertiesPassed.length === 1 &&
          featurePropertiesPassed[0] === "Yes"
        ) {
          return yesOptions;
        }
        if (
          featurePropertiesPassed.length === 1 &&
          featurePropertiesPassed[0] === "No"
        ) {
          return noOptions;
        }
        if (featurePropertiesPassed.length === 1) {
          return splitOptions;
        }
      }

      if (feature.properties.length === 1) {
        if (feature.properties[0].passed === "Yes") {
          return yesOptions;
        }
        if (
          feature.properties.length === 1 &&
          feature.properties[0].passed === "No"
        ) {
          return noOptions;
        } else {
          return elseOptions;
        }
      }
    }
  };

  // Create the Leaflet layer for the counties data
  const countiesLayer = L.geoJson(geojson, layerOptions);

  countiesLayer.bindPopup(function(layer) {
    const renderedInfo = Mustache.render(
      infowindowTemplate,
      layer.feature.properties[0]
    );
    document.getElementById(
      "aemp-infowindow-container"
    ).innerHTML = renderedInfo;
    return Mustache.render(popupTemplate, layer.feature.properties[0]);
  });

  countiesLayer.addTo(map);

  return countiesLayer;
}
