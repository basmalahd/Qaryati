'use strict';

// In-memory adapters for the village/population module while Prisma is being built.
// They deliberately implement the repository interfaces consumed by the services.
function createVillageMocks(seed = {}) {
  const villages = (seed.villages || []).map((row) => ({ ...row }));
  const governorates = (seed.governorates || []).map((row) => ({ ...row }));
  const names = (seed.names || []).map((row) => ({ ...row }));
  const populationRecords = (seed.populationRecords || []).map((row) => ({ ...row }));
  const pendingVersions = (seed.versions || []).map((row) => ({ ...row }));
  const sources = (seed.sources || []).map((row) => ({ ...row }));
  const relations = (seed.relations || []).map((row) => ({ ...row }));
  const landmarks = (seed.landmarks || []).map((row) => ({ ...row }));
  let nextVillageId = Math.max(0, ...villages.map((v) => v.id)) + 1;
  let nextNameId = Math.max(0, ...names.map((v) => v.id)) + 1;
  let nextPopulationId = Math.max(0, ...populationRecords.map((v) => v.id)) + 1;
  let nextVersionId = Math.max(0, ...pendingVersions.map((v) => v.id)) + 1;
  const auditEntries = [];
  const paginate = (rows, page = 1, size = 20) => { const totalPages = Math.ceil(rows.length / size); const params = `page=${page}&size=${size}`; return { data: rows.slice((page - 1) * size, page * size), meta: { page, size, total_items: rows.length, total_pages: totalPages }, links: { self: `?${params}`, next: page < totalPages ? `?page=${page + 1}&size=${size}` : null, prev: page > 1 ? `?page=${page - 1}&size=${size}` : null } }; };
  const villageRepo = {
    listPublished: async (q) => {
      let rows = villages.filter((v) => v.verification_status === 'VERIFIED' && !v.deleted_at);
      if (q.governorate_id) rows = rows.filter((v) => v.governorate_id === q.governorate_id);
      if (q.has_landmarks != null) rows = rows.filter((v) => (landmarks.some((item) => item.village_id === v.id && item.verification_status === 'VERIFIED' && !item.deleted_at)) === (q.has_landmarks === 'true'));
      if (q.q) { const term = q.q.toLocaleLowerCase(); rows = rows.filter((v) => [v.current_name_ar, v.current_name_en, ...names.filter((n) => n.village_id === v.id && !n.deleted_at).map((n) => n.name)].some((name) => name && name.toLocaleLowerCase().includes(term))); }
      if (q.min_population != null || q.max_population != null) rows = rows.filter((v) => { const latest = populationRecords.filter((r) => r.village_id === v.id && r.verification_status === 'VERIFIED' && !r.deleted_at).sort((a, b) => b.reference_date.localeCompare(a.reference_date))[0]?.population_value; return latest != null && (q.min_population == null || latest >= q.min_population) && (q.max_population == null || latest <= q.max_population); });
      for (const { field, direction } of [...(q.sort || [])].reverse()) rows.sort((a, b) => { const av = field === 'population' ? populationRecords.filter((r) => r.village_id === a.id && r.verification_status === 'VERIFIED' && !r.deleted_at).sort((x, y) => y.reference_date.localeCompare(x.reference_date))[0]?.population_value : a[field]; const bv = field === 'population' ? populationRecords.filter((r) => r.village_id === b.id && r.verification_status === 'VERIFIED' && !r.deleted_at).sort((x, y) => y.reference_date.localeCompare(x.reference_date))[0]?.population_value : b[field]; return (av > bv ? 1 : av < bv ? -1 : 0) * (direction === 'desc' ? -1 : 1); });
      return paginate(rows, q.page, q.size);
    },
    listDeleted: async (q) => paginate(villages.filter((v) => v.deleted_at), q.page, q.size),
    findPublishedById: async (id) => villages.find((v) => v.id === id && v.verification_status === 'VERIFIED' && !v.deleted_at) || null,
    findForEditor: async (id) => villages.find((v) => v.id === id) || null,
    createDraft: async (input) => { const row = { ...input, id: nextVillageId++ }; villages.push(row); return row; },
    sourceIsActive: async (id) => sources.some((s) => s.id === id && s.status === 'ACTIVE'),
    getPublishedOverview: async (id) => ({ village_id: id, names: names.filter((n) => n.village_id === id && !n.deleted_at), latest_population: populationRecords.filter((r) => r.village_id === id && r.verification_status === 'VERIFIED' && !r.deleted_at).sort((a, b) => b.reference_date.localeCompare(a.reference_date))[0] || null }),
    softDelete: async (id, actor, at) => { const row = villages.find((v) => v.id === id); row.deleted_at = at; row.deleted_by = actor; return row; },
    restore: async (id, at) => { const row = villages.find((v) => v.id === id); row.deleted_at = null; row.deleted_by = null; row.updated_at = at; return row; },
  };
  const versionRepo = {
    findPending: async (type, id) => pendingVersions.find((v) => v.entity_type === type && v.entity_id === id && v.status === 'PENDING') || null,
    createPending: async (input) => { if (await versionRepo.findPending(input.entity_type, input.entity_id)) { const e = new Error('Pending version exists'); e.code = 'PENDING_VERSION_EXISTS'; throw e; } const previous = pendingVersions.filter((v) => v.entity_type === input.entity_type && v.entity_id === input.entity_id); const row = { ...input, id: nextVersionId++, version_number: Math.max(0, ...previous.map((v) => v.version_number)) + 1, status: 'PENDING' }; pendingVersions.push(row); return row; },
  };
  const populationRepo = {
    listPublishedByVillage: async (id, q) => { let rows = populationRecords.filter((r) => r.village_id === id && r.verification_status === 'VERIFIED' && !r.deleted_at); if (q.from_date) rows = rows.filter((r) => r.reference_date >= q.from_date); if (q.to_date) rows = rows.filter((r) => r.reference_date <= q.to_date); if (q.source_id) rows = rows.filter((r) => r.source_id === q.source_id); rows.sort((a, b) => b.reference_date.localeCompare(a.reference_date) || b.id - a.id); return paginate(rows, q.page, q.size); },
    findPublishedById: async (villageId, id) => populationRecords.find((r) => r.village_id === villageId && r.id === id && r.verification_status === 'VERIFIED' && !r.deleted_at) || null,
    findLatestPublished: async (id) => populationRecords.filter((r) => r.village_id === id && r.verification_status === 'VERIFIED' && !r.deleted_at).sort((a, b) => b.reference_date.localeCompare(a.reference_date) || b.id - a.id)[0] || null,
    findForEditor: async (villageId, id) => populationRecords.find((r) => r.village_id === villageId && r.id === id) || null,
    createPendingBase: async (input) => { if (populationRecords.some((r) => r.village_id === input.village_id && r.reference_date === input.reference_date && r.source_id === input.source_id)) { const e = new Error('Duplicate population record'); e.code = 'UNIQUE_POPULATION_RECORD'; throw e; } const row = { ...input, id: nextPopulationId++ }; populationRecords.push(row); return row; },
    softDelete: async (villageId, id, actor, at) => { const row = await populationRepo.findForEditor(villageId, id); row.deleted_by = actor; row.deleted_at = at; },
    restore: async (villageId, id, at) => { const row = await populationRepo.findForEditor(villageId, id); row.deleted_by = null; row.deleted_at = null; row.updated_at = at; return row; },
  };
  const nameRepo = {
    listActive: async (id, filters = {}) => names.filter((n) => n.village_id === id && !n.deleted_at && (!filters.language || n.language === filters.language) && (!filters.name_type || n.name_type === filters.name_type)),
    findActive: async (villageId, id) => names.find((n) => n.village_id === villageId && n.id === id && !n.deleted_at) || null,
    findDeleted: async (villageId, id) => names.find((n) => n.village_id === villageId && n.id === id && n.deleted_at) || null,
    create: async (input) => { if (names.some((n) => n.village_id === input.village_id && n.name === input.name && n.language === input.language)) { const e = new Error('Duplicate name'); e.code = 'UNIQUE_VILLAGE_NAME'; throw e; } const row = { ...input, id: nextNameId++, deleted_at: null }; names.push(row); return row; },
    update: async (villageId, id, input) => { const row = await nameRepo.findActive(villageId, id); Object.assign(row, input); return row; },
    softDelete: async (villageId, id, actor, at) => { const row = await nameRepo.findActive(villageId, id); row.deleted_by = actor; row.deleted_at = at; },
    restore: async (villageId, id, at) => { const row = await nameRepo.findDeleted(villageId, id); if (names.some((n) => n !== row && n.village_id === villageId && n.name === row.name && n.language === row.language)) { const e = new Error('Duplicate name'); e.code = 'UNIQUE_VILLAGE_NAME'; throw e; } row.deleted_by = null; row.deleted_at = null; row.updated_at = at; return row; },
  };
  const governorateRepo = { exists: async (id) => governorates.some((g) => g.id === id), findById: async (id) => governorates.find((g) => g.id === id) || null, list: async ({ page, size, q }) => paginate(governorates.filter((g) => !q || `${g.name_ar} ${g.name_en || ''}`.toLowerCase().includes(q.toLowerCase())), page, size), create: async (input) => { const row = { ...input, id: Math.max(0, ...governorates.map((g) => g.id)) + 1 }; governorates.push(row); return row; }, update: async (id, input) => { const row = governorates.find((g) => g.id === id); Object.assign(row, input); return row; }, remove: async (id) => { if (villages.some((v) => v.governorate_id === id)) { const e = new Error('Governorate in use'); e.code = 'GOVERNORATE_IN_USE'; throw e; } governorates.splice(governorates.findIndex((g) => g.id === id), 1); } };
  const sourceRepo = { isActive: async (id) => sources.some((s) => s.id === id && s.status === 'ACTIVE') };
  const relationRepo = {
    listPublishedForVillage: async (id) => relations.filter((r) => r.village_id === id || r.nearby_village_id === id),
    find: async (pair) => relations.find((r) => r.village_id === pair.village_id && r.nearby_village_id === pair.nearby_village_id) || null,
    create: async (pair) => { if (await relationRepo.find(pair)) { const e = new Error('Duplicate relation'); e.code = 'UNIQUE_VILLAGE_RELATION'; throw e; } relations.push(pair); return pair; },
    remove: async (pair) => { const index = relations.findIndex((r) => r.village_id === pair.village_id && r.nearby_village_id === pair.nearby_village_id); relations.splice(index, 1); },
  };
  const auditRepo = { record: async (entry) => { auditEntries.push({ ...entry, timestamp: new Date() }); } };
  const adapters = { villages: villageRepo, governorates: governorateRepo, names: nameRepo, relations: relationRepo, records: populationRepo, versions: versionRepo, sources: sourceRepo, audit: auditRepo, state: { villages, governorates, names, relations, populationRecords, pendingVersions, auditEntries } };
  // In-memory operations share state. Production must supply Prisma $transaction instead.
  adapters.transaction = (work) => work(adapters);
  return adapters;
}

module.exports = { createVillageMocks };
