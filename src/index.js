import "styles/index.scss";
import { LeafletMap } from "./components/LeafletMap";
import { InfoWindow } from "./components/InfoWindow";
import { TitleDetails } from "./components/TitleDetails";
import { LoadingIndicator } from "./components/LoadingIndicator";
import { getData } from "utils/data";
import { parseUriHash } from "utils/parse-hash";
import { defaultMapConfig } from "utils/constants";
import { dispatch } from "./utils/dispatch";
import { i18nInit } from "./utils/i18n";
import { SearchBar } from "./components/SearchBar";

if (process.env.NODE_ENV !== "production") {
  dispatch.on("fetch-map-data-resolve.debug", console.log);
  dispatch.on("fetch-map-data-reject.debug", console.error);
}

const mapConfig = parseUriHash(defaultMapConfig);

new InfoWindow();
new TitleDetails();
new LoadingIndicator();

i18nInit().then(() => {
  Window.lmap = new LeafletMap(mapConfig);
  new InfoWindow();
  new TitleDetails();
  new SearchBar();

  getData();
});
