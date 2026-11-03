'use strict';
const FIELDS = Object.freeze(['id', 'village_id', 'population_value', 'reference_date', 'reference_precision', 'source_id', 'verification_status', 'created_at', 'updated_at']);
function mapPopulationRecord(row) {
  if (!row) return row;
  const dto = Object.fromEntries(FIELDS.filter((field) => row[field] !== undefined).map((field) => [field, row[field]]));
  for (const field of ['id', 'village_id', 'source_id', 'population_value']) if (dto[field] != null) dto[field] = String(dto[field]);
  if (dto.reference_date instanceof Date) dto.reference_date = dto.reference_date.toISOString().slice(0, 10);
  return dto;
}
function mapPage(result) { return { ...result, data: (result.data || []).map(mapPopulationRecord) }; }
module.exports = { mapPopulationRecord, mapPage };
