'use strict';

const VILLAGE_FIELDS = Object.freeze(['id', 'current_name_ar', 'current_name_en', 'name_origin', 'location_description', 'latitude', 'longitude', 'elevation', 'land_area', 'historical_overview', 'governorate_id', 'source_id', 'verification_status', 'created_at', 'updated_at']);
function mapVillage(row) {
  if (!row) return row;
  const dto = Object.fromEntries(VILLAGE_FIELDS.filter((field) => row[field] !== undefined).map((field) => [field, row[field]]));
  for (const field of ['id', 'governorate_id', 'source_id']) if (dto[field] != null) dto[field] = String(dto[field]);
  return dto;
}
// The overview keeps the village fields and nests related collections; ids become strings.
const stringifyIds = (row) => (Array.isArray(row) ? row.map(stringifyIds) : row && typeof row === 'object' && !(row instanceof Date)
  ? Object.fromEntries(Object.entries(row).map(([k, v]) => [k, (k === 'id' || k.endsWith('_id')) && v != null && typeof v !== 'object' ? String(v) : stringifyIds(v)]))
  : row);
function mapOverview(row) { return row ? stringifyIds(row) : row; }
function mapPage(result, mapper) { return { ...result, data: (result.data || []).map(mapper) }; }
module.exports = { mapVillage, mapOverview, mapPage };
