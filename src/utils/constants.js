import { mapLayersConfig } from "../map-layers";

// List of all languages we have translations for.
export const languages = ["en", "es", "pt-BR", "it", "de"];

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
  lat: 45.356488,
  lng: 12.771901,
  z: 3,
  nations: true,
  states: true,
  cities: true,
  counties: true,
  rentStrikes: true,
};

export const TOTAL_NUMBER_OF_MAP_LAYERS = Object.keys(mapLayersConfig).length;

export const isMobile = () =>
  document.querySelector("body").offsetWidth < MOBILE_BREAKPOINT;

export const usStateAbbrevToName = {
  al: "Alabama",
  ak: "Alaska",
  az: "Arizona",
  ar: "Arkansas",
  ca: "California",
  co: "Colorado",
  ct: "Connecticut",
  de: "Delaware",
  fl: "Florida",
  ga: "Georgia",
  hi: "Hawaii",
  id: "Idaho",
  il: "Illinois",
  in: "Indiana",
  ia: "Iowa",
  ks: "Kansas",
  ky: "Kentucky",
  la: "Louisiana",
  me: "Maine",
  md: "Maryland",
  ma: "Massachusetts",
  mi: "Michigan",
  mn: "Minnesota",
  ms: "Mississippi",
  mo: "Missouri",
  mt: "Montana",
  ne: "Nebraska",
  nv: "Nevada",
  nh: "New Hampshire",
  nj: "New Jersey",
  nm: "New Mexico",
  ny: "New York",
  nc: "North Carolina",
  nd: "North Dakota",
  oh: "Ohio",
  ok: "Oklahoma",
  or: "Oregon",
  pa: "Pennsylvania",
  ri: "Rhode Island",
  sc: "South Carolina",
  sd: "South Dakota",
  tn: "Tennessee",
  tx: "Texas",
  ut: "Utah",
  vt: "Vermont",
  va: "Virginia",
  wa: "Washington",
  wv: "West Virginia",
  wi: "Wisconson",
  wy: "Wyoming",
  dc: "District of Columbia",
};

export const indiaStateAbbrevToName = {
  an: "Andaman and Nicobar Islands",
  ap: "Andhra Pradesh",
  ar: "Arunachal Pradesh",
  as: "Assam",
  br: "Bihar",
  ch: "Chandigarh",
  ct: "Chhattisgarh",
  dn: "Dadra and Nagar Haveli",
  dd: "Daman and Diu",
  dl: "Delhi",
  ga: "Goa",
  gj: "Gujarat",
  hr: "Haryana",
  hp: "Himachal Pradesh",
  jk: "Jammu and Kashmir",
  jh: "Jharkhand",
  ka: "Karnataka",
  kl: "Kerala",
  ld: "Lakshadweep",
  mp: "Madhya Pradesh",
  mh: "Maharashtra",
  mn: "Manipur",
  ml: "Meghalaya",
  mz: "Mizoram",
  nl: "Nagaland",
  or: "Odisha",
  py: "Puducherry",
  pb: "Punjab",
  rj: "Rajasthan",
  sk: "Sikkim",
  tn: "Tamil Nadu",
  tg: "Telangana",
  tr: "Tripura",
  up: "Uttar Pradesh",
  ut: "Uttarakhand",
  wb: "West Bengal",
};
