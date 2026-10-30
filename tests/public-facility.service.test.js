const { test } = require('node:test');
const assert = require('node:assert/strict');

const repository = require('../src/modules/public-facilities/repositories/public-facility.repository');
const service = require('../src/modules/public-facilities/services/public-facility.service');

test('getPublicFacilities passes validated pagination to repository', async (t) => {
  const expected = [{ id: 1n, name: 'Community Library' }];

  t.mock.method(repository, 'findAll', async (filters) => {
    assert.deepEqual(filters, {
      villageId: '2',
      limit: 10,
      offset: 5,
    });
    return expected;
  });

  const result = await service.getPublicFacilities({
    villageId: '2',
    limit: '10',
    offset: '5',
  });

  assert.deepEqual(result, expected);
});

test('getPublicFacilities rejects a limit greater than 100', async (t) => {
  const findAll = t.mock.method(repository, 'findAll');

  await assert.rejects(
    service.getPublicFacilities({ limit: 101 }),
    { status: 400, message: 'Limit must be an integer between 1 and 100' }
  );

  assert.equal(findAll.mock.callCount(), 0);
});

test('getPublicFacilities rejects a negative offset', async () => {
  await assert.rejects(
    service.getPublicFacilities({ offset: -1 }),
    { status: 400, message: 'Offset must be a non-negative integer' }
  );
});

test('getPublicFacilityById rejects an invalid ID', async (t) => {
  const findById = t.mock.method(repository, 'findById');

  await assert.rejects(
    service.getPublicFacilityById('abc'),
    { status: 400, message: 'Public facility ID must be a positive integer' }
  );

  assert.equal(findById.mock.callCount(), 0);
});

test('getPublicFacilityById returns 404 when the facility does not exist', async (t) => {
  t.mock.method(repository, 'findById', async () => null);

  await assert.rejects(
    service.getPublicFacilityById('999'),
    { status: 404, message: 'Public facility not found' }
  );
});
