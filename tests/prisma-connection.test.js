
require('dotenv').config();

const { describe, test, after } = require('node:test');
const assert = require('node:assert/strict');

const prisma = require('../src/config/prisma.config');

describe('Prisma Database Connection', () => {

  after(async () => {
    await prisma.$disconnect();
  });

  test('should connect to PostgreSQL', async () => {
    const result = await prisma.$queryRaw`SELECT 1 AS connected`;

    assert.equal(result[0].connected, 1);
  });

  test('should access the Village table', async () => {
    const count = await prisma.village.count();

    assert.equal(typeof count, 'number');
  });

});
