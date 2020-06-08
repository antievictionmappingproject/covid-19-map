// NOTE: use this module for referencing Leaflet,
// so that any Leaflet plugins are also available
const L = Object.assign(
  require("leaflet"),
  require("leaflet.markercluster"),
  require("leaflet.pattern")
);

export const rentStrikeIcon = new L.Icon({
  iconUrl: "./assets/mapIcons/rent-strike.svg",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  className: "icon-rent-strike",
});

window.L = L;
export default L;
