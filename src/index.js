import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import "styles/index.scss";
import { LeafletMap } from "./components/LeafletMap";
import { InfoWindow } from "./components/InfoWindow";
import { TitleDetails } from "./components/TitleDetails";
import { LoadingIndicator } from "./components/LoadingIndicator";
import { getData } from "utils/data";
import { parseUriHash } from "utils/parse-hash";
import { defaultMapConfig } from "utils/constants";
import { dispatch } from "./utils/dispatch";
import { translateContent } from "./utils/translations";
import { locales } from "./locale/locales";

if (process.env.NODE_ENV !== "production") {
  // dispatch.on("fetch-map-data-resolve.debug", console.log);
  dispatch.on("fetch-map-data-reject.debug", console.error);
}

i18next
  .use(LanguageDetector)
  .init({
    lng: "pt-BR",
    debug: process.env.NODE_ENV !== "production",
    resources: locales,
  })
  .then(() => {
    // First pass of translation
    translateContent();
  });

const mapConfig = parseUriHash(defaultMapConfig);

new LeafletMap(mapConfig);
new InfoWindow();
new TitleDetails();
new LoadingIndicator();

getData();
