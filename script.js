// This isn't necessary but it keeps the editor from thinking L is a typo
/* global L, Mustache */

const apiBaseURI = "https://ampitup.carto.com:443/api/v2/sql";

const evictionMoratoriumsQuery = 
  "SELECT " +
    "cartodb_id " + 
    "municipality, passed, lat, lon, link, policy_summary, " +
    "policy_type, start, _end, state, admin_scale " +
  "FROM " +
    "public.eviction_moratorium_mapping;";

const dataURI = `${apiBaseURI}?q=${evictionMoratoriumsQuery}`;
console.log(dataURI)

// create a new map instance by referencing the html element by classname
const map = L.map('map').setView([34.03, -82.20], 5);

// Get the popup template from the HTML.
//
// We can do this here because the template will never change.
const popupTemplate = document.querySelector('.popup-template').innerHTML;

// Add base layer
L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

fetch(dataURI)
  .then(function (response) {
    // Read data as JSON
    return response.json();
  })
  .then(function (data) {
    console.log(data);
    
    const { rows } = data;
  
    const statesData = rows.filter(row => row.admin_scale === "State");
    const localitiesData = rows.filter(row => row.admin_scale !== "State" && row.lat !== null && row.lon !== null);
  
    console.log(statesData, localitiesData);
  
    const localitiesGeoJson = {
      type: "FeatureCollection",
      features: localitiesData.map(d => ({
        type: "Feature",
        id: null,
        properties: d,
        geometry: {
          type: "Point",
          coordinates: [d.lon, d.lat]
        }
      }))
    }
    
    // Create the Leaflet layer for the localities data 
    const localitiesLayer = L.geoJson(localitiesGeoJson);
  
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
  });