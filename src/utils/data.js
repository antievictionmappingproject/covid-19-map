// fetch polyfill for IE
import "whatwg-fetch";
import { autoType, csvParse } from "d3-dsv";
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

export async function getSheetsData(sheetId) {
  const res = await fetch(
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&id=${sheetId}`
  );

  if (!res || !res.ok) {
    throw Error("Unable to fetch sheets data");
  }

  const text = await res.text();
  return csvParse(text, autoType);
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
