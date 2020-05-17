import { aempCartoAccount, renStikeSheetId } from "./config";
import {
  citiesCartoQuery,
  countiesCartoQuery,
  statesCartoQuery,
  countriesCartoQuery,
} from "./queries";

const cartoSqlApiBaseUri = `https://${aempCartoAccount}.carto.com/api/v2/sql`;

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

export async function getGoogleSheetAsCsvText(sheetId) {
  const res = await fetch(
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&id=${sheetId}`
  );

  if (!res || !res.ok) {
    throw Error("Unable to fetch sheets data");
  }

  return res.text();
}

export async function getAllData() {
  const queries = [
    citiesCartoQuery,
    countiesCartoQuery,
    statesCartoQuery,
    countriesCartoQuery,
  ];

  return await Promise.all([
    getGoogleSheetAsCsvText(renStikeSheetId),
    ...queries.map(async (query) => await getCartoData(query)),
  ]);
}
