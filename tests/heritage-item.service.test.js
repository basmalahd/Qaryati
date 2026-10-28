const { test } = require('node:test');
const assert = require('node:assert/strict');

const repository = require('../src/modules/heritage-items/repositories/heritage-item.repository');
const service = require('../src/modules/heritage-items/services/heritage-item.service');

test('getHeritageItems passes validated pagination to repository', async (t) => {
  const expected = [{ id: 1n, name: 'Traditional Embroidery' }];

  t.mock.method(repository, 'findAll', async (filters) => {
    assert.deepEqual(filters, {
      villageId: '2',
      limit: 10,
      offset: 5,
    });
    return expected;
  });

  const result = await service.getHeritageItems({
    villageId: '2',
    limit: '10',
    offset: '5',
  });

  assert.deepEqual(result, expected);
});

test('getHeritageItems rejects a limit greater than 100', async (t) => {
  const findAll = t.mock.method(repository, 'findAll');

  await assert.rejects(
    service.getHeritageItems({ limit: 101 }),
    { status: 400, message: 'Limit must be an integer between 1 and 100' }
  );

  assert.equal(findAll.mock.callCount(), 0);
});

test('getHeritageItems rejects a negative offset', async () => {
  await assert.rejects(
    service.getHeritageItems({ offset: -1 }),
    { status: 400, message: 'Offset must be a non-negative integer' }
  );
});

test('getHeritageItemById rejects an invalid ID', async (t) => {
  const findById = t.mock.method(repository, 'findById');

  await assert.rejects(
    service.getHeritageItemById('abc'),
    { status: 400, message: 'Heritage item ID must be a positive integer' }
  );

  assert.equal(findById.mock.callCount(), 0);
});

test('getHeritageItemById returns 404 when the item does not exist', async (t) => {
  t.mock.method(repository, 'findById', async () => null);

  await assert.rejects(
    service.getHeritageItemById('999'),
    { status: 404, message: 'Heritage item not found' }
  );
});
