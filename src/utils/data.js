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

export async function getCartoData(query, bounds, format = "geojson") {
  const res = await fetch(
    `${cartoSqlApiBaseUri}?q=${window.encodeURIComponent(
      query(bounds)
    )}&format=${format}`
  );

  if (!res || !res.ok) {
    console.log(query(bounds));
    console.log(JSON.stringify(await res.json()));
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
  return d3.csvParse(text, d3.autoType);
}

export async function getData(bounds) {
  for (let [key, layerConfig] of Object.entries(mapLayersConfig)) {
    try {
      const data =
        layerConfig.query !== null
          ? await getCartoData(layerConfig.query, bounds)
          : await getSheetsData(layerConfig.sheetId);
      handleFetchSuccess("fetch-map-data-resolve", { key, layerConfig, data });
    } catch (error) {
      handleFetchFailure("fetch-map-data-reject", error);
    }
  }
}
