'use strict';
// End-to-end flow against a REAL PostgreSQL database.
// Run with:  RUN_DB_TESTS=1 npm test   (requires DATABASE_URL, migrations applied, `npm run db:seed` with SEED_* vars)
const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const enabled = process.env.RUN_DB_TESTS === '1';
const ADMIN = { email: process.env.SEED_ADMIN_EMAIL || 'admin@qaryati.test', password: process.env.SEED_ADMIN_PASSWORD || 'Admin#Pass12345' };
const VERIFIER = { email: process.env.SEED_VERIFIER_EMAIL || 'ver@qaryati.test', password: process.env.SEED_VERIFIER_PASSWORD || 'Verif#Pass12345' };

let api; let admin; let verifier; let governorateId; let sourceId;
const auth = (token) => ({ Authorization: `Bearer ${token}` });
const unique = Date.now().toString(36);

async function login(creds) {
  const res = await request(api).post('/api/v1/auth/login').send(creds);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return res.body.accessToken;
}
async function createAndApproveVillage(name) {
  const created = await request(api).post('/api/v1/villages').set(auth(admin)).send({ current_name_ar: name, current_name_en: `${name}-en`, governorate_id: governorateId, latitude: 32.19, longitude: 34.97, source_id: sourceId });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const approved = await request(api).post(`/api/v1/review/versions/${created.body.data.pending_version_id}/approve`).set(auth(verifier));
  assert.equal(approved.status, 200, JSON.stringify(approved.body));
  return created.body.data.id;
}

before(async () => {
  if (!enabled) return;
  api = require('../src/app');
  admin = await login(ADMIN);
  verifier = await login(VERIFIER);
  const gov = await request(api).get('/api/v1/governorates');
  governorateId = Number(gov.body.data[0].id);
  const src = await request(api).post('/api/v1/sources').set(auth(admin)).send({ title: `Test source ${unique}`, publisher: 'PCBS' });
  assert.equal(src.status, 201, JSON.stringify(src.body));
  sourceId = Number(src.body.data.id);
});

test('writes require authentication and the right role', { skip: !enabled }, async () => {
  assert.equal((await request(api).post('/api/v1/villages').send({})).status, 401);
  assert.equal((await request(api).post('/api/v1/sources').send({ title: 'x' })).status, 401);
  const res = await request(api).post('/api/v1/villages').set(auth(verifier)).send({});
  assert.equal(res.status, 403);
  assert.match(res.headers['content-type'], /problem\+json/);
});

test('draft villages are hidden until a different user verifies them', { skip: !enabled }, async () => {
  const name = `قرية-${unique}`;
  const created = await request(api).post('/api/v1/villages').set(auth(admin)).send({ current_name_ar: name, governorate_id: governorateId });
  assert.equal(created.status, 201);
  const id = created.body.data.id;
  assert.equal((await request(api).get(`/api/v1/villages/${id}`)).status, 404);

  const versionId = created.body.data.pending_version_id;
  const self = await request(api).post(`/api/v1/review/versions/${versionId}/approve`).set(auth(admin));
  assert.equal(self.status, 409);
  assert.equal(self.body.error_code, 'SELF_REVIEW_FORBIDDEN');

  const ok = await request(api).post(`/api/v1/review/versions/${versionId}/approve`).set(auth(verifier));
  assert.equal(ok.status, 200);
  assert.equal((await request(api).get(`/api/v1/villages/${id}`)).status, 200);
  assert.equal((await request(api).post(`/api/v1/review/versions/${versionId}/approve`).set(auth(verifier))).status, 409);
});

test('search, filtering, sorting and pagination', { skip: !enabled }, async () => {
  const a = await createAndApproveVillage(`ألفا-${unique}`);
  const b = await createAndApproveVillage(`بيتا-${unique}`);
  const list = await request(api).get('/api/v1/villages').query({ q: unique, sort: 'current_name_ar', size: 1, page: 2 });
  assert.equal(list.status, 200, JSON.stringify(list.body));
  assert.equal(list.body.meta.total_items, 3);
  assert.equal(list.body.data.length, 1);
  assert.ok([a, b].length === 2);
  assert.equal((await request(api).get('/api/v1/villages').query({ sort: 'password' })).status, 400);
});

test('population history, validation and population filtering', { skip: !enabled }, async () => {
  const id = await createAndApproveVillage(`سكان-${unique}`);
  const body = { population_value: 1500, reference_date: '2017-01-01', reference_precision: 'YEAR', source_id: sourceId };
  const created = await request(api).post(`/api/v1/villages/${id}/population-records`).set(auth(admin)).send(body);
  assert.equal(created.status, 201, JSON.stringify(created.body));
  assert.equal((await request(api).post(`/api/v1/villages/${id}/population-records`).set(auth(admin)).send(body)).status, 409);
  assert.equal((await request(api).post(`/api/v1/villages/${id}/population-records`).set(auth(admin)).send({ ...body, reference_date: '2017-05-05' })).status, 422);

  assert.equal((await request(api).get(`/api/v1/villages/${id}/population-records`)).body.meta.total_items, 0);
  const approve = await request(api).post(`/api/v1/review/versions/${created.body.data.pending_version_id}/approve`).set(auth(verifier));
  assert.equal(approve.status, 200, JSON.stringify(approve.body));
  const history = await request(api).get(`/api/v1/villages/${id}/population-records`);
  assert.equal(history.body.meta.total_items, 1);
  assert.equal(history.body.data[0].reference_date, '2017-01-01');
  assert.equal(Number((await request(api).get(`/api/v1/villages/${id}/population-records/latest`)).body.data.population_value), 1500);

  const filtered = await request(api).get('/api/v1/villages').query({ min_population: 1000, max_population: 2000, sort: '-population' });
  assert.ok(filtered.body.data.some((v) => v.id === String(id)));
});

test('updates are proposed, then applied only after approval; everything is audited', { skip: !enabled }, async () => {
  const id = await createAndApproveVillage(`تحديث-${unique}`);
  const patch = await request(api).patch(`/api/v1/villages/${id}`).set(auth(admin)).send({ name_origin: 'اسم قديم' });
  assert.equal(patch.status, 202, JSON.stringify(patch.body));
  assert.equal((await request(api).get(`/api/v1/villages/${id}`)).body.data.name_origin, null);
  assert.equal((await request(api).patch(`/api/v1/villages/${id}`).set(auth(admin)).send({ name_origin: 'x' })).status, 409);
  await request(api).post(`/api/v1/review/versions/${patch.body.data.version_id}/approve`).set(auth(verifier)).expect(200);
  assert.equal((await request(api).get(`/api/v1/villages/${id}`)).body.data.name_origin, 'اسم قديم');
  const overview = await request(api).get(`/api/v1/villages/${id}/overview`);
  assert.equal(overview.status, 200);
  assert.ok(Array.isArray(overview.body.data.names));
});

test('rejection requires a reason and keeps the draft private', { skip: !enabled }, async () => {
  const created = await request(api).post('/api/v1/villages').set(auth(admin)).send({ current_name_ar: `مرفوض-${unique}`, governorate_id: governorateId });
  const v = created.body.data.pending_version_id;
  assert.equal((await request(api).post(`/api/v1/review/versions/${v}/reject`).set(auth(verifier)).send({})).status, 400);
  await request(api).post(`/api/v1/review/versions/${v}/reject`).set(auth(verifier)).send({ reason: 'No source provided' }).expect(200);
  assert.equal((await request(api).get(`/api/v1/villages/${created.body.data.id}`)).status, 404);
});

test('names, nearby villages and soft delete/restore', { skip: !enabled }, async () => {
  const a = await createAndApproveVillage(`ر1-${unique}`);
  const b = await createAndApproveVillage(`ر2-${unique}`);
  await request(api).post(`/api/v1/villages/${a}/names`).set(auth(admin)).send({ name: `Old-${unique}`, language: 'en', name_type: 'FORMER' }).expect(201);
  assert.equal((await request(api).get(`/api/v1/villages/${a}/names`)).body.data.length, 1);
  await request(api).post(`/api/v1/villages/${a}/nearby`).set(auth(admin)).send({ nearby_village_id: Number(b) }).expect(201);
  assert.equal((await request(api).get(`/api/v1/villages/${b}/nearby`)).status, 200);
  await request(api).delete(`/api/v1/villages/${a}`).set(auth(admin)).expect(204);
  assert.equal((await request(api).get(`/api/v1/villages/${a}`)).status, 404);
  await request(api).post(`/api/v1/villages/${a}/restore`).set(auth(admin)).expect(200);
  assert.equal((await request(api).get(`/api/v1/villages/${a}`)).status, 200);
});

test('supporting-content endpoints serialise BigInt ids (regression)', { skip: !enabled }, async () => {
  const res = await request(api).get('/api/v1/landmarks');
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal((await request(api).get('/api/v1/sources')).status, 200);
});
