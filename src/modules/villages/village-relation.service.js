'use strict';
const { notFound, conflict, unprocessable } = require('../../shared/http/problem');

class VillageRelationService {
  constructor({ villages, relations, audit, transaction }) {
    Object.assign(this, { villages, relations, audit, transaction });
  }

  async list(villageId) {
    if (!(await this.villages.findPublishedById(villageId))) throw notFound('Village was not found.');
    return this.relations.listPublishedForVillage(villageId);
  }

  async write(work) {
    if (!this.transaction) throw new Error('A transactional unit of work is required for audited village-relation changes.');
    return this.transaction(work);
  }

  async create(villageId, nearbyId, actorId) {
    if (villageId === nearbyId) throw unprocessable('A village cannot be related to itself.');
    const [a, b] = await Promise.all([this.villages.findPublishedById(villageId), this.villages.findPublishedById(nearbyId)]);
    if (!a || !b) throw notFound('Both villages must be published.');
    const pair = { village_id: Math.min(villageId, nearbyId), nearby_village_id: Math.max(villageId, nearbyId) };
    try {
      return await this.write(async (tx) => {
        const row = await tx.relations.create(pair);
        await tx.audit.record({ user_id: actorId, entity_type: 'VillageRelation', entity_id: pair.village_id, action: 'CREATE', new_value: pair });
        return row;
      });
    } catch (error) {
      if (error.code === 'UNIQUE_VILLAGE_RELATION') throw conflict('These villages are already related.', 'DUPLICATE_VILLAGE_RELATION');
      throw error;
    }
  }

  async remove(villageId, nearbyId, actorId) {
    const pair = { village_id: Math.min(villageId, nearbyId), nearby_village_id: Math.max(villageId, nearbyId) };
    const row = await this.relations.find(pair);
    if (!row) throw notFound('Village relation was not found.');
    return this.write(async (tx) => {
      await tx.relations.remove(pair);
      await tx.audit.record({ user_id: actorId, entity_type: 'VillageRelation', entity_id: pair.village_id, action: 'DELETE', old_value: row });
    });
  }
}

module.exports = { VillageRelationService };
