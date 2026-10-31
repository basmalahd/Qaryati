'use strict';
const { PopulationController } = require('./population.controller');
function createPopulationRouter({ express, service, authenticate, authorize }) {
  const router = express.Router(); const c = new PopulationController(service); const editors = [authenticate, authorize(['EDITOR', 'ADMIN'])]; const admins = [authenticate, authorize(['ADMIN'])];
  router.get('/:villageId/population-records/latest', c.latest);
  router.get('/:villageId/population-records/:id', c.get);
  router.get('/:villageId/population-records', c.list);
  router.post('/:villageId/population-records', ...editors, c.create);
  router.put('/:villageId/population-records/:id', ...editors, c.replace);
  router.patch('/:villageId/population-records/:id', ...editors, c.patch);
  router.delete('/:villageId/population-records/:id', ...admins, c.remove);
  router.post('/:villageId/population-records/:id/restore', ...admins, c.restore);
  return router;
}
module.exports = { createPopulationRouter };
