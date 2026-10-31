'use strict';

const { idParamSchema, listQuerySchema, createVillageSchema, replaceVillageSchema, patchVillageSchema, deletedVillageQuerySchema } = require('./village.dto');
const { badRequest } = require('../../shared/http/problem');
const { mapVillage, mapPage } = require('./village.mapper');

function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) throw badRequest('Request validation failed.', result.error.issues.map(({ path, message, code }) => ({ path: path.join('.'), message, code })));
  return result.data;
}

const villageResponse = ({ data }) => ({ data: mapVillage(data) });
class VillageController {
  constructor(service) { this.service = service; }
  list = async (req, res) => res.status(200).json(mapPage(await this.service.list(parse(listQuerySchema, req.query)), mapVillage));
  listDeleted = async (req, res) => res.status(200).json(mapPage(await this.service.listDeleted(parse(deletedVillageQuerySchema, req.query)), mapVillage));
  get = async (req, res) => res.status(200).json(villageResponse({ data: await this.service.get(parse(idParamSchema, req.params).id) }));
  overview = async (req, res) => res.status(200).json(villageResponse({ data: await this.service.overview(parse(idParamSchema, req.params).id) }));
  create = async (req, res) => {
    const result = await this.service.createDraft(parse(createVillageSchema, req.body), req.user.id);
    res.location(`/api/v1/villages/${result.village.id}`).status(201).json({ data: { ...mapVillage(result.village), pending_version_id: String(result.version.id) } });
  };
  replace = async (req, res) => res.status(202).json({ data: await this.service.proposeUpdate(parse(idParamSchema, req.params).id, parse(replaceVillageSchema, req.body), req.user.id, { replace: true }) });
  patch = async (req, res) => res.status(202).json({ data: await this.service.proposeUpdate(parse(idParamSchema, req.params).id, parse(patchVillageSchema, req.body), req.user.id) });
  remove = async (req, res) => { await this.service.softDelete(parse(idParamSchema, req.params).id, req.user.id); res.status(204).end(); };
  restore = async (req, res) => res.status(200).json(villageResponse({ data: await this.service.restore(parse(idParamSchema, req.params).id, req.user.id) }));
}

module.exports = { VillageController, parse };
