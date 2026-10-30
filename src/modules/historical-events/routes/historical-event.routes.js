
const express = require('express');
const controller = require('../controllers/historical-event.controller');

const router = express.Router();

router.get('/', controller.getHistoricalEvents);
router.get('/:id', controller.getHistoricalEventById);

module.exports = router;
