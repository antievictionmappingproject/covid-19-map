// fetch polyfill for IE
import "whatwg-fetch";
import { aempCartoAccount, bingApiKey } from "./config";
import { mapLayersConfig } from "../map-layers";
import { dispatch } from "./dispatch";

const cartoSqlApiBaseUri = `https://${aempCartoAccount}.carto.com/api/v2/sql`;

function handleFetchSuccess(name, data) {
  dispatch.call(name, null, data);
}

function handleFetchFailure(name, error) {
  dispatch.call(name, null, error);
}

export async function getCartoData(query, format = "geojson") {
  const res = await fetch(
    `${cartoSqlApiBaseUri}?q=${window.encodeURIComponent(
      query
    )}&format=${format}`
  );

  if (!res || !res.ok) {
    throw Error("Unable to fetch Carto data");
  }

  return res.json();
}

export async function getData() {
  Object.entries(mapLayersConfig).forEach(async ([key, layerConfig]) => {
    try {
      const data = await getCartoData(layerConfig.query);
      handleFetchSuccess("fetch-map-data-resolve", { key, layerConfig, data });
    } catch (error) {
      handleFetchFailure("fetch-map-data-reject", error);
      dispatch.call("hide-loading-indicator");
    }
  });
}
export async function getSearchData(str) {
  let langStr = navigator.language ? `&culture = ${navigator.language}` : "";
  try {
    let res = await fetch(
      `https://dev.virtualearth.net/REST/v1/Autosuggest?query=${str}${langStr}&includeEntityTypes=place&userMapView=-90,-180,90,180&key=${bingApiKey}`
    );
    return await res.json();
  } catch (e) {
    dispatch.call("search-fetch-data-reject", this, e);
  }
}

export async function getAutocompleteMapLocation(val) {
  try {
    let res = await fetch(
      `https://dev.virtualearth.net/REST/v1/Locations/${val}?&key=${bingApiKey}`
    );
    return res.json();
  } catch (e) {
    dispatch.call("search-fetch-data-reject", this, e);
  }
}
