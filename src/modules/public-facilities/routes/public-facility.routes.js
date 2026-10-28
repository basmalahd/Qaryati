
const express = require('express');
const controller = require('../controllers/public-facility.controller');

const router = express.Router();

router.get('/', controller.getPublicFacilities);
router.get('/:id', controller.getPublicFacilityById);

module.exports = router;
