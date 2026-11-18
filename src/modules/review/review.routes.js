'use strict';

const { z } = require('zod');
const { badRequest } = require('../../shared/http/problem');

const idSchema = z.object({ id: z.coerce.number().int().positive().safe() });
const listSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(100).default(20),
  entity_type: z.enum(['Village', 'PopulationRecord']).optional(),
}).strict();
const rejectSchema = z.object({ reason: z.string().trim().min(3).max(2000) }).strict();

function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) throw badRequest('Request validation failed.', result.error.issues.map(({ path, message, code }) => ({ path: path.join('.'), message, code })));
  return result.data;
}

function createReviewRouter({ express, service, authenticate, authorize }) {
  const router = express.Router();
  router.use(authenticate, authorize(['VERIFIER', 'ADMIN']));
  router.get('/', async (req, res) => res.status(200).json(await service.listPending(parse(listSchema, req.query))));
  router.get('/:id', async (req, res) => res.status(200).json({ data: await service.get(parse(idSchema, req.params).id) }));
  router.post('/:id/approve', async (req, res) => res.status(200).json({ data: await service.approve(parse(idSchema, req.params).id, req.user.id) }));
  router.post('/:id/reject', async (req, res) => res.status(200).json({ data: await service.reject(parse(idSchema, req.params).id, req.user.id, parse(rejectSchema, req.body).reason) }));
  return router;
}

module.exports = { createReviewRouter };
