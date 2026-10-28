
const express = require('express');
const controller = require('../controllers/heritage-item.controller');

const router = express.Router();

router.get('/', controller.getHeritageItems);
router.get('/:id', controller.getHeritageItemById);

module.exports = router;
