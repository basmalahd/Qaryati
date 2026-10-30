
const express = require('express');
const controller = require('../controllers/agriculture-item.controller');

const router = express.Router();

router.get('/', controller.getAgricultureItems);
router.get('/:id', controller.getAgricultureItemById);

module.exports = router;
