// This isn't necessary but it keeps the editor from thinking L is a typo
/* global L */

var map = L.map('map').setView([34.03, -82.20], 5);

// Add base layer
L.tileLayer(' https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

// Fetch data from our Glitch project
fetch('https://cdn.glitch.com/baade5a3-f979-48f2-9a28-14daee16fab0%2Fmap.geojson?1535912286843')
  .then(function (response) {
    // Read data as JSON
    return response.json();
  })
  .then(function (data) {
    // Add data to the map
    L.geoJson(data).addTo(map);
  });