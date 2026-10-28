
const { z } = require('zod');

const sourceIdSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d*$/, 'Source ID must be a positive integer'),
});

const sourcesQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  offset: z.coerce.number().int().min(0).default(0),
});

const createSourceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(255, 'Title must not exceed 255 characters'),

  publisher: z
    .string()
    .trim()
    .max(200, 'Publisher must not exceed 200 characters')
    .nullable()
    .optional(),

  url: z
    .string()
    .trim()
    .url('Please provide a valid URL')
    .max(1000, 'URL must not exceed 1000 characters')
    .nullable()
    .optional(),

  publication_date: z
    .iso
    .date()
    .nullable()
    .optional(),

  description: z.string().nullable().optional(),
});

module.exports = {
  sourceIdSchema,
  sourcesQuerySchema,
  createSourceSchema,
};
