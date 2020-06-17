import { mapLayersConfig } from "../map-layers";

// color values come from this ColorBrewer url:
// https://colorbrewer2.org/#type=sequential&scheme=YlGn&n=7
export const colorNoData = "#939393";
export const fillColorScale = [undefined, "#d9f0a3", "#78c679", "#238443"];
export const strokeColorScale = [undefined, "#addd8e", "#41ab5d", "#005a32"];

// global map layer styling variables
export const strokeWeight = 1.5;
export const pointRadius = 10;
export const fillOpacity = 0.7;

// corresponds to fill & stroke color scales above
export const policyStrengthLayerClassNames = [
  undefined,
  "few-protections",
  "some-protections",
  "many-protections",
];

// note: this matches the breakpoint in styles.css
export const MOBILE_BREAKPOINT = 640;
export const DESKTOP_BREAKPOINT = 1200;

export const defaultMapConfig = {
  lat: 40.67,
  lng: -97.23,
  z: 4,
  nations: false,
  states: true,
  cities: true,
  counties: true,
  rentStrikes: true,
};

export const TOTAL_NUMBER_OF_MAP_LAYERS = Object.keys(mapLayersConfig).length;

export const isMobile = () =>
  document.querySelector("body").offsetWidth < MOBILE_BREAKPOINT;
