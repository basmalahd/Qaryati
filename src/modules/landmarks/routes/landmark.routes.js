
const express = require('express');
const controller = require('../controllers/landmark.controller');

const router = express.Router();

router.get('/', controller.getLandmarks);
router.get('/:id', controller.getLandmarkById);

module.exports = router;
