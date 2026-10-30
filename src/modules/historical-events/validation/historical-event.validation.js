
const { z } = require('zod');

const createHistoricalEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters'),

  description: z
    .string()
    .trim()
    .min(1, 'Description is required'),

  event_date: z.union([z.iso.date(), z.null()]).optional(),

  village_id: z
    .string()
    .regex(/^[1-9]\d*$/, 'Village ID must be a positive integer'),

  source_id: z
    .string()
    .regex(/^[1-9]\d*$/, 'Source ID must be a positive integer'),
});

module.exports = {
  createHistoricalEventSchema,
};
