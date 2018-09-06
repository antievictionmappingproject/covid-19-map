// This isn't necessary but it keeps the editor from thinking L is a typo
/* global L */

var map = L.map('map').setView([34.03, -82.20], 5);

// Add base layer
L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

fetch('https://data.cityofnewyork.us/resource/fhrw-4uyv.geojson')
  .then(function (response) {
    // Read data as JSON
    return response.json();
  })
  .then(function (data) {
    // Add data to the map
    var overlayData = L.geoJson(data)
      .bindPopup(function (layer) {
        return layer.feature.properties.complaint_type;
      });
    overlayData.addTo(map);
    map.fitBounds(overlayData.getBounds());
  });