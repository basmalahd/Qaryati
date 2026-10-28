
const sourceService = require('../services/source.service');

const getSources = async (req, res, next) => {
  try {
    const sources = await sourceService.getSources({
      status: req.query.status,
      limit: req.query.limit ?? 20,
      offset: req.query.offset ?? 0,
    });

    res.status(200).json({
      status: 'success',
      results: sources.length,
      data: sources,
    });
  } catch (error) {
    next(error);
  }
};

const getSourceById = async (req, res, next) => {
  try {
    const source = await sourceService.getSourceById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: source,
    });
  } catch (error) {
    next(error);
  }
};

const createSource = async (req, res, next) => {
  try {
    const source = await sourceService.createSource(req.body);

    res.status(201).json({
      status: 'success',
      data: source,
    });
  } catch (error) {
    next(error);
  }
};

const archiveSource = async (req, res, next) => {
  try {
    const source = await sourceService.changeSourceStatus(
      req.params.id,
      'ARCHIVED'
    );

    res.status(200).json({
      status: 'success',
      message: 'Source archived successfully',
      data: source,
    });
  } catch (error) {
    next(error);
  }
};

const reactivateSource = async (req, res, next) => {
  try {
    const source = await sourceService.changeSourceStatus(
      req.params.id,
      'ACTIVE'
    );

    res.status(200).json({
      status: 'success',
      message: 'Source reactivated successfully',
      data: source,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSources,
  getSourceById,
  createSource,
  archiveSource,
  reactivateSource,
};
