import { aempCartoAccount } from "./config";
import { mapLayersConfig } from "../map-layers";
import { dispatch } from "./dispatch";
import Translator from "./translator";

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
  return d3.csvParse(text, d3.autoType);
}

export async function getData(config) {
  // TODO: Get the translation language based on the translator class instance
  // TODO: Get translations based on this language, currently only getting from query params
  const translations = await Translator.getTranslation("i18n", config.lang);
  for (let [key, layerConfig] of Object.entries(mapLayersConfig)) {
    // Get localized values
    const localizedName = translations[`layer-select-${key}`];
    console.log(localizedName);

    // Join localized name to existing configuration
    const localizedLayerConfig = {
      ...layerConfig,
      name: localizedName,
    };

    try {
      const data =
        localizedLayerConfig.query !== null
          ? await getCartoData(localizedLayerConfig.query)
          : await getSheetsData(localizedLayerConfig.sheetId);
      handleFetchSuccess("fetch-map-data-resolve", {
        key,
        localizedLayerConfig,
        data,
      });
    } catch (error) {
      handleFetchFailure("fetch-map-data-reject", error);
    }
  }
}
