const { test } = require('node:test');
const assert = require('node:assert/strict');

const repository = require('../src/modules/agriculture-items/repositories/agriculture-item.repository');
const service = require('../src/modules/agriculture-items/services/agriculture-item.service');

test('getAgricultureItems passes validated pagination to repository', async (t) => {
  const expected = [{ id: 1n, name: 'Olive Farming' }];

  t.mock.method(repository, 'findAll', async (filters) => {
    assert.deepEqual(filters, {
      villageId: '2',
      limit: 10,
      offset: 5,
    });
    return expected;
  });

  const result = await service.getAgricultureItems({
    villageId: '2',
    limit: '10',
    offset: '5',
  });

  assert.deepEqual(result, expected);
});

test('getAgricultureItems rejects a limit greater than 100', async (t) => {
  const findAll = t.mock.method(repository, 'findAll');

  await assert.rejects(
    service.getAgricultureItems({ limit: 101 }),
    { status: 400, message: 'Limit must be an integer between 1 and 100' }
  );

  assert.equal(findAll.mock.callCount(), 0);
});

test('getAgricultureItems rejects a negative offset', async () => {
  await assert.rejects(
    service.getAgricultureItems({ offset: -1 }),
    { status: 400, message: 'Offset must be a non-negative integer' }
  );
});

test('getAgricultureItemById rejects an invalid ID', async (t) => {
  const findById = t.mock.method(repository, 'findById');

  await assert.rejects(
    service.getAgricultureItemById('abc'),
    { status: 400, message: 'Agriculture item ID must be a positive integer' }
  );

  assert.equal(findById.mock.callCount(), 0);
});

test('getAgricultureItemById returns 404 when the item does not exist', async (t) => {
  t.mock.method(repository, 'findById', async () => null);

  await assert.rejects(
    service.getAgricultureItemById('999'),
    { status: 404, message: 'Agriculture item not found' }
  );
});
