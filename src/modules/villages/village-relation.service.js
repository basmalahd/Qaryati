'use strict';
const { notFound, conflict, unprocessable } = require('../../shared/http/problem');
class VillageRelationService {
  constructor({ villages, relations, audit }) { Object.assign(this, { villages, relations, audit }); }
  async list(villageId) { if (!(await this.villages.findPublishedById(villageId))) throw notFound('Village was not found.'); return this.relations.listPublishedForVillage(villageId); }
  async create(villageId, nearbyId, actorId) {
    if (villageId === nearbyId) throw unprocessable('A village cannot be related to itself.');
    const [a, b] = await Promise.all([this.villages.findPublishedById(villageId), this.villages.findPublishedById(nearbyId)]);
    if (!a || !b) throw notFound('Both villages must be published.');
    const pair = { village_id: Math.min(villageId, nearbyId), nearby_village_id: Math.max(villageId, nearbyId) };
    try { const row = await this.relations.create(pair); await this.audit.record({ user_id: actorId, entity_type: 'VillageRelation', entity_id: pair.village_id, action: 'CREATE', new_value: pair }); return row; }
    catch (error) { if (error.code === 'UNIQUE_VILLAGE_RELATION') throw conflict('These villages are already related.', 'DUPLICATE_VILLAGE_RELATION'); throw error; }
  }
  async remove(villageId, nearbyId, actorId) {
    const pair = { village_id: Math.min(villageId, nearbyId), nearby_village_id: Math.max(villageId, nearbyId) };
    const row = await this.relations.find(pair); if (!row) throw notFound('Village relation was not found.');
    await this.relations.remove(pair); await this.audit.record({ user_id: actorId, entity_type: 'VillageRelation', entity_id: pair.village_id, action: 'DELETE', old_value: row });
  }
}
module.exports = { VillageRelationService };
