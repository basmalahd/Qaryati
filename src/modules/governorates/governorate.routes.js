'use strict';
const { GovernorateController } = require('./governorate.controller');
function createGovernorateRouter({ express, service, villages, authenticate, authorize }) {
  const router = express.Router(); const controller = new GovernorateController(service, villages); const admins = [authenticate, authorize(['ADMIN'])];
  router.get('/', controller.list); router.post('/', ...admins, controller.create); router.get('/:id/villages', controller.villagesList); router.get('/:id', controller.get); router.put('/:id', ...admins, controller.update); router.delete('/:id', ...admins, controller.remove); return router;
}
module.exports = { createGovernorateRouter };
