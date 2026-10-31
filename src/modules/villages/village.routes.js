'use strict';

const { VillageController } = require('./village.controller');

function createVillageRouter({ express, service, authenticate, authorize }) {
  const router = express.Router();
  const controller = new VillageController(service);
  const editors = [authenticate, authorize(['EDITOR', 'ADMIN'])];
  const admins = [authenticate, authorize(['ADMIN'])];
  router.get('/', controller.list);
  router.post('/', ...editors, controller.create);
  router.get('/:id/overview', controller.overview);
  router.get('/:id', controller.get);
  router.put('/:id', ...editors, controller.replace);
  router.patch('/:id', ...editors, controller.patch);
  router.delete('/:id', ...admins, controller.remove);
  router.post('/:id/restore', ...admins, controller.restore);
  return router;
}

function createAdminVillageRouter({ express, service, authenticate, authorize }) {
  const router = express.Router(); const controller = new VillageController(service);
  router.get('/', authenticate, authorize(['ADMIN']), controller.listDeleted);
  return router;
}

module.exports = { createVillageRouter, createAdminVillageRouter };
