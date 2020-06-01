import "styles/index.scss";
import i18nextify from "i18nextify";
import { LeafletMap } from "./components/LeafletMap";
import { InfoWindow } from "./components/InfoWindow";
import { TitleDetails } from "./components/TitleDetails";
import { LoadingIndicator } from "./components/LoadingIndicator";
import { getData } from "utils/data";
import { parseUriHash } from "utils/parse-hash";
import { defaultMapConfig } from "utils/constants";
import { dispatch } from "./utils/dispatch";

if (process.env.NODE_ENV !== "production") {
  dispatch.on("fetch-map-data-resolve.debug", console.log);
  dispatch.on("fetch-map-data-reject.debug", console.error);
}

const mapConfig = parseUriHash(defaultMapConfig);

new LeafletMap(mapConfig);
new InfoWindow();
new TitleDetails();
new LoadingIndicator();

getData();
