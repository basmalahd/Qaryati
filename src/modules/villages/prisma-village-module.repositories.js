'use strict';

const { Prisma } = require('@prisma/client');

// ---------- value conversion ----------
// Services work with plain numbers/strings; Prisma works with BigInt/Decimal/Date.
const big = (value) => (value == null ? value : BigInt(value));
const dateOnly = (value) => (value == null ? value : new Date(`${value}T00:00:00.000Z`));

function norm(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(norm);
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, norm(v)]));
  return value;
}
const population = (row) => {
  if (!row) return null;
  const out = norm(row);
  out.reference_date = row.reference_date.toISOString().slice(0, 10);
  return out;
};
const plain = (row) => (row ? norm(row) : null);

const jsonSafe = (value) => (value === undefined ? null : JSON.parse(JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString() : v))));

function page(rows, total, { page: p = 1, size = 20 }) {
  const totalPages = Math.ceil(total / size);
  return {
    data: rows,
    meta: { page: p, size, total_items: total, total_pages: totalPages },
    links: {
      self: `?page=${p}&size=${size}`,
      next: p < totalPages ? `?page=${p + 1}&size=${size}` : null,
      prev: p > 1 ? `?page=${p - 1}&size=${size}` : null,
    },
  };
}
const withCode = (code, cause) => Object.assign(new Error(code), { code, cause });
const isUnique = (error) => error?.code === 'P2002';
const isForeignKey = (error) => error?.code === 'P2003';

const VILLAGE_COLUMNS = ['current_name_ar', 'current_name_en', 'name_origin', 'location_description', 'latitude', 'longitude', 'elevation', 'land_area', 'historical_overview'];
function villageData(input) {
  const data = {};
  for (const key of VILLAGE_COLUMNS) if (input[key] !== undefined) data[key] = input[key];
  if (input.governorate_id !== undefined) data.governorate_id = big(input.governorate_id);
  if (input.source_id !== undefined) data.source_id = big(input.source_id);
  return data;
}
const SORT_SQL = {
  current_name_ar: Prisma.raw('v.current_name_ar'),
  current_name_en: Prisma.raw('v.current_name_en'),
  created_at: Prisma.raw('v.created_at'),
  population: Prisma.raw('l.population_value'),
};
const escapeLike = (term) => term.replace(/[\\%_]/g, (c) => `\\${c}`);

// ---------- repositories (all take a Prisma client OR a transaction client) ----------
function createRepositories(db) {
  const villages = {
    // Native SQL: the "latest verified population" join, filtering, sorting and
    // pagination are expressed more clearly (and faster) in SQL than through the ORM.
    async listPublished(q) {
      const conditions = [Prisma.sql`v.deleted_at IS NULL`, Prisma.sql`v.verification_status = 'VERIFIED'`];
      if (q.governorate_id) conditions.push(Prisma.sql`v.governorate_id = ${BigInt(q.governorate_id)}`);
      if (q.q) {
        const like = `%${escapeLike(q.q)}%`;
        conditions.push(Prisma.sql`(v.current_name_ar ILIKE ${like} OR v.current_name_en ILIKE ${like} OR EXISTS (
          SELECT 1 FROM "VillageName" n WHERE n.village_id = v.id AND n.deleted_at IS NULL AND n.name ILIKE ${like}))`);
      }
      if (q.has_landmarks != null) {
        const exists = Prisma.sql`EXISTS (SELECT 1 FROM "Landmark" lm WHERE lm.village_id = v.id AND lm.deleted_at IS NULL AND lm.verification_status = 'VERIFIED')`;
        conditions.push(q.has_landmarks === 'true' ? exists : Prisma.sql`NOT ${exists}`);
      }
      if (q.min_population != null) conditions.push(Prisma.sql`l.population_value >= ${BigInt(q.min_population)}`);
      if (q.max_population != null) conditions.push(Prisma.sql`l.population_value <= ${BigInt(q.max_population)}`);
      const orderBy = Prisma.join([
        ...(q.sort || []).map(({ field, direction }) => Prisma.sql`${SORT_SQL[field]} ${Prisma.raw(direction === 'desc' ? 'DESC NULLS LAST' : 'ASC NULLS LAST')}`),
        Prisma.sql`v.id ASC`,
      ]);
      const size = q.size ?? 20;
      const pageNo = q.page ?? 1;
      const rows = await db.$queryRaw`
        WITH l AS (
          SELECT DISTINCT ON (village_id) village_id, population_value
          FROM "PopulationRecord"
          WHERE verification_status = 'VERIFIED' AND deleted_at IS NULL
          ORDER BY village_id, reference_date DESC, id DESC
        )
        SELECT v.id, COUNT(*) OVER() AS total
        FROM "Village" v LEFT JOIN l ON l.village_id = v.id
        WHERE ${Prisma.join(conditions, ' AND ')}
        ORDER BY ${orderBy}
        LIMIT ${size} OFFSET ${(pageNo - 1) * size}`;
      const total = rows.length ? Number(rows[0].total) : 0;
      const ids = rows.map((r) => r.id);
      const found = await db.village.findMany({ where: { id: { in: ids } } });
      const byId = new Map(found.map((v) => [v.id, v]));
      return page(ids.map((id) => plain(byId.get(id))), total, { page: pageNo, size });
    },
    async listDeleted(q) {
      const where = { deleted_at: { not: null } };
      const size = q.size ?? 20; const pageNo = q.page ?? 1;
      const [rows, total] = await Promise.all([
        db.village.findMany({ where, orderBy: { deleted_at: 'desc' }, take: size, skip: (pageNo - 1) * size }),
        db.village.count({ where }),
      ]);
      return page(rows.map(plain), total, { page: pageNo, size });
    },
    findPublishedById: async (id) => plain(await db.village.findFirst({ where: { id: big(id), deleted_at: null, verification_status: 'VERIFIED' } })),
    findForEditor: async (id) => plain(await db.village.findUnique({ where: { id: big(id) } })),
    async createDraft(input) {
      return plain(await db.village.create({ data: { ...villageData(input), verification_status: 'PENDING' } }));
    },
    async sourceIsActive(id) {
      return (await db.source.count({ where: { id: big(id), status: 'ACTIVE' } })) > 0;
    },
    async getPublishedOverview(id) {
      const where = { village_id: big(id), deleted_at: null, verification_status: 'VERIFIED' };
      const [village, names, latest, landmarks, heritage, agriculture, economy, facilities, events] = await Promise.all([
        db.village.findUnique({ where: { id: big(id) } }),
        db.villageName.findMany({ where: { village_id: big(id), deleted_at: null }, orderBy: { id: 'asc' } }),
        db.populationRecord.findFirst({ where, orderBy: [{ reference_date: 'desc' }, { id: 'desc' }] }),
        db.landmark.findMany({ where, orderBy: { id: 'asc' } }),
        db.heritageItem.findMany({ where, orderBy: { id: 'asc' } }),
        db.agricultureItem.findMany({ where, orderBy: { id: 'asc' } }),
        db.economicActivity.findMany({ where, orderBy: { id: 'asc' } }),
        db.publicFacility.findMany({ where, orderBy: { id: 'asc' } }),
        db.historicalEvent.findMany({ where, orderBy: [{ event_date: 'asc' }, { id: 'asc' }] }),
      ]);
      return {
        ...plain(village),
        names: names.map(plain),
        latest_population: population(latest),
        landmarks: landmarks.map(plain),
        heritage_items: heritage.map(plain),
        agriculture_items: agriculture.map(plain),
        economic_activities: economy.map(plain),
        public_facilities: facilities.map(plain),
        historical_events: events.map(plain),
      };
    },
    async softDelete(id, actor, at) {
      return plain(await db.village.update({ where: { id: big(id) }, data: { deleted_at: at, deleted_by: big(actor) } }));
    },
    async restore(id, at) {
      return plain(await db.village.update({ where: { id: big(id) }, data: { deleted_at: null, deleted_by: null, updated_at: at } }));
    },
  };

  const versions = {
    findPending: async (type, id) => plain(await db.contentVersion.findFirst({ where: { entity_type: type, entity_id: big(id), status: 'PENDING' } })),
    async createPending({ entity_type, entity_id, data_snapshot, submitted_by }) {
      const last = await db.contentVersion.aggregate({ where: { entity_type, entity_id: big(entity_id) }, _max: { version_number: true } });
      try {
        return plain(await db.contentVersion.create({
          data: { entity_type, entity_id: big(entity_id), version_number: (last._max.version_number ?? 0) + 1, data_snapshot: jsonSafe(data_snapshot), submitted_by: big(submitted_by), status: 'PENDING' },
        }));
      } catch (error) {
        if (isUnique(error)) throw withCode('PENDING_VERSION_EXISTS', error);
        throw error;
      }
    },
  };

  const records = {
    async listPublishedByVillage(villageId, q) {
      const where = { village_id: big(villageId), deleted_at: null, verification_status: 'VERIFIED' };
      if (q.from_date || q.to_date) where.reference_date = { ...(q.from_date && { gte: dateOnly(q.from_date) }), ...(q.to_date && { lte: dateOnly(q.to_date) }) };
      if (q.source_id) where.source_id = big(q.source_id);
      const size = q.size ?? 20; const pageNo = q.page ?? 1;
      const [rows, total] = await Promise.all([
        db.populationRecord.findMany({ where, orderBy: [{ reference_date: 'desc' }, { id: 'desc' }], take: size, skip: (pageNo - 1) * size }),
        db.populationRecord.count({ where }),
      ]);
      return page(rows.map(population), total, { page: pageNo, size });
    },
    findPublishedById: async (villageId, id) => population(await db.populationRecord.findFirst({ where: { id: big(id), village_id: big(villageId), deleted_at: null, verification_status: 'VERIFIED' } })),
    findLatestPublished: async (villageId) => population(await db.populationRecord.findFirst({ where: { village_id: big(villageId), deleted_at: null, verification_status: 'VERIFIED' }, orderBy: [{ reference_date: 'desc' }, { id: 'desc' }] })),
    findForEditor: async (villageId, id) => population(await db.populationRecord.findFirst({ where: { id: big(id), village_id: big(villageId) } })),
    async createPendingBase(input) {
      try {
        return population(await db.populationRecord.create({
          data: { population_value: big(input.population_value), reference_date: dateOnly(input.reference_date), reference_precision: input.reference_precision, village_id: big(input.village_id), source_id: big(input.source_id), verification_status: 'PENDING' },
        }));
      } catch (error) {
        if (isUnique(error)) throw withCode('UNIQUE_POPULATION_RECORD', error);
        throw error;
      }
    },
    async softDelete(villageId, id, actor, at) {
      await db.populationRecord.updateMany({ where: { id: big(id), village_id: big(villageId) }, data: { deleted_at: at, deleted_by: big(actor) } });
    },
    async restore(villageId, id, at) {
      await db.populationRecord.updateMany({ where: { id: big(id), village_id: big(villageId) }, data: { deleted_at: null, deleted_by: null, updated_at: at } });
      return population(await db.populationRecord.findFirst({ where: { id: big(id), village_id: big(villageId) } }));
    },
  };

  const names = {
    listActive: async (villageId, f = {}) => (await db.villageName.findMany({ where: { village_id: big(villageId), deleted_at: null, ...(f.language && { language: f.language }), ...(f.name_type && { name_type: f.name_type }) }, orderBy: { id: 'asc' } })).map(plain),
    findActive: async (villageId, id) => plain(await db.villageName.findFirst({ where: { id: big(id), village_id: big(villageId), deleted_at: null } })),
    findDeleted: async (villageId, id) => plain(await db.villageName.findFirst({ where: { id: big(id), village_id: big(villageId), deleted_at: { not: null } } })),
    async create(input) {
      try { return plain(await db.villageName.create({ data: { name: input.name, language: input.language, name_type: input.name_type, village_id: big(input.village_id) } })); }
      catch (error) { if (isUnique(error)) throw withCode('UNIQUE_VILLAGE_NAME', error); throw error; }
    },
    async update(villageId, id, input) {
      try { return plain(await db.villageName.update({ where: { id: big(id) }, data: input })); }
      catch (error) { if (isUnique(error)) throw withCode('UNIQUE_VILLAGE_NAME', error); throw error; }
    },
    async softDelete(_villageId, id, actor, at) {
      await db.villageName.update({ where: { id: big(id) }, data: { deleted_at: at, deleted_by: big(actor) } });
    },
    async restore(_villageId, id) {
      try { return plain(await db.villageName.update({ where: { id: big(id) }, data: { deleted_at: null, deleted_by: null } })); }
      catch (error) { if (isUnique(error)) throw withCode('UNIQUE_VILLAGE_NAME', error); throw error; }
    },
  };

  const relations = {
    async listPublishedForVillage(id) {
      const rows = await db.villageRelation.findMany({
        where: { OR: [{ village_id: big(id) }, { nearby_village_id: big(id) }], village: { deleted_at: null, verification_status: 'VERIFIED' }, nearbyVillage: { deleted_at: null, verification_status: 'VERIFIED' } },
      });
      return rows.map(plain);
    },
    find: async (pair) => plain(await db.villageRelation.findUnique({ where: { village_id_nearby_village_id: { village_id: big(pair.village_id), nearby_village_id: big(pair.nearby_village_id) } } })),
    async create(pair) {
      try { return plain(await db.villageRelation.create({ data: { village_id: big(pair.village_id), nearby_village_id: big(pair.nearby_village_id) } })); }
      catch (error) { if (isUnique(error)) throw withCode('UNIQUE_VILLAGE_RELATION', error); throw error; }
    },
    async remove(pair) {
      await db.villageRelation.delete({ where: { village_id_nearby_village_id: { village_id: big(pair.village_id), nearby_village_id: big(pair.nearby_village_id) } } });
    },
  };

  const governorates = {
    async exists(id) { return (await db.governorate.count({ where: { id: big(id) } })) > 0; },
    findById: async (id) => plain(await db.governorate.findUnique({ where: { id: big(id) } })),
    async list({ page: p = 1, size = 20, q }) {
      const where = q ? { OR: [{ name_ar: { contains: q, mode: 'insensitive' } }, { name_en: { contains: q, mode: 'insensitive' } }] } : {};
      const [rows, total] = await Promise.all([
        db.governorate.findMany({ where, orderBy: { id: 'asc' }, take: size, skip: (p - 1) * size }),
        db.governorate.count({ where }),
      ]);
      return page(rows.map(plain), total, { page: p, size });
    },
    create: async (input) => plain(await db.governorate.create({ data: input })),
    update: async (id, input) => plain(await db.governorate.update({ where: { id: big(id) }, data: input })),
    async remove(id) {
      try { await db.governorate.delete({ where: { id: big(id) } }); }
      catch (error) { if (isForeignKey(error)) throw withCode('GOVERNORATE_IN_USE', error); throw error; }
    },
  };

  const sources = { isActive: (id) => villages.sourceIsActive(id) };

  const audit = {
    async record({ user_id, entity_type, entity_id, action, old_value, new_value }) {
      const text = (v) => (v === undefined ? null : JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x)));
      await db.auditLog.create({ data: { user_id: big(user_id), entity_type, entity_id: big(entity_id), action, old_value: text(old_value), new_value: text(new_value) } });
    },
  };

  return { villages, versions, records, names, relations, governorates, sources, audit };
}

// Builds the adapter set the services expect, including a real database transaction.
function createPrismaVillageAdapters(prisma) {
  const adapters = createRepositories(prisma);
  adapters.transaction = (work) => prisma.$transaction(async (tx) => work(createRepositories(tx)), { timeout: 10000 });
  return adapters;
}

module.exports = { createPrismaVillageAdapters, createRepositories };
