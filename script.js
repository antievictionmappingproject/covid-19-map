// This isn't necessary but it keeps the editor from thinking L is a typo
/* global L */

var map = L.map('map').setView([34.03, -82.20], 5);

// Add base layer
L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

// Fetch data from our Glitch project
fetch('https://data.cityofnewyork.us/resource/cuae-wd7h.geojson')
  .then(function (response) {
    // Read data as JSON
    return response.json();
  })
  .then(function (data) {
    console.log(data);
    // Add data to the map
    L.geoJson(data).addTo(map);
  });


fetch('https://data.cityofnewyork.us/resource/fhrw-4uyv.geojson?$where=Latitude is not null&$limit=100')
  .then(function (response) {
    // Read data as JSON
    return response.json();
  })
  .then(function (data) {
    console.log(data);
    // Add data to the map
    L.geoJson(data).addTo(map);
  });