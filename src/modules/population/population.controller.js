'use strict';
const { parse } = require('../villages/village.controller');
const { populationIdSchema, populationListSchema, createPopulationSchema, replacePopulationSchema, patchPopulationSchema } = require('./population.dto');
const { mapPopulationRecord, mapPage } = require('./population.mapper');
class PopulationController {
  constructor(service) { this.service = service; }
  list = async (req, res) => { const p = parse(populationIdSchema, req.params); res.status(200).json(mapPage(await this.service.list(p.villageId, parse(populationListSchema, req.query)))); };
  latest = async (req, res) => { const p = parse(populationIdSchema, req.params); res.status(200).json({ data: mapPopulationRecord(await this.service.latest(p.villageId)) }); };
  get = async (req, res) => { const p = parse(populationIdSchema, req.params); res.status(200).json({ data: mapPopulationRecord(await this.service.get(p.villageId, p.id)) }); };
  create = async (req, res) => { const p = parse(populationIdSchema, req.params); const result = await this.service.create(p.villageId, parse(createPopulationSchema, req.body), req.user.id); res.location(`/api/v1/villages/${p.villageId}/population-records/${result.record.id}`).status(201).json({ data: { ...mapPopulationRecord(result.record), pending_version_id: String(result.version.id) } }); };
  replace = async (req, res) => { const p = parse(populationIdSchema, req.params); res.status(202).json({ data: await this.service.propose(p.villageId, p.id, parse(replacePopulationSchema, req.body), req.user.id, { replace: true }) }); };
  patch = async (req, res) => { const p = parse(populationIdSchema, req.params); res.status(202).json({ data: await this.service.propose(p.villageId, p.id, parse(patchPopulationSchema, req.body), req.user.id) }); };
  remove = async (req, res) => { const p = parse(populationIdSchema, req.params); await this.service.softDelete(p.villageId, p.id, req.user.id); res.status(204).end(); };
  restore = async (req, res) => { const p = parse(populationIdSchema, req.params); res.status(200).json({ data: await this.service.restore(p.villageId, p.id, req.user.id) }); };
}
module.exports = { PopulationController };
