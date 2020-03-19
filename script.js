// This isn't necessary but it keeps the editor from thinking L is a typo
/* global L, Mustache */

console.clear();

/******************************************
 * DATA SOURCES
 *****************************************/

// the base URI for the CARTO SQL API
const apiBaseURI = "https://ampitup.carto.com:443/api/v2/sql";

// SQL query to pass to the CARTO API
const evictionMoratoriumsQuery =
  "SELECT " +
  "cartodb_id, " +
  "(CASE WHEN passed IS TRUE THEN 'Yes' ELSE 'No' END) AS passed, " +
  "municipality, lat, lon, link, policy_summary, " +
  "policy_type, start, _end, state, admin_scale " +
  "FROM " +
  "public.eviction_moratorium_mapping;";

// complete URI to pass to fetch()
const evictionMoratoriumDataURI = `${apiBaseURI}?q=${evictionMoratoriumsQuery}`;

// states geojson url
const statesGeoJsonURI = "./states.geojson";

/******************************************
 * MAP SETUP
 *****************************************/

// options for configuring the Leaflet map
const mapOptions = {};

// create a new map instance by referencing the appropriate html element by its "id" attribute
const map = L.map("map").setView([34.03, -82.2], 5);

const zoomControl = L.control.zoom({ position: "bottomright" }).addTo()

// Get the popup template from the HTML.
// We can do this here because the template will never change.
const popupTemplate = document.querySelector(".popup-template").innerHTML;

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

Promise.all(
  // map our data URIs to Fetch requests, then handle them once they've completed (or errored)
  [evictionMoratoriumDataURI, statesGeoJsonURI].map(uri =>
    fetch(uri).then(res => {
      if (!res.ok) {
        throw new Error("Network request error with data fetch");
      }
      return res.json();
    })
  )
)
  .then(handleData)
  .catch(error => console.log(error));

/******************************************
 * HANDLE DATA ASYNC RESPONSES
 *****************************************/

function handleData([cartoData, statesGeoJson]) {
  // seperate out the states data from the localities data
  const { rows } = cartoData;

  const statesData = rows
    .filter(row => row.admin_scale === "State")
    .reduce((acc, { state, ...rest }) => {
      return acc.set(state, rest);
    }, new Map());

  const localitiesData = rows.filter(
    row => row.admin_scale !== "State" && row.lat !== null && row.lon !== null
  );

  console.log(statesData, localitiesData);

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

  console.log(statesGeoJson);

  handleLocalitiesLayer(localitiesGeoJson);
  handleStatesLayer(statesGeoJson);
}

/******************************************
 * HANDLE ADDING MAP LAYERS
 *****************************************/

function handleLocalitiesLayer(geojson) {
  // Create the Leaflet layer for the localities data
  const localitiesLayer = L.geoJson(geojson);

  // Add popups to the layer
  localitiesLayer.bindPopup(function(layer) {
    // This function is called whenever a feature on the layer is clicked
    console.log(layer.feature.properties);

    // Render the template with all of the properties. Mustache ignores properties
    // that aren't used in the template, so this is fine.
    return Mustache.render(popupTemplate, layer.feature.properties);
  });

  // Add data to the map
  localitiesLayer.addTo(map);

  // Move the map view so that the localitiesLayer is visible
  map.fitBounds(localitiesLayer.getBounds());
}

function handleStatesLayer(geojson) {
  // styling for the states layer: style states conditionally according to a presence of a moratorium
  const layerOptions = {
    style: feature => {
      // only style / show states that have a state wide moratorium
      if (feature.properties.policy_type) {
        return {
          stroke: true,
          color: "#3388ff",
          fill: true
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

  statesLayer.bindPopup(layer =>
    Mustache.render(popupTemplate, layer.feature.properties)
  );

  statesLayer.addTo(map);
}
