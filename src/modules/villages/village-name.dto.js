'use strict';
const { z } = require('zod');
const nameSchema = z.object({ name: z.string().trim().min(1).max(200), language: z.enum(['ar', 'en']), name_type: z.enum(['FORMER', 'HISTORICAL', 'ALTERNATIVE', 'TRANSLITERATION']) }).strict();
const nameParamsSchema = z.object({ villageId: z.coerce.number().int().positive(), id: z.coerce.number().int().positive().optional() });
const nameQuerySchema = z.object({ name_type: z.enum(['FORMER', 'HISTORICAL', 'ALTERNATIVE', 'TRANSLITERATION']).optional(), language: z.enum(['ar', 'en']).optional() }).strict();
module.exports = { nameSchema, nameParamsSchema, nameQuerySchema };
