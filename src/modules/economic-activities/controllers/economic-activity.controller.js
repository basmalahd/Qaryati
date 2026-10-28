
const economicActivityService = require('../services/economic-activity.service');

const getEconomicActivities = async (req, res, next) => {
  try {
    const activities = await economicActivityService.getEconomicActivities({
      villageId: req.query.village_id,
      limit: req.query.limit ?? 20,
      offset: req.query.offset ?? 0,
    });

    res.status(200).json({
      status: 'success',
      results: activities.length,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

const getEconomicActivityById = async (req, res, next) => {
  try {
    const activity = await economicActivityService.getEconomicActivityById(
      req.params.id
    );

    res.status(200).json({
      status: 'success',
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEconomicActivities,
  getEconomicActivityById,
};
