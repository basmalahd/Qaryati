'use strict';

const express = require('express');
const controller = require('../controllers/source.controller');

// Reads are public; every state-changing route requires an authenticated EDITOR/ADMIN.
function createSourceRouter({ authenticate, authorize }) {
  const router = express.Router();
  const editors = [authenticate, authorize(['EDITOR', 'ADMIN'])];
  router.get('/', controller.getSources);
  router.get('/:id', controller.getSourceById);
  router.post('/', ...editors, controller.createSource);
  router.patch('/:id/archive', ...editors, controller.archiveSource);
  router.patch('/:id/reactivate', ...editors, controller.reactivateSource);
  return router;
}

module.exports = { createSourceRouter };
