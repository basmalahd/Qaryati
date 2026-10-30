
const prisma = require('../../../config/prisma.config');

const findAll = async ({
  villageId,
  limit = 20,
  offset = 0,
} = {}) => {
  const where = {
    deleted_at: null,
  };

  if (villageId !== undefined) {
    where.village_id = BigInt(villageId);
  }

  return prisma.publicFacility.findMany({
    where,
    orderBy: {
      id: 'desc',
    },
    take: limit,
    skip: offset,
  });
};

const findById = async (id) => {
  return prisma.publicFacility.findFirst({
    where: {
      id: BigInt(id),
      deleted_at: null,
    },
  });
};

module.exports = {
  findAll,
  findById,
};
