'use strict';

const { notFound, badRequest, conflict, unprocessable } = require('../../shared/http/problem');

function validateReferenceDate(value, precision) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw unprocessable('reference_date must be a real calendar date in YYYY-MM-DD format.');
  }
  const year = Number(value.slice(0, 4));
  if (year < 1800 || year > new Date().getUTCFullYear()) throw unprocessable('reference_date must be between 1800 and the current year.');
  if (precision === 'YEAR' && !value.endsWith('-01-01')) throw unprocessable('YEAR precision requires January 1.');
  if (precision === 'MONTH' && !value.endsWith('-01')) throw unprocessable('MONTH precision requires the first day of a month.');
}

class PopulationService {
  constructor({ villages, records, versions, sources, audit, transaction, clock = () => new Date() }) {
    Object.assign(this, { villages, records, versions, sources, audit, transaction, clock });
  }

  async assertParent(villageId, { editor = false } = {}) {
    const village = editor ? await this.villages.findForEditor(villageId) : await this.villages.findPublishedById(villageId);
    if (!village || village.deleted_at || (!editor && village.verification_status !== 'VERIFIED')) throw notFound('Village was not found.');
    return village;
  }

  async list(villageId, filters) {
    await this.assertParent(villageId);
    if (filters.from_date && filters.to_date && filters.from_date > filters.to_date) throw badRequest('from_date must be less than or equal to to_date.');
    if (filters.from_year && filters.to_year && filters.from_year > filters.to_year) throw badRequest('from_year must be less than or equal to to_year.');
    const from_date = filters.from_date || (filters.from_year ? `${filters.from_year}-01-01` : undefined);
    const to_date = filters.to_date || (filters.to_year ? `${filters.to_year}-12-31` : undefined);
    return this.records.listPublishedByVillage(villageId, { ...filters, from_date, to_date, sort: [{ field: 'reference_date', direction: 'desc' }] });
  }

  async get(villageId, id) {
    await this.assertParent(villageId);
    const record = await this.records.findPublishedById(villageId, id);
    if (!record || record.deleted_at || record.verification_status !== 'VERIFIED') throw notFound('Population record was not found.');
    return record;
  }

  async latest(villageId) {
    await this.assertParent(villageId);
    const record = await this.records.findLatestPublished(villageId);
    if (!record) throw notFound('No published population record was found.');
    return record;
  }

  async create(villageId, input, actorId) {
    await this.assertParent(villageId, { editor: true });
    validateReferenceDate(input.reference_date, input.reference_precision);
    if (!(await this.sources.isActive(input.source_id))) throw unprocessable('source_id must identify an active source.');
    try {
      if (!this.transaction) throw new Error('A transactional unit of work is required for population draft creation.');
      return await this.transaction(async (tx) => {
        const record = await tx.records.createPendingBase({ ...input, village_id: villageId, verification_status: 'PENDING', created_at: this.clock(), updated_at: this.clock() });
        const version = await tx.versions.createPending({ entity_type: 'PopulationRecord', entity_id: record.id, data_snapshot: input, submitted_by: actorId });
        await tx.audit.record({ user_id: actorId, entity_type: 'PopulationRecord', entity_id: record.id, action: 'CREATE', new_value: input });
        return { record, version };
      });
    } catch (error) {
      if (error.code === 'UNIQUE_POPULATION_RECORD') throw conflict('A population record already exists for this village, date and source.', 'DUPLICATE_POPULATION_RECORD');
      if (error.code === 'PENDING_VERSION_EXISTS') throw conflict('A pending version already exists for this record.', 'PENDING_VERSION_EXISTS');
      throw error;
    }
  }

  async propose(villageId, id, input, actorId, { replace = false } = {}) {
    await this.assertParent(villageId, { editor: true });
    const current = await this.records.findForEditor(villageId, id);
    if (!current || current.deleted_at) throw notFound('Population record was not found.');
    const pending = await this.versions.findPending('PopulationRecord', id);
    if (pending) throw conflict('A pending version already exists for this record.', 'PENDING_VERSION_EXISTS');
    const snapshot = replace ? input : { ...current, ...input };
    validateReferenceDate(snapshot.reference_date, snapshot.reference_precision);
    if (snapshot.source_id !== current.source_id && snapshot.source_id && !(await this.sources.isActive(snapshot.source_id))) throw unprocessable('A newly selected source must be active.');
    if (!this.transaction) throw new Error('A transactional unit of work is required for a population proposal.');
    return this.transaction(async (tx) => {
      const version = await tx.versions.createPending({ entity_type: 'PopulationRecord', entity_id: id, data_snapshot: snapshot, submitted_by: actorId });
      await tx.audit.record({ user_id: actorId, entity_type: 'PopulationRecord', entity_id: id, action: 'UPDATE', old_value: current, new_value: snapshot });
      return { entity_type: 'POPULATION_RECORD', entity_id: String(id), version_id: String(version.id), status: version.status };
    });
  }

  async softDelete(villageId, id, actorId) {
    await this.assertParent(villageId, { editor: true });
    const current = await this.records.findForEditor(villageId, id);
    if (!current || current.deleted_at) throw notFound('Population record was not found.');
    if (!this.transaction) throw new Error('A transactional unit of work is required for audited population deletion.');
    await this.transaction(async (tx) => { await tx.records.softDelete(villageId, id, actorId, this.clock()); await tx.audit.record({ user_id: actorId, entity_type: 'PopulationRecord', entity_id: id, action: 'DELETE', old_value: current }); });
  }

  async restore(villageId, id, actorId) {
    await this.assertParent(villageId, { editor: true });
    const current = await this.records.findForEditor(villageId, id);
    if (!current || !current.deleted_at) throw notFound('Deleted population record was not found.');
    if (!this.transaction) throw new Error('A transactional unit of work is required for audited population restore.');
    return this.transaction(async (tx) => { const restored = await tx.records.restore(villageId, id, this.clock()); await tx.audit.record({ user_id: actorId, entity_type: 'PopulationRecord', entity_id: id, action: 'RESTORE', old_value: current, new_value: restored }); return restored; });
  }
}

module.exports = { PopulationService, validateReferenceDate };
