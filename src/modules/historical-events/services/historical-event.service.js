
const repository = require('../repositories/historical-event.repository');

const getHistoricalEvents = async ({
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

const getHistoricalEventById = async (id) => {
  if (!/^[1-9]\d*$/.test(String(id))) {
    const error = new Error(
      'Historical event ID must be a positive integer'
    );
    error.status = 400;
    throw error;
  }

  const event = await repository.findById(id);

  if (!event) {
    const error = new Error('Historical event not found');
    error.status = 404;
    throw error;
  }

  return event;
};

// Validate that the village and source exist before creating an event.
const validateHistoricalEventReferences = async ({
  villageId,
  sourceId,
}) => {
  if (!/^[1-9]\d*$/.test(String(villageId))) {
    const error = new Error('Village ID must be a positive integer');
    error.status = 400;
    throw error;
  }

  if (!/^[1-9]\d*$/.test(String(sourceId))) {
    const error = new Error('Source ID must be a positive integer');
    error.status = 400;
    throw error;
  }

  const village = await repository.findVillageById(villageId);

  if (!village) {
    const error = new Error('Village not found');
    error.status = 404;
    throw error;
  }

  const source = await repository.findSourceById(sourceId);

  if (!source) {
    const error = new Error('Source not found');
    error.status = 404;
    throw error;
  }

  return { village, source };
};

module.exports = {
  getHistoricalEvents,
  getHistoricalEventById,
  validateHistoricalEventReferences,
};
