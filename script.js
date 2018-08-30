// This isn't necessary but it keeps the editor from thinking L is a typo
/* global L */

var map = L.map('map').setView([34.034453, -82.199707], 5);

// Add base layer
L.tileLayer('http://c.tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

// TODO load some data