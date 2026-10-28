
const express = require('express');
const controller = require('../controllers/economic-activity.controller');

const router = express.Router();

router.get('/', controller.getEconomicActivities);
router.get('/:id', controller.getEconomicActivityById);

module.exports = router;
