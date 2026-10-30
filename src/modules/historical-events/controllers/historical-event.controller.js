
const historicalEventService = require('../services/historical-event.service');

const getHistoricalEvents = async (req, res, next) => {
  try {
    const { village_id, limit, offset } = req.query;

    const events = await historicalEventService.getHistoricalEvents({
      villageId: village_id,
      limit: limit === undefined ? 20 : limit,
      offset: offset === undefined ? 0 : offset,
    });

    res.status(200).json({
      status: 'success',
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

const getHistoricalEventById = async (req, res, next) => {
  try {
    const event = await historicalEventService.getHistoricalEventById(
      req.params.id
    );

    res.status(200).json({
      status: 'success',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHistoricalEvents,
  getHistoricalEventById,
};
