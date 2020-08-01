import { mapLayersConfig } from "../map-layers";

// List of all languages we have translations for.
export const languages = ["en", "es", "pt-BR"];

// color values come from this ColorBrewer:
export const colorNoData = "#939393";
export const fillColorScale = [undefined, "#5e5e5e", "#bdbdbd", "#ffffff"];
export const strokeColorScale = [undefined, "#ffffff", "#ffffff", "#ffffff"];

export const rentStrikeColor = "#c92a1d";

// global map layer styling variables
export const strokeWeightMore = 3; //state boundary
export const strokeWeightLess = 1.5;
export const pointRadius = 10;
export const fillOpacity = 0.95;

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
  lat: 40.27,
  lng: -43.74,
  z: 2,
  nations: true,
  states: true,
  cities: true,
  counties: true,
  rentStrikes: true,
};

export const TOTAL_NUMBER_OF_MAP_LAYERS = Object.keys(mapLayersConfig).length;

export const isMobile = () =>
  document.querySelector("body").offsetWidth < MOBILE_BREAKPOINT;
