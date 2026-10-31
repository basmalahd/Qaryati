'use strict';
const { z } = require('zod');
const relationParamsSchema = z.object({ villageId: z.coerce.number().int().positive(), nearbyVillageId: z.coerce.number().int().positive().optional() });
const relationBodySchema = z.object({ nearby_village_id: z.number().int().positive() }).strict();
module.exports = { relationParamsSchema, relationBodySchema };
