const { test } = require('node:test');
const assert = require('node:assert/strict');

const repository = require('../src/modules/economic-activities/repositories/economic-activity.repository');
const service = require('../src/modules/economic-activities/services/economic-activity.service');

test('getEconomicActivities passes validated pagination to repository', async (t) => {
  const expected = [{ id: 1n, name: 'Traditional Crafts' }];

  t.mock.method(repository, 'findAll', async (filters) => {
    assert.deepEqual(filters, {
      villageId: '2',
      limit: 10,
      offset: 5,
    });
    return expected;
  });

  const result = await service.getEconomicActivities({
    villageId: '2',
    limit: '10',
    offset: '5',
  });

  assert.deepEqual(result, expected);
});

test('getEconomicActivities rejects a limit greater than 100', async (t) => {
  const findAll = t.mock.method(repository, 'findAll');

  await assert.rejects(
    service.getEconomicActivities({ limit: 101 }),
    { status: 400, message: 'Limit must be an integer between 1 and 100' }
  );

  assert.equal(findAll.mock.callCount(), 0);
});

test('getEconomicActivities rejects a negative offset', async () => {
  await assert.rejects(
    service.getEconomicActivities({ offset: -1 }),
    { status: 400, message: 'Offset must be a non-negative integer' }
  );
});

test('getEconomicActivityById rejects an invalid ID', async (t) => {
  const findById = t.mock.method(repository, 'findById');

  await assert.rejects(
    service.getEconomicActivityById('abc'),
    { status: 400, message: 'Economic activity ID must be a positive integer' }
  );

  assert.equal(findById.mock.callCount(), 0);
});

test('getEconomicActivityById returns 404 when the activity does not exist', async (t) => {
  t.mock.method(repository, 'findById', async () => null);

  await assert.rejects(
    service.getEconomicActivityById('999'),
    { status: 404, message: 'Economic activity not found' }
  );
});
