'use strict';
function mapGovernorate(row) { if (!row) return row; const dto = { id: String(row.id), name_ar: row.name_ar, name_en: row.name_en ?? null }; return dto; }
function mapPage(result) { return { ...result, data: (result.data || []).map(mapGovernorate) }; }
module.exports = { mapGovernorate, mapPage };
