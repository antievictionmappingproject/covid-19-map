/* global L, carto */

const map = L.map('map').setView([30, 0], 3);

// Add base layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

// Initialize Carto
const client = new carto.Client({
  apiKey: 'apikey',
  username: 'brelsfoeagain'
});

// Initialze source data
const source = new carto.source.Dataset('hms_efh_2009tiger_shark');

// Create style for the data
const style = new carto.style.CartoCSS(`
  #layer {
    polygon-fill: red;
  }
`);

// Add style to the data
const layer = new carto.layer.Layer(source, style);

// Add the data to the map as a layer
client.addLayer(layer);
client.getLeafletLayer().addTo(map);