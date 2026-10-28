
const publicFacilityService = require('../services/public-facility.service');

const getPublicFacilities = async (req, res, next) => {
  try {
    const facilities = await publicFacilityService.getPublicFacilities({
      villageId: req.query.village_id,
      limit: req.query.limit ?? 20,
      offset: req.query.offset ?? 0,
    });

    res.status(200).json({
      status: 'success',
      results: facilities.length,
      data: facilities,
    });
  } catch (error) {
    next(error);
  }
};

const getPublicFacilityById = async (req, res, next) => {
  try {
    const facility = await publicFacilityService.getPublicFacilityById(
      req.params.id
    );

    res.status(200).json({
      status: 'success',
      data: facility,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicFacilities,
  getPublicFacilityById,
};
