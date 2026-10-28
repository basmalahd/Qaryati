const { test } = require('node:test');
const assert = require('node:assert/strict');

const repository = require('../src/modules/sources/repositories/source.repository');
const service = require('../src/modules/sources/services/source.service');

test('getSources passes validated filters to repository', async (t) => {
  const expected = [{ id: 1n, title: 'Local History', status: 'ACTIVE' }];

  t.mock.method(repository, 'findAll', async (filters) => {
    assert.deepEqual(filters, {
      status: 'ARCHIVED',
      limit: 10,
      offset: 5,
    });
    return expected;
  });

  const result = await service.getSources({
    status: 'ARCHIVED',
    limit: '10',
    offset: '5',
  });

  assert.deepEqual(result, expected);
});

test('getSources rejects an invalid status', async () => {
  await assert.rejects(
    service.getSources({ status: 'DELETED' }),
    { status: 400, message: 'Status must be ACTIVE or ARCHIVED' }
  );
});

test('getSourceById rejects an invalid ID', async (t) => {
  const findById = t.mock.method(repository, 'findById');

  await assert.rejects(
    service.getSourceById('abc'),
    { status: 400, message: 'Source ID must be a positive integer' }
  );

  assert.equal(findById.mock.callCount(), 0);
});

test('getSourceById returns 404 when the source does not exist', async (t) => {
  t.mock.method(repository, 'findById', async () => null);

  await assert.rejects(
    service.getSourceById('999'),
    { status: 404, message: 'Source not found' }
  );
});

test('createSource trims fields and sets the initial status to ACTIVE', async (t) => {
  const expected = {
    id: 1n,
    title: 'Local History',
    publisher: 'Village Archive',
    url: 'https://example.com/history',
    description: 'Historical records',
    publication_date: new Date('2020-01-01'),
    status: 'ACTIVE',
  };

  t.mock.method(repository, 'create', async (data) => {
    assert.deepEqual(data, {
      title: 'Local History',
      publisher: 'Village Archive',
      url: 'https://example.com/history',
      description: 'Historical records',
      publication_date: new Date('2020-01-01'),
      status: 'ACTIVE',
    });
    return expected;
  });

  const result = await service.createSource({
    title: '  Local History  ',
    publisher: '  Village Archive  ',
    url: '  https://example.com/history  ',
    description: '  Historical records  ',
    publication_date: '2020-01-01',
  });

  assert.deepEqual(result, expected);
});

test('createSource rejects a missing title', async (t) => {
  const create = t.mock.method(repository, 'create');

  await assert.rejects(
    service.createSource({ title: '   ' }),
    {
      status: 400,
      message: 'Title is required and must not exceed 255 characters',
    }
  );

  assert.equal(create.mock.callCount(), 0);
});

test('changeSourceStatus rejects an invalid status', async (t) => {
  const findById = t.mock.method(repository, 'findById');

  await assert.rejects(
    service.changeSourceStatus('1', 'DELETED'),
    { status: 400, message: 'Status must be ACTIVE or ARCHIVED' }
  );

  assert.equal(findById.mock.callCount(), 0);
});

test('changeSourceStatus returns 404 when the source does not exist', async (t) => {
  t.mock.method(repository, 'findById', async () => null);
  const updateStatus = t.mock.method(repository, 'updateStatus');

  await assert.rejects(
    service.changeSourceStatus('999', 'ARCHIVED'),
    { status: 404, message: 'Source not found' }
  );

  assert.equal(updateStatus.mock.callCount(), 0);
});

test('changeSourceStatus updates an existing source', async (t) => {
  const source = { id: 1n, title: 'Local History', status: 'ACTIVE' };
  const archivedSource = { ...source, status: 'ARCHIVED' };

  t.mock.method(repository, 'findById', async () => source);
  t.mock.method(repository, 'updateStatus', async (id, status) => {
    assert.equal(String(id), '1');
    assert.equal(status, 'ARCHIVED');
    return archivedSource;
  });

  const result = await service.changeSourceStatus('1', 'ARCHIVED');

  assert.deepEqual(result, archivedSource);
});

test('createSource rejects an invalid publication date', async (t) => {
  const create = t.mock.method(repository, 'create');

  await assert.rejects(
    service.createSource({
      title: 'Local History',
      publication_date: 'not-a-valid-date',
    }),
    {
      status: 400,
      message: 'Publication date must be a valid date',
    }
  );

  assert.equal(create.mock.callCount(), 0);
});
