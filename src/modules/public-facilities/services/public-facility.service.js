
const publicFacilityRepository = require('../repositories/public-facility.repository');

const getPublicFacilities = async ({
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

  return publicFacilityRepository.findAll({
    villageId,
    limit: parsedLimit,
    offset: parsedOffset,
  });
};

const getPublicFacilityById = async (id) => {
  if (!/^[1-9]\d*$/.test(String(id))) {
    const error = new Error('Public facility ID must be a positive integer');
    error.status = 400;
    throw error;
  }

  const facility = await publicFacilityRepository.findById(id);

  if (!facility) {
    const error = new Error('Public facility not found');
    error.status = 404;
    throw error;
  }

  return facility;
};

module.exports = {
  getPublicFacilities,
  getPublicFacilityById,
};
