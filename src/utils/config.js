// unique id of the Google sheet that imports desired columns from the rent-strike form responses public sheet
export const renStikeSheetId = "1rCZfNXO3gbl5H3cKhGXKIv3samJ1KC4nLhCwwZqrHvU";

// the URI that grabs the sheet text formatted as a CSV
export const rentStrikeSheetURI = `https://docs.google.com/spreadsheets/d/${renStikeSheetId}/export?format=csv&id=${renStikeSheetId}`;

// name of AEMP's CARTO account
export const aempCartoAccount = "ampitup";

// table in CARTO that syncs with the Google sheet data
export const cartoSheetSyncTable = "public.emergency_tenant_protections_scored";
export const cartoCountiesTable = "public.us_county_boundaries";
export const cartoStatesTable = "public.states_and_provinces_global";
export const cartoNationsTable = "public.countries";
