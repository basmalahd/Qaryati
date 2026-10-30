
const landmarkService = require('../services/landmark.service');

const getLandmarks = async (req, res, next) => {
  try {
    const { village_id, limit, offset } = req.query;

    const landmarks = await landmarkService.getLandmarks({
      villageId: village_id,
      limit: limit === undefined ? 20 : limit,
      offset: offset === undefined ? 0 : offset,
    });

    res.status(200).json({
      status: 'success',
      data: landmarks,
    });
  } catch (error) {
    next(error);
  }
};

const getLandmarkById = async (req, res, next) => {
  try {
    const landmark = await landmarkService.getLandmarkById(
      req.params.id
    );

    res.status(200).json({
      status: 'success',
      data: landmark,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLandmarks,
  getLandmarkById,
};
