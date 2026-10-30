
const heritageItemService = require('../services/heritage-item.service');

const getHeritageItems = async (req, res, next) => {
  try {
    const heritageItems = await heritageItemService.getHeritageItems({
      villageId: req.query.village_id,
      limit: req.query.limit ?? 20,
      offset: req.query.offset ?? 0,
    });

    res.status(200).json({
      status: 'success',
      results: heritageItems.length,
      data: heritageItems,
    });
  } catch (error) {
    next(error);
  }
};

const getHeritageItemById = async (req, res, next) => {
  try {
    const heritageItem = await heritageItemService.getHeritageItemById(
      req.params.id
    );

    res.status(200).json({
      status: 'success',
      data: heritageItem,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHeritageItems,
  getHeritageItemById,
};
