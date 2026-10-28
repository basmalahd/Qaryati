const { test } = require('node:test');
const assert = require('node:assert/strict');

const repository = require('../src/modules/landmarks/repositories/landmark.repository');
const service = require('../src/modules/landmarks/services/landmark.service');

test('getLandmarks passes validated pagination to repository', async (t) => {
  const expected = [{ id: 1n, name: 'Village Spring' }];

  t.mock.method(repository, 'findAll', async (filters) => {
    assert.deepEqual(filters, {
      villageId: '2',
      limit: 10,
      offset: 5,
    });
    return expected;
  });

  const result = await service.getLandmarks({
    villageId: '2',
    limit: '10',
    offset: '5',
  });

  assert.deepEqual(result, expected);
});

test('getLandmarks rejects a limit greater than 100', async (t) => {
  const findAll = t.mock.method(repository, 'findAll');

  await assert.rejects(
    service.getLandmarks({ limit: 101 }),
    { status: 400, message: 'Limit must be between 1 and 100' }
  );

  assert.equal(findAll.mock.callCount(), 0);
});

test('getLandmarks rejects an invalid village ID', async () => {
  await assert.rejects(
    service.getLandmarks({ villageId: 'abc' }),
    { status: 400, message: 'Village ID must be a positive integer' }
  );
});

test('getLandmarkById rejects an invalid ID', async (t) => {
  const findById = t.mock.method(repository, 'findById');

  await assert.rejects(
    service.getLandmarkById('abc'),
    { status: 400, message: 'Landmark ID must be a positive integer' }
  );

  assert.equal(findById.mock.callCount(), 0);
});

test('getLandmarkById returns 404 when the landmark does not exist', async (t) => {
  t.mock.method(repository, 'findById', async () => null);

  await assert.rejects(
    service.getLandmarkById('999'),
    { status: 404, message: 'Landmark not found' }
  );
});
