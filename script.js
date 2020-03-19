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

// create a new map instance by referencing the html element by classname
const map = L.map('map').setView([34.03, -82.20], 5);

// Get the popup template from the HTML.
// We can do this here because the template will never change.
const popupTemplate = document.querySelector('.popup-template').innerHTML;

// Add base layer
L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

/****************************************** 
 * FETCH DATA SOURCES
 *****************************************/

Promise.all(
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
    const { rows } = cartoData;
  
    // seperate out the states data from the localities data
    const statesData = rows.filter(row => row.admin_scale === "State");
    const localitiesData = rows.filter(row => row.admin_scale !== "State" && row.lat !== null && row.lon !== null);
  
    console.log(statesData, localitiesData);
    
    // convert the regular moratorium JSON into valid GeoJSON
    const localitiesGeoJson = {
      type: "FeatureCollection",
      features: localitiesData.map(({ cartodb_id, lat, lon, ...rest}) => ({
        type: "Feature",
        id: cartodb_id,
        properties: rest,
        geometry: {
          type: "Point",
          coordinates: [lon, lat]
        }
      }))
    }
    
    // TODO: handle joining the states data
    let statesDataJoined;
    
    handleMoratoriumsLayer(localitiesGeoJson)
    handleStatesLayer(statesDataJoined);
}

/****************************************** 
 * HANDLE ADDING MAP LAYERS
 *****************************************/

function handleMoratoriumsLayer(geojson) {
    // Create the Leaflet layer for the localities data 
    const localitiesLayer = L.geoJson(geojson);
  
    // Add popups to the layer
    localitiesLayer.bindPopup(function (layer) {
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
  // TODO: handle creating the states layer
}