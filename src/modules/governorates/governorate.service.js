'use strict';

const { notFound, conflict } = require('../../shared/http/problem');

class GovernorateService {
  constructor(repository) { this.repository = repository; }
  list(query) { return this.repository.list({ page: query.page, size: query.size, q: query.q }); }
  async get(id) { const item = await this.repository.findById(id); if (!item) throw notFound('Governorate was not found.'); return item; }
  async villages(id, query, villagesRepository) {
    await this.get(id);
    return villagesRepository.listPublished({ ...query, governorate_id: id });
  }
  async create(input) { return this.repository.create(input); }
  async update(id, input) { await this.get(id); return this.repository.update(id, input); }
  async remove(id) {
    await this.get(id);
    try { await this.repository.remove(id); }
    catch (error) { if (error.code === 'GOVERNORATE_IN_USE') throw conflict('Governorate is referenced by one or more villages.', 'RESOURCE_IN_USE'); throw error; }
  }
}
module.exports = { GovernorateService };
