'use strict';

const { badRequest, notFound, conflict, unprocessable } = require('../../shared/http/problem');
const { SORT_FIELDS } = require('./constants');

class VillageService {
  constructor({ villages, governorates, versions, audit, transaction, clock = () => new Date() }) {
    this.villages = villages;
    this.governorates = governorates;
    this.versions = versions;
    this.audit = audit;
    this.transaction = transaction;
    this.clock = clock;
  }

  async list(query) {
    if (query.min_population != null && query.max_population != null && query.min_population > query.max_population) {
      throw badRequest('min_population must be less than or equal to max_population.');
    }
    const sort = (query.sort || '-current_name_ar').split(',').map((term) => {
      const field = term.startsWith('-') ? term.slice(1) : term;
      if (!SORT_FIELDS.includes(field)) throw badRequest(`Unsupported sort field: ${field}.`);
      return { field, direction: term.startsWith('-') ? 'desc' : 'asc' };
    });
    return this.villages.listPublished({ ...query, sort });
  }

  listDeleted(query) { return this.villages.listDeleted(query); }

  async get(id) {
    const village = await this.villages.findPublishedById(id);
    if (!village) throw notFound('Village was not found.');
    return village;
  }

  async createDraft(input, actorId) {
    if (!(await this.governorates.exists(input.governorate_id))) throw unprocessable('governorate_id does not identify an existing governorate.');
    if (input.source_id != null && !(await this.villages.sourceIsActive(input.source_id))) throw unprocessable('source_id must identify an active source.');
    try {
      if (!this.transaction) throw new Error('A transactional unit of work is required for village draft creation.');
      return await this.transaction(async (tx) => {
        const village = await tx.villages.createDraft({ ...input, verification_status: 'PENDING', created_at: this.clock(), updated_at: this.clock() });
        const version = await tx.versions.createPending({ entity_type: 'Village', entity_id: village.id, data_snapshot: input, submitted_by: actorId });
        await tx.audit.record({ user_id: actorId, entity_type: 'Village', entity_id: village.id, action: 'CREATE', new_value: input });
        return { village, version };
      });
    } catch (error) {
      if (error.code === 'PENDING_VERSION_EXISTS') throw conflict('A pending version already exists for this village.', 'PENDING_VERSION_EXISTS');
      throw error;
    }
  }

  async proposeUpdate(id, patch, actorId, { replace = false } = {}) {
    const current = await this.villages.findForEditor(id);
    if (!current || current.deleted_at) throw notFound('Village was not found.');
    const pending = await this.versions.findPending('Village', id);
    if (pending) throw conflict('A pending version already exists for this village.', 'PENDING_VERSION_EXISTS');
    const snapshot = replace ? patch : { ...current, ...patch };
    if ((snapshot.latitude == null) !== (snapshot.longitude == null)) throw unprocessable('latitude and longitude must be supplied together.');
    if (!this.transaction) throw new Error('A transactional unit of work is required for a village proposal.');
    return this.transaction(async (tx) => {
      const version = await tx.versions.createPending({ entity_type: 'Village', entity_id: id, data_snapshot: snapshot, submitted_by: actorId });
      await tx.audit.record({ user_id: actorId, entity_type: 'Village', entity_id: id, action: 'UPDATE', old_value: current, new_value: snapshot });
      return { entity_type: 'VILLAGE', entity_id: String(id), version_id: String(version.id), status: version.status };
    });
  }

  async overview(id) {
    const village = await this.get(id);
    return this.villages.getPublishedOverview(village.id);
  }

  async softDelete(id, actorId) {
    const current = await this.villages.findForEditor(id);
    if (!current || current.deleted_at) throw notFound('Village was not found.');
    if (!this.transaction) throw new Error('A transactional unit of work is required for audited village deletion.');
    await this.transaction(async (tx) => { await tx.villages.softDelete(id, actorId, this.clock()); await tx.audit.record({ user_id: actorId, entity_type: 'Village', entity_id: id, action: 'DELETE', old_value: current }); });
  }

  async restore(id, actorId) {
    const current = await this.villages.findForEditor(id);
    if (!current || !current.deleted_at) throw notFound('Deleted village was not found.');
    if (!this.transaction) throw new Error('A transactional unit of work is required for audited village restore.');
    return this.transaction(async (tx) => { const restored = await tx.villages.restore(id, this.clock()); await tx.audit.record({ user_id: actorId, entity_type: 'Village', entity_id: id, action: 'RESTORE', old_value: current, new_value: restored }); return restored; });
  }
}

module.exports = { VillageService };
