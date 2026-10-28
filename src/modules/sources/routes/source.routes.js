
const express = require('express');
const controller = require('../controllers/source.controller');

const router = express.Router();

router.get('/', controller.getSources);
router.get('/:id', controller.getSourceById);
router.post('/', controller.createSource);

router.patch('/:id/archive', controller.archiveSource);
router.patch('/:id/reactivate', controller.reactivateSource);

module.exports = router;
