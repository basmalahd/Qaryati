
const prisma = require('../../../config/prisma.config');

const findAll = async ({ villageId, limit = 20, offset = 0 } = {}) => {
  const where = {
    deleted_at: null,
  };

  if (villageId !== undefined) {
    where.village_id = BigInt(villageId);
  }

  return prisma.historicalEvent.findMany({
    where,
    orderBy: [
      { event_date: 'desc' },
      { id: 'desc' },
    ],
    take: limit,
    skip: offset,
  });
};

const findById = async (id) => {
  return prisma.historicalEvent.findFirst({
    where: {
      id: BigInt(id),
      deleted_at: null,
    },
  });
};

// Find a village by its ID
const findVillageById = async (id) => {
  return prisma.village.findUnique({
    where: {
      id: BigInt(id),
    },
  });
};

// Find a source by its ID
const findSourceById = async (id) => {
  return prisma.source.findUnique({
    where: {
      id: BigInt(id),
    },
  });
};

module.exports = {
  findAll,
  findById,
  findVillageById,
  findSourceById,
};
