// This isn't necessary but it keeps the editor from thinking L is a typo
/* global L, Mustache */

var map = L.map('map').setView([34.03, -82.20], 5);

// Get the popup template from the HTML.
//
// We can do this here because the template will never change.
var popupTemplate = document.querySelector('.popup-template').innerHTML;

// Add base layer
L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

fetch('https://data.cityofnewyork.us/resource/fhrw-4uyv.geojson?$where=latitude is not null')
  .then(function (response) {
    // Read data as JSON
    return response.json();
  })
  .then(function (data) {
    // Create the Leaflet layer for the data 
    var complaintData = L.geoJson(data);
  
    // Add popups to the layer
    complaintData.bindPopup(function (layer) {
      // This function is called whenever a feature on the layer is clicked
      console.log(layer.feature.properties);
      
      // Render the template with all of the properties. Mustache ignores properties
      // that aren't used in the template, so this is fine.
      return Mustache.render(popupTemplate, layer.feature.properties);
    });
  
    // Add data to the map
    complaintData.addTo(map);
  
    // Move the map view so that the complaintData is visible
    map.fitBounds(complaintData.getBounds());
  });