'use strict';

const { notFound, conflict, unprocessable } = require('../../shared/http/problem');

const dateOnly = (value) => (value == null ? value : new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`));
const big = (value) => (value == null ? value : BigInt(value));

const VILLAGE_FIELDS = ['current_name_ar', 'current_name_en', 'name_origin', 'location_description', 'latitude', 'longitude', 'elevation', 'land_area', 'historical_overview'];

// Maps an approved snapshot onto the live row. Only whitelisted columns are applied,
// so a snapshot can never overwrite ids, audit columns or verification state.
const APPLIERS = {
  Village: (snapshot) => {
    const data = {};
    for (const key of VILLAGE_FIELDS) if (snapshot[key] !== undefined) data[key] = snapshot[key];
    if (snapshot.governorate_id != null) data.governorate_id = big(snapshot.governorate_id);
    if (snapshot.source_id !== undefined) data.source_id = big(snapshot.source_id);
    return { model: 'village', data };
  },
  PopulationRecord: (snapshot) => ({
    model: 'populationRecord',
    data: {
      population_value: big(snapshot.population_value),
      reference_date: dateOnly(snapshot.reference_date),
      reference_precision: snapshot.reference_precision,
      source_id: big(snapshot.source_id),
    },
  }),
};

class ReviewService {
  constructor({ prisma, clock = () => new Date() }) {
    this.prisma = prisma;
    this.clock = clock;
  }

  async listPending({ page = 1, size = 20, entity_type }) {
    const where = { status: 'PENDING', ...(entity_type && { entity_type }) };
    const [rows, total] = await Promise.all([
      this.prisma.contentVersion.findMany({ where, orderBy: { id: 'asc' }, take: size, skip: (page - 1) * size }),
      this.prisma.contentVersion.count({ where }),
    ]);
    return { data: rows, meta: { page, size, total_items: total, total_pages: Math.ceil(total / size) } };
  }

  async get(id) {
    const row = await this.prisma.contentVersion.findUnique({ where: { id: big(id) } });
    if (!row) throw notFound('Version was not found.');
    return row;
  }

  // Approval is atomic: claim the PENDING row, apply the snapshot, audit - or nothing.
  async approve(id, reviewerId) {
    return this.#review(id, reviewerId, async (tx, version) => {
      const applier = APPLIERS[version.entity_type];
      if (!applier) throw unprocessable(`Entity type ${version.entity_type} is not reviewable yet.`);
      const { model, data } = applier(version.data_snapshot);
      try {
        await tx[model].update({ where: { id: version.entity_id }, data: { ...data, verification_status: 'VERIFIED', updated_at: this.clock() } });
      } catch (error) {
        if (error.code === 'P2002') throw conflict('Approving this version would duplicate an existing record.', 'DUPLICATE_RECORD');
        throw error;
      }
      const reviewed = await tx.contentVersion.update({ where: { id: version.id }, data: { status: 'VERIFIED', reviewed_by: big(reviewerId), reviewed_at: this.clock() } });
      await this.#audit(tx, reviewerId, version, 'VERIFY', null, version.data_snapshot);
      return reviewed;
    });
  }

  async reject(id, reviewerId, reason) {
    return this.#review(id, reviewerId, async (tx, version) => {
      const reviewed = await tx.contentVersion.update({ where: { id: version.id }, data: { status: 'REJECTED', reviewed_by: big(reviewerId), reviewed_at: this.clock(), rejection_reason: reason } });
      // A rejected *first* version means the draft entity itself was never accepted.
      if (version.version_number === 1 && APPLIERS[version.entity_type]) {
        await tx[APPLIERS[version.entity_type]({}).model].update({ where: { id: version.entity_id }, data: { verification_status: 'REJECTED' } });
      }
      await this.#audit(tx, reviewerId, version, 'REJECT', version.data_snapshot, { reason });
      return reviewed;
    });
  }

  async #review(id, reviewerId, work) {
    const existing = await this.get(id);
    if (existing.status !== 'PENDING') throw conflict('This version has already been reviewed.', 'VERSION_ALREADY_REVIEWED');
    if (String(existing.submitted_by) === String(reviewerId)) throw conflict('You cannot review a version you submitted.', 'SELF_REVIEW_FORBIDDEN');
    return this.prisma.$transaction(async (tx) => {
      // Row lock: a second reviewer waits here, then sees the version is no longer PENDING.
      const locked = await tx.$queryRaw`SELECT id FROM "ContentVersion" WHERE id = ${existing.id} AND status = 'PENDING' FOR UPDATE`;
      if (!locked.length) throw conflict('This version has already been reviewed.', 'VERSION_ALREADY_REVIEWED');
      const fresh = await tx.contentVersion.findUnique({ where: { id: existing.id } });
      return work(tx, fresh);
    }, { timeout: 10000 });
  }

  #audit(tx, userId, version, action, oldValue, newValue) {
    const text = (v) => (v == null ? null : JSON.stringify(v));
    return tx.auditLog.create({ data: { user_id: big(userId), entity_type: version.entity_type, entity_id: version.entity_id, action, old_value: text(oldValue), new_value: text(newValue) } });
  }
}

module.exports = { ReviewService };
