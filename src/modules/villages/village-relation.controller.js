'use strict';
const { parse } = require('./village.controller'); const { relationParamsSchema, relationBodySchema } = require('./village-relation.dto');
class VillageRelationController {
  constructor(service) { this.service = service; }
  list = async (req, res) => { const p = parse(relationParamsSchema, req.params); const rows = await this.service.list(p.villageId); res.status(200).json({ data: rows.map((row) => ({ village_id: String(row.village_id), nearby_village_id: String(row.nearby_village_id) })) }); };
  create = async (req, res) => { const p = parse(relationParamsSchema, req.params); const b = parse(relationBodySchema, req.body); const row = await this.service.create(p.villageId, b.nearby_village_id, req.user.id); res.status(201).json({ data: { village_id: String(row.village_id), nearby_village_id: String(row.nearby_village_id) } }); };
  remove = async (req, res) => { const p = parse(relationParamsSchema, req.params); await this.service.remove(p.villageId, p.nearbyVillageId, req.user.id); res.status(204).end(); };
}
module.exports = { VillageRelationController };
