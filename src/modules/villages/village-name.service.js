'use strict';
const { notFound, conflict } = require('../../shared/http/problem');

class VillageNameService {
  constructor({ villages, names, audit, transaction, clock = () => new Date() }) {
    Object.assign(this, { villages, names, audit, transaction, clock });
  }

  async list(villageId, filters) {
    if (!(await this.villages.findPublishedById(villageId))) throw notFound('Village was not found.');
    return this.names.listActive(villageId, filters);
  }

  async get(villageId, id) {
    const row = await this.names.findActive(villageId, id);
    if (!row) throw notFound('Village name was not found.');
    return row;
  }

  async write(work) {
    if (!this.transaction) throw new Error('A transactional unit of work is required for audited village-name changes.');
    return this.transaction(work);
  }

  async create(villageId, input, actorId) {
    if (!(await this.villages.findPublishedById(villageId))) throw notFound('Village was not found.');
    try {
      return await this.write(async (tx) => {
        const row = await tx.names.create({ ...input, village_id: villageId });
        await tx.audit.record({ user_id: actorId, entity_type: 'VillageName', entity_id: row.id, action: 'CREATE', new_value: input });
        return row;
      });
    } catch (error) {
      if (error.code === 'UNIQUE_VILLAGE_NAME') throw conflict('This name and language already exist for the village.', 'DUPLICATE_VILLAGE_NAME');
      throw error;
    }
  }

  async update(villageId, id, input, actorId) {
    const old = await this.get(villageId, id);
    try {
      return await this.write(async (tx) => {
        const row = await tx.names.update(villageId, id, input);
        await tx.audit.record({ user_id: actorId, entity_type: 'VillageName', entity_id: id, action: 'UPDATE', old_value: old, new_value: row });
        return row;
      });
    } catch (error) {
      if (error.code === 'UNIQUE_VILLAGE_NAME') throw conflict('This name and language already exist for the village.', 'DUPLICATE_VILLAGE_NAME');
      throw error;
    }
  }

  async remove(villageId, id, actorId) {
    const old = await this.get(villageId, id);
    return this.write(async (tx) => {
      await tx.names.softDelete(villageId, id, actorId, this.clock());
      await tx.audit.record({ user_id: actorId, entity_type: 'VillageName', entity_id: id, action: 'DELETE', old_value: old });
    });
  }

  async restore(villageId, id, actorId) {
    const old = await this.names.findDeleted(villageId, id);
    if (!old) throw notFound('Deleted village name was not found.');
    try {
      return await this.write(async (tx) => {
        const row = await tx.names.restore(villageId, id, this.clock());
        await tx.audit.record({ user_id: actorId, entity_type: 'VillageName', entity_id: id, action: 'RESTORE', old_value: old, new_value: row });
        return row;
      });
    } catch (error) {
      if (error.code === 'UNIQUE_VILLAGE_NAME') throw conflict('An active name with this language already exists.', 'DUPLICATE_VILLAGE_NAME');
      throw error;
    }
  }
}

module.exports = { VillageNameService };
