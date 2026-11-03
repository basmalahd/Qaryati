'use strict';
const { VillageRelationController } = require('./village-relation.controller');
function createVillageRelationRouter({ express, service, authenticate, authorize }) {
  const router = express.Router(); const c = new VillageRelationController(service); const editors = [authenticate, authorize(['EDITOR', 'ADMIN'])]; const admins = [authenticate, authorize(['ADMIN'])];
  router.get('/:villageId/nearby', c.list); router.post('/:villageId/nearby', ...editors, c.create); router.delete('/:villageId/nearby/:nearbyVillageId', ...admins, c.remove); return router;
}
module.exports = { createVillageRelationRouter };
