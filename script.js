// This isn't necessary but it keeps the editor from thinking L is a typo
/* global L */

var map = L.map('map').setView([34.03, -82.20], 5);

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
      
      // Uncomment this to see all properties on the clicked feature:
      console.log(layer.feature.properties);
      return layer.feature.properties.complaint_type;
    });
  
    // Add data to the map
    complaintData.addTo(map);
  
    // Move the map view so that the complaintData is visible
    map.fitBounds(complaintData.getBounds());
  });