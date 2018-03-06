
const map = L.map('map').setView([30, 0], 3);

// Add base layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

const client = new carto.Client({
  apiKey: 'apikey',
  username: 'brelsfoeagain'
});

const source = new carto.source.Dataset('hms_efh_2009tiger_shark');
const style = new carto.style.CartoCSS(`
  #layer {
    polygon-fill: red;
  }
`);
const layer = new carto.layer.Layer(source, style);

client.addLayer(layer);
client.getLeafletLayer().addTo(map);