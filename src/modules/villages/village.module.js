'use strict';

// Composition root for the village domain: wires services to Prisma adapters and routers.
const { createPrismaVillageAdapters } = require('./prisma-village-module.repositories');
const { VillageService } = require('./village.service');
const { VillageNameService } = require('./village-name.service');
const { VillageRelationService } = require('./village-relation.service');
const { PopulationService } = require('../population/population.service');
const { GovernorateService } = require('../governorates/governorate.service');
const { ReviewService } = require('../review/review.service');
const { createVillageRouter, createAdminVillageRouter } = require('./village.routes');
const { createVillageNameRouter } = require('./village-name.routes');
const { createVillageRelationRouter } = require('./village-relation.routes');
const { createPopulationRouter } = require('../population/population.routes');
const { createGovernorateRouter } = require('../governorates/governorate.routes');
const { createReviewRouter } = require('../review/review.routes');

function createVillageModule({ express, prisma, authenticate, authorize }) {
  const a = createPrismaVillageAdapters(prisma);
  const base = { villages: a.villages, audit: a.audit, transaction: a.transaction };
  const villageService = new VillageService({ ...base, governorates: a.governorates, versions: a.versions });
  const nameService = new VillageNameService({ ...base, names: a.names });
  const relationService = new VillageRelationService({ ...base, relations: a.relations });
  const populationService = new PopulationService({ ...base, records: a.records, versions: a.versions, sources: a.sources });
  const governorateService = new GovernorateService(a.governorates);
  const reviewService = new ReviewService({ prisma });
  const deps = { express, authenticate, authorize };

  const villages = express.Router();
  // Sub-resources first so '/:id' in the village router can never shadow them.
  villages.use(createVillageNameRouter({ ...deps, service: nameService }));
  villages.use(createVillageRelationRouter({ ...deps, service: relationService }));
  villages.use(createPopulationRouter({ ...deps, service: populationService }));
  villages.use(createVillageRouter({ ...deps, service: villageService }));

  return {
    villages,
    adminVillages: createAdminVillageRouter({ ...deps, service: villageService }),
    governorates: createGovernorateRouter({ ...deps, service: governorateService, villages: a.villages }),
    review: createReviewRouter({ ...deps, service: reviewService }),
  };
}

module.exports = { createVillageModule };
