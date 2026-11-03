'use strict';

const { z } = require('zod');
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, 'Must be a real date in YYYY-MM-DD format');
const populationFields = {
  population_value: z.number().int().positive(),
  reference_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reference_precision: z.enum(['YEAR', 'MONTH', 'DAY']),
  source_id: z.number().int().positive(),
};
const createPopulationSchema = z.object(populationFields).strict();
const replacePopulationSchema = createPopulationSchema;
const patchPopulationSchema = z.object(populationFields).partial().strict().refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' });
const populationIdSchema = z.object({ villageId: z.coerce.number().int().positive(), id: z.coerce.number().int().positive().optional() });
const populationListSchema = z.object({
  from_date: dateOnly.optional(),
  to_date: dateOnly.optional(),
  source_id: z.coerce.number().int().positive().optional(),
  verification_status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
  from_year: z.coerce.number().int().min(1800).max(new Date().getUTCFullYear()).optional(),
  to_year: z.coerce.number().int().min(1800).max(new Date().getUTCFullYear()).optional(),
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(100).default(20),
}).strict();
module.exports = { createPopulationSchema, replacePopulationSchema, patchPopulationSchema, populationIdSchema, populationListSchema };
