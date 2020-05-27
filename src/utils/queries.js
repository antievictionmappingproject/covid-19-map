import {
  cartoSheetSyncTable,
  cartoCountiesTable,
  cartoStatesTable,
  cartoNationsTable,
} from "./config";

/**
 * Creates clause that only returns features in the provided latlng
 */
const containsClause = (bounds, and, geomField = "the_geom") =>
  bounds
    ? `
${and ? "AND " : ""}ST_Contains(
  ST_MakeEnvelope(${bounds[0][1]}, ${bounds[0][0]}, ${bounds[1][1]}, ${
        bounds[1][0]
      }, 4326),
  ${geomField}
)
`
    : "";

/**
 * SQL queries that are passed to the CARTO SQL API
 * for more info on the SQL API see: https://carto.com/developers/sql-api/
 *
 * Bounds are optional
 */
export const citiesCartoQuery = (bounds) => `
SELECT
  municipality, state, country, range, 
  policy_type, policy_summary, link, the_geom
FROM ${cartoSheetSyncTable}
WHERE the_geom is not null and admin_scale = 'City'
  ${containsClause(bounds, true)}
ORDER BY range`;

export const countiesCartoQuery = (bounds) => `
SELECT
  c.the_geom, c.county, c.state, m.range, 
  m.policy_type, m.policy_summary, m.link, m.range
FROM ${cartoCountiesTable} c
JOIN ${cartoSheetSyncTable} m
ON ST_Intersects(c.the_geom, m.the_geom)
WHERE m.the_geom IS NOT NULL
  ${containsClause(bounds, true, "c.the_geom")}
  AND m.admin_scale = 'County'
  OR m.admin_scale = 'City and County'
ORDER BY m.range`;

export const statesCartoQuery = (bounds) => `
SELECT
  s.the_geom, s.name, s.admin, s.sr_adm0_a3,
  m.range, m.iso, m .policy_type, m.policy_summary, m.link
FROM ${cartoStatesTable} s
INNER JOIN ${cartoSheetSyncTable} m
  ON s.name = m.state
  AND s.sr_adm0_a3 = m.iso
  AND m.admin_scale = 'State'
${
  bounds
    ? `
  WHERE
    ${containsClause(bounds, false, "s.the_geom")}
`
    : ""
}
ORDER BY m.range`;

export const countriesCartoQuery = (bounds) => `
SELECT 
  c.the_geom, c.adm0_a3, c.name_en, m.range,
  m.policy_type, m.policy_summary, m.link
FROM ${cartoNationsTable} c
INNER JOIN ${cartoSheetSyncTable} m
  ON c.adm0_a3 = m.iso
  AND m.admin_scale = 'Country'
  ${containsClause(bounds, true, "c.the_geom")}
ORDER BY m.range`;
