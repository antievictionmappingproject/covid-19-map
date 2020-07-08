import {
  cartoHousingActionsTable,
  cartoSheetSyncTable,
  cartoCountiesTable,
  cartoStatesTable,
  cartoNationsTable,
} from "./config";

/**
 * SQL queries that are passed to the CARTO SQL API
 * for more info on the SQL API see: https://carto.com/developers/sql-api/
 */

export const citiesCartoQuery = `
SELECT
  municipality, state, country, range, has_expired_protections,
  policy_type, policy_summary, link, the_geom,
  end_date_earliest, end_date_legist, end_date_rent_relief, end_date_court
FROM ${cartoSheetSyncTable}
WHERE the_geom is not null and admin_scale = 'City'
ORDER BY range`;

export const countiesCartoQuery = `
SELECT
  c.the_geom, c.county, c.state, m.range,
  m.policy_type, m.policy_summary, m.link,
  m.range, has_expired_protections,
  end_date_earliest, end_date_legist, end_date_rent_relief, end_date_court
FROM ${cartoCountiesTable} c
JOIN ${cartoSheetSyncTable} m
ON ST_Intersects(c.the_geom, m.the_geom)
WHERE m.the_geom IS NOT NULL
  AND m.admin_scale = 'County'
  OR m.admin_scale = 'City and County'
ORDER BY m.range`;

export const statesCartoQuery = `
SELECT
  s.the_geom, s.name, s.admin, s.sr_adm0_a3,
  m.range, m.iso, m .policy_type, m.policy_summary,
  m.link, has_expired_protections,
  end_date_earliest, end_date_legist, end_date_rent_relief, end_date_court
FROM ${cartoStatesTable} s
INNER JOIN ${cartoSheetSyncTable} m
  ON s.name = m.state
  AND s.sr_adm0_a3 = m.iso
  AND m.admin_scale = 'State'
ORDER BY m.range`;

export const countriesCartoQuery = `
SELECT
  c.the_geom, c.adm0_a3, c.name_en, m.range,
  m.policy_type, m.policy_summary, m.link, has_expired_protections,
  end_date_earliest
FROM ${cartoNationsTable} c
INNER JOIN ${cartoSheetSyncTable} m
  ON c.adm0_a3 = m.iso
  AND m.admin_scale = 'Country'
ORDER BY m.range`;

export const housingActionsCartoQuery = `
  SELECT
    CASE
      WHEN strike_status IN ('Yes / Sí / 是 / Oui', 'Yes') THEN 'Yes'
      WHEN strike_status IN ('Unsure / No estoy segurx / 不确定 / Pas sûr.e.s.', 'No') THEN 'No'
      ELSE 'Unsure'
    END AS status,
    CASE
      WHEN type LIKE 'Rent Strike%' THEN 'Rent Strike / Rent decrease'
      WHEN type LIKE 'Occupation / Squat%' THEN 'Occupation / Squat'
      WHEN type LIKE 'Mutual aid / Direct aid%' THEN 'Mutual aid / Direct aid'
      WHEN type LIKE 'Campaigning / List of demands%' THEN 'Campaigning / List of demands'
      ELSE 'Other'
    END AS strike_type,
    TO_CHAR(date :: DATE, 'Month d, yyyy') as start,
    the_geom, location, why, resources
  FROM ${cartoHousingActionsTable}
  WHERE the_geom IS NOT NULL;
`;

//Rent Strike / Rent decrease (i.e. suspended or decreased rent payment) / Huelga de alquiler / disminución de alquiler (es decir, pago de alquiler suspendido o disminuido) / Grève du loyer / diminution du loyer (c.-à-d. Suspension ou diminution du paiement du loyer) / 租金罢工/租金减少（即暂停或减少的租金支付）
