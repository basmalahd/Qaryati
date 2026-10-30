
const repository = require('../repositories/landmark.repository');

const getLandmarks = async ({
  villageId,
  limit = 20,
  offset = 0,
} = {}) => {
  const parsedLimit = Number(limit);
  const parsedOffset = Number(offset);

  if (
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1 ||
    parsedLimit > 100
  ) {
    const error = new Error('Limit must be between 1 and 100');
    error.status = 400;
    throw error;
  }

  if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
    const error = new Error('Offset must be a non-negative integer');
    error.status = 400;
    throw error;
  }

  if (
    villageId !== undefined &&
    !/^[1-9]\d*$/.test(String(villageId))
  ) {
    const error = new Error('Village ID must be a positive integer');
    error.status = 400;
    throw error;
  }

  return repository.findAll({
    villageId,
    limit: parsedLimit,
    offset: parsedOffset,
  });
};

const getLandmarkById = async (id) => {
  if (!/^[1-9]\d*$/.test(String(id))) {
    const error = new Error('Landmark ID must be a positive integer');
    error.status = 400;
    throw error;
  }

  const landmark = await repository.findById(id);

  if (!landmark) {
    const error = new Error('Landmark not found');
    error.status = 404;
    throw error;
  }

  return landmark;
};

module.exports = {
  getLandmarks,
  getLandmarkById,
};
