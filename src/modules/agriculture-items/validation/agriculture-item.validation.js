
const { z } = require('zod');

const agricultureItemIdSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d*$/, 'ID must be a positive integer'),
});

const agricultureItemsQuerySchema = z.object({
  village_id: z
    .string()
    .regex(/^[1-9]\d*$/, 'Village ID must be a positive integer')
    .optional(),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  offset: z.coerce.number().int().min(0).default(0),
});

module.exports = {
  agricultureItemIdSchema,
  agricultureItemsQuerySchema,
};
