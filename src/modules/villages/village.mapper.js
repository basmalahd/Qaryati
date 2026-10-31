'use strict';

const VILLAGE_FIELDS = Object.freeze(['id', 'current_name_ar', 'current_name_en', 'name_origin', 'location_description', 'latitude', 'longitude', 'elevation', 'land_area', 'historical_overview', 'governorate_id', 'source_id', 'verification_status', 'created_at', 'updated_at']);
function mapVillage(row) {
  if (!row) return row;
  const dto = Object.fromEntries(VILLAGE_FIELDS.filter((field) => row[field] !== undefined).map((field) => [field, row[field]]));
  for (const field of ['id', 'governorate_id', 'source_id']) if (dto[field] != null) dto[field] = String(dto[field]);
  return dto;
}
function mapPage(result, mapper) { return { ...result, data: (result.data || []).map(mapper) }; }
module.exports = { mapVillage, mapPage };
