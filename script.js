// This isn't necessary but it keeps the editor from thinking L and carto are typos
/* global L, carto */

var map = L.map('map').setView([34.034453, -82.199707], 5);

// Add base layer
L.tileLayer('https://api.mapbox.com/styles/v1/ebrelsford/cjdnmgzmv00dc2rnql1pzcsk2/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZWJyZWxzZm9yZCIsImEiOiI2VFFWT21ZIn0.qhtAhoVTOPzFwWAi7YHr_Q', {
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
    polygon-fill: ramp([life_stage], (#5F4690, #1D6996, #38A6A5), ("Adult", "Juvenile", "Neonate"), "=");
  }
  #layer::outline {
    line-width: 1;
    line-color: #FFFFFF;
    line-opacity: 0.5;
  }
`);

// Add style to the data
var layer = new carto.layer.Layer(source, style);

// Add the data to the map as a layer
client.addLayer(layer);
client.getLeafletLayer().addTo(map);