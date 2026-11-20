'use strict';
const { parse } = require('../villages/village.controller');
const { governorateIdSchema, governorateListQuerySchema, governorateSchema } = require('./governorate.dto');
const { mapGovernorate, mapPage } = require('./governorate.mapper');
const { mapVillage, mapPage: mapVillagePage } = require('../villages/village.mapper');
const { listQuerySchema: villageListQuerySchema } = require('../villages/village.dto');
class GovernorateController {
  constructor(service, villages) { this.service = service; this.villages = villages; }
  list = async (req, res) => res.status(200).json(mapPage(await this.service.list(parse(governorateListQuerySchema, req.query))));
  get = async (req, res) => res.status(200).json({ data: mapGovernorate(await this.service.get(parse(governorateIdSchema, req.params).id)) });
  villagesList = async (req, res) => res.status(200).json(mapVillagePage(await this.service.villages(parse(governorateIdSchema, req.params).id, parse(villageListQuerySchema, req.query), this.villages), mapVillage));
  create = async (req, res) => { const data = mapGovernorate(await this.service.create(parse(governorateSchema, req.body))); res.location(`/api/v1/governorates/${data.id}`).status(201).json({ data }); };
  update = async (req, res) => res.status(200).json({ data: mapGovernorate(await this.service.update(parse(governorateIdSchema, req.params).id, parse(governorateSchema, req.body))) });
  remove = async (req, res) => { await this.service.remove(parse(governorateIdSchema, req.params).id); res.status(204).end(); };
}
module.exports = { GovernorateController };
