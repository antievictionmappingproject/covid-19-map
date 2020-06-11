import i18next from "i18next";
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
import en from "./locale/en.json";

if (process.env.NODE_ENV !== "production") {
  // dispatch.on("fetch-map-data-resolve.debug", console.log);
  dispatch.on("fetch-map-data-reject.debug", console.error);
}
// Setup i18n
i18next
  .init({
    lng: "en",
    debug: true,
    resources: {
      en,
    },
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
