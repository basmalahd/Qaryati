'use strict';
const { parse } = require('./village.controller');
const { nameSchema, nameParamsSchema, nameQuerySchema } = require('./village-name.dto');
const NAME_FIELDS = ['id', 'village_id', 'name', 'language', 'name_type', 'created_at', 'updated_at'];
const mapName = (row) => Object.fromEntries(NAME_FIELDS.filter((key) => row[key] !== undefined).map((key) => [key, ['id', 'village_id'].includes(key) && row[key] != null ? String(row[key]) : row[key]]));
class VillageNameController {
  constructor(service) { this.service = service; }
  list = async (req, res) => { const p = parse(nameParamsSchema, req.params); res.status(200).json({ data: (await this.service.list(p.villageId, parse(nameQuerySchema, req.query))).map(mapName) }); };
  get = async (req, res) => { const p = parse(nameParamsSchema, req.params); res.status(200).json({ data: mapName(await this.service.get(p.villageId, p.id)) }); };
  create = async (req, res) => { const p = parse(nameParamsSchema, req.params); const data = await this.service.create(p.villageId, parse(nameSchema, req.body), req.user.id); res.status(201).json({ data: mapName(data) }); };
  replace = async (req, res) => { const p = parse(nameParamsSchema, req.params); res.status(200).json({ data: mapName(await this.service.update(p.villageId, p.id, parse(nameSchema, req.body), req.user.id)) }); };
  patch = async (req, res) => { const p = parse(nameParamsSchema, req.params); const body = parse(nameSchema.partial().strict().refine((v) => Object.keys(v).length > 0), req.body); res.status(200).json({ data: mapName(await this.service.update(p.villageId, p.id, body, req.user.id)) }); };
  remove = async (req, res) => { const p = parse(nameParamsSchema, req.params); await this.service.remove(p.villageId, p.id, req.user.id); res.status(204).end(); };
  restore = async (req, res) => { const p = parse(nameParamsSchema, req.params); res.status(200).json({ data: mapName(await this.service.restore(p.villageId, p.id, req.user.id)) }); };
}
module.exports = { VillageNameController };
