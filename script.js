// This isn't necessary but it keeps the editor from thinking L and carto are typos
/* global L, carto */

var map = L.map('map').setView([30, 0], 3);

// Add base layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

// Initialize Carto
var client = new carto.Client({
  apiKey: 'apikey',
  username: 'brelsfoeagain'
});

// Initialze source data
var source = new carto.source.Dataset('hms_efh_2009tiger_shark');

// Create style for the data
var style = new carto.style.CartoCSS(`
  #layer {
    polygon-fill: red;
  }
`);

// Add style to the data
var layer = new carto.layer.Layer(source, style);

// Add the data to the map as a layer
client.addLayer(layer);
client.getLeafletLayer().addTo(map);