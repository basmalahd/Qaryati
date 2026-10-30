
const { z } = require('zod');

const createLandmarkSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Landmark name is required')
    .max(200, 'Landmark name must not exceed 200 characters'),

  description: z
    .string()
    .trim()
    .min(1, 'Description is required'),

  village_id: z
    .string()
    .regex(/^[1-9]\d*$/, 'Village ID must be a positive integer'),
});

module.exports = {
  createLandmarkSchema,
};
