// table in CARTO that syncs with the Google sheet data
const cartoSheetSyncTable = "public.emergency_tenant_protections_scored";

export const citiesCartoQuery = `SELECT
municipality, state, country, range, policy_type, policy_summary, link, the_geom
FROM ${cartoSheetSyncTable}
WHERE the_geom is not null and admin_scale = 'City'
ORDER BY range`;

export const countiesCartoQuery = `SELECT
c.the_geom, c.county, c.state, m.range, m.policy_type, m.policy_summary, m.link, m.range
FROM us_county_boundaries c
JOIN ${cartoSheetSyncTable} m
ON ST_Intersects(c.the_geom, m.the_geom)
WHERE m.the_geom IS NOT NULL
AND m.admin_scale = 'County'
OR m.admin_scale = 'City and County'
ORDER BY m.range`;

export const statesCartoQuery = `
SELECT
  s.the_geom,
  s.name,
  s.admin,
  s.sr_adm0_a3,
  m.range,
  m.iso,
  m.policy_type,
  m.policy_summary,
  m.link
FROM
  public.states_and_provinces_global s
  INNER JOIN ${cartoSheetSyncTable} m ON s.name = m.state
  AND s.sr_adm0_a3 = m.iso
  AND m.admin_scale = 'State'
ORDER BY
  m.range
`;

export const nationsCartoQuery = `SELECT c.the_geom, c.adm0_a3, c.name_en, m.range,
m.policy_type, m.policy_summary, m.link
FROM countries c
INNER JOIN ${cartoSheetSyncTable} m
ON c.adm0_a3 = m.iso
AND m.admin_scale = 'Country'
ORDER BY m.range`;

export const createCartoURIFromQuery = (query) => {
  return `https://ampitup.carto.com/api/v2/sql?q=${query}&format=geojson`;
};
