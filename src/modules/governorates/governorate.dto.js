'use strict';

const { z } = require('zod');
const { governorateSchema, idParamSchema, listQuerySchema } = require('../villages/village.dto');
const governorateListQuerySchema = z.object({ q: z.string().trim().max(200).optional(), page: z.coerce.number().int().positive().default(1), size: z.coerce.number().int().positive().max(100).default(20) }).strict();
const governorateIdSchema = idParamSchema;
module.exports = { governorateSchema, governorateIdSchema, governorateListQuerySchema };
