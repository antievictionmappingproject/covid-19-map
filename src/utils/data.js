// fetch polyfill for IE
import "whatwg-fetch";
import { aempCartoAccount } from "./config";
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
  try {
    console.log("getting search data");
    let res = await fetch(
      `http://dev.virtualearth.net/REST/v1/Locations/${str}?key=Al2-1GXrd8GzwtSAID3J3LJn-flLLgNWzNtsT5nnSKW8dA2ClgaXXXMQR6WfE6wE`
    );
    return await res.json();
  } catch (e) {
    dispatch.call("search-fetch-data-reject", this, e);
  }
}
