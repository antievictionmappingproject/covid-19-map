// color values come from this ColorBrewer url:
// https://colorbrewer2.org/#type=sequential&scheme=YlGn&n=7
export const colorNoData = "#939393";
export const fillColorScale = [undefined, "#d9f0a3", "#78c679", "#238443"];
export const strokeColorScale = [undefined, "#addd8e", "#41ab5d", "#005a32"];

// global map layer styling variables
export const strokeWeight = 1.5;
export const pointRadius = 8;
export const fillOpacity = 0.7;

// corresponds to fill & stroke color scales above
export const policyStrengthLanguage = [
  "",
  "Few protections in place",
  "Some protections in place",
  "Many protections in place",
];

// note: this matches the breakpoint in styles.css
export const MOBILE_BREAKPOINT = 640;
export const DESKTOP_BREAKPOINT = 1200;
