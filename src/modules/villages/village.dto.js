'use strict';

const { z } = require('zod');

const idParamSchema = z.object({ id: z.coerce.number().int().positive().safe() });
const listQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  governorate_id: z.coerce.number().int().positive().optional(),
  min_population: z.coerce.number().int().nonnegative().optional(),
  max_population: z.coerce.number().int().nonnegative().optional(),
  has_landmarks: z.enum(['true', 'false']).optional(),
  sort: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(100).default(20),
}).strict();
const villageFields = {
  current_name_ar: z.string().trim().min(1).max(150),
  current_name_en: z.string().trim().min(1).max(150).nullable().optional(),
  name_origin: z.string().trim().max(10000).nullable().optional(),
  location_description: z.string().trim().max(10000).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  elevation: z.number().finite().nullable().optional(),
  land_area: z.number().nonnegative().finite().nullable().optional(),
  historical_overview: z.string().trim().max(30000).nullable().optional(),
  governorate_id: z.number().int().positive(),
  source_id: z.number().int().positive().nullable().optional(),
};
const createVillageSchema = z.object(villageFields).strict().refine(
  (v) => (v.latitude == null) === (v.longitude == null),
  { message: 'latitude and longitude must be supplied together', path: ['latitude'] },
);
const replaceVillageSchema = z.object(villageFields).strict().refine(
  (v) => (v.latitude == null) === (v.longitude == null),
  { message: 'latitude and longitude must be supplied together', path: ['latitude'] },
);
const patchVillageSchema = z.object(villageFields).partial().strict().refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' }).refine(
  (v) => !('latitude' in v) || !('longitude' in v) || (v.latitude == null) === (v.longitude == null),
  { message: 'latitude and longitude must be supplied together', path: ['latitude'] },
);
const governorateSchema = z.object({ name_ar: z.string().trim().min(1).max(150), name_en: z.string().trim().min(1).max(150).nullable().optional() }).strict();
const deletedVillageQuerySchema = z.object({ deleted: z.literal('true'), page: z.coerce.number().int().positive().default(1), size: z.coerce.number().int().positive().max(100).default(20) }).strict();

module.exports = { idParamSchema, listQuerySchema, createVillageSchema, replaceVillageSchema, patchVillageSchema, governorateSchema, deletedVillageQuerySchema };
