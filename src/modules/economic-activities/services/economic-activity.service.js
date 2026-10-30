
const economicActivityRepository = require('../repositories/economic-activity.repository');

const getEconomicActivities = async ({
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
    const error = new Error('Limit must be an integer between 1 and 100');
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

  return economicActivityRepository.findAll({
    villageId,
    limit: parsedLimit,
    offset: parsedOffset,
  });
};

const getEconomicActivityById = async (id) => {
  if (!/^[1-9]\d*$/.test(String(id))) {
    const error = new Error('Economic activity ID must be a positive integer');
    error.status = 400;
    throw error;
  }

  const activity = await economicActivityRepository.findById(id);

  if (!activity) {
    const error = new Error('Economic activity not found');
    error.status = 404;
    throw error;
  }

  return activity;
};

module.exports = {
  getEconomicActivities,
  getEconomicActivityById,
};
