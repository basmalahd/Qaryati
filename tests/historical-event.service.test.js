const { test } = require('node:test');
const assert = require('node:assert/strict');

const repository = require('../src/modules/historical-events/repositories/historical-event.repository');
const service = require('../src/modules/historical-events/services/historical-event.service');

test('getHistoricalEvents passes validated pagination to repository', async (t) => {
  const expected = [{ id: 1n, title: 'Village History' }];

  t.mock.method(repository, 'findAll', async (filters) => {
    assert.deepEqual(filters, {
      villageId: '2',
      limit: 10,
      offset: 5,
    });
    return expected;
  });

  const result = await service.getHistoricalEvents({
    villageId: '2',
    limit: '10',
    offset: '5',
  });

  assert.deepEqual(result, expected);
});

test('getHistoricalEvents rejects a limit greater than 100', async (t) => {
  const findAll = t.mock.method(repository, 'findAll');

  await assert.rejects(
    service.getHistoricalEvents({ limit: 101 }),
    { status: 400, message: 'Limit must be between 1 and 100' }
  );

  assert.equal(findAll.mock.callCount(), 0);
});

test('getHistoricalEvents rejects a negative offset', async () => {
  await assert.rejects(
    service.getHistoricalEvents({ offset: -1 }),
    { status: 400, message: 'Offset must be a non-negative integer' }
  );
});

test('getHistoricalEventById rejects an invalid ID', async (t) => {
  const findById = t.mock.method(repository, 'findById');

  await assert.rejects(
    service.getHistoricalEventById('abc'),
    { status: 400, message: 'Historical event ID must be a positive integer' }
  );

  assert.equal(findById.mock.callCount(), 0);
});

test('getHistoricalEventById returns 404 when the event does not exist', async (t) => {
  t.mock.method(repository, 'findById', async () => null);

  await assert.rejects(
    service.getHistoricalEventById('999'),
    { status: 404, message: 'Historical event not found' }
  );
});

test('validateHistoricalEventReferences rejects an invalid village ID', async (t) => {
  const findVillage = t.mock.method(repository, 'findVillageById');

  await assert.rejects(
    service.validateHistoricalEventReferences({
      villageId: 'abc',
      sourceId: '1',
    }),
    { status: 400, message: 'Village ID must be a positive integer' }
  );

  assert.equal(findVillage.mock.callCount(), 0);
});

test('validateHistoricalEventReferences returns 404 when the village does not exist', async (t) => {
  t.mock.method(repository, 'findVillageById', async () => null);

  await assert.rejects(
    service.validateHistoricalEventReferences({
      villageId: '999',
      sourceId: '1',
    }),
    { status: 404, message: 'Village not found' }
  );
});
