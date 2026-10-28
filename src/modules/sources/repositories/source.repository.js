
const prisma = require('../../../config/prisma.config');

const findAll = async ({
  status,
  limit = 20,
  offset = 0,
} = {}) => {
  const where = {};

  if (status !== undefined) {
    where.status = status;
  }

  return prisma.source.findMany({
    where,
    orderBy: {
      id: 'desc',
    },
    take: limit,
    skip: offset,
  });
};

const findById = async (id) => {
  return prisma.source.findUnique({
    where: {
      id: BigInt(id),
    },
  });
};

const create = async (data) => {
  return prisma.source.create({
    data,
  });
};

const updateStatus = async (id, status) => {
  return prisma.source.update({
    where: {
      id: BigInt(id),
    },
    data: {
      status,
    },
  });
};

module.exports = {
  findAll,
  findById,
  create,
  updateStatus,
};
