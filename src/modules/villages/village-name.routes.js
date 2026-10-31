'use strict';
const { VillageNameController } = require('./village-name.controller');
function createVillageNameRouter({ express, service, authenticate, authorize }) {
  const router = express.Router(); const c = new VillageNameController(service); const editors = [authenticate, authorize(['EDITOR', 'ADMIN'])]; const admins = [authenticate, authorize(['ADMIN'])];
  router.get('/:villageId/names', c.list); router.get('/:villageId/names/:id', c.get); router.post('/:villageId/names', ...editors, c.create); router.put('/:villageId/names/:id', ...editors, c.replace); router.patch('/:villageId/names/:id', ...editors, c.patch); router.delete('/:villageId/names/:id', ...admins, c.remove); router.post('/:villageId/names/:id/restore', ...admins, c.restore); return router;
}
module.exports = { createVillageNameRouter };
