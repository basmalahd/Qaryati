
const agricultureItemService = require('../services/agriculture-item.service');

const getAgricultureItems = async (req, res, next) => {
  try {
    const items = await agricultureItemService.getAgricultureItems({
      villageId: req.query.village_id,
      limit: req.query.limit ?? 20,
      offset: req.query.offset ?? 0,
    });

    res.status(200).json({
      status: 'success',
      results: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

const getAgricultureItemById = async (req, res, next) => {
  try {
    const item = await agricultureItemService.getAgricultureItemById(
      req.params.id
    );

    res.status(200).json({
      status: 'success',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAgricultureItems,
  getAgricultureItemById,
};
