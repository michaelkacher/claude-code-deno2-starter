/**
 * CRUD Routes Template - SHORTHAND VERSION (Hono)
 *
 * Ultra-concise template for simple CRUD routes with minimal custom logic.
 * For complex routes, use routes-crud.template.ts instead.
 *
 * Token savings: ~600-800 tokens vs writing from scratch
 * Token savings: ~200-300 tokens vs routes-crud.template.ts
 *
 * Instructions:
 * 1. Copy to backend/routes/[resources].ts
 * 2. Replace [Resource], [resource], [resources]
 * 3. Uncomment middleware imports if needed
 * 4. Service auto-initialized with KV
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { [Resource]Service } from '../services/[resource].ts';
import { getKv } from '../lib/kv.ts';

// TODO: Uncomment if auth/validation needed
// import { authenticate } from '../middleware/auth.ts';
// import { validate[Resource] } from '../middleware/validation.ts';

const [resources] = new Hono();

// Helper to get service instance
async function getService() {
  const kv = await getKv();
  return new [Resource]Service(kv);
}

// =============================================================================
// CRUD Endpoints (Standard REST)
// =============================================================================

// CREATE: POST /api/v1/[resources]
[resources].post('/', /* authenticate, validate[Resource], */ async (c: Context) => {
  const service = await getService();
  const body = await c.req.json();
  const result = await service.create(body);
  return c.json({ data: result }, 201);
});

// LIST: GET /api/v1/[resources]?limit=10&cursor=abc
[resources].get('/', /* authenticate, */ async (c: Context) => {
  const service = await getService();
  const limit = Number(c.req.query('limit')) || 10;
  const cursor = c.req.query('cursor');
  const result = await service.findAll({ limit, cursor });
  return c.json(result, 200);
});

// GET BY ID: GET /api/v1/[resources]/:id
[resources].get('/:id', /* authenticate, */ async (c: Context) => {
  const service = await getService();
  const id = c.req.param('id');
  const result = await service.findById(id);
  if (!result) return c.json({ error: { code: 'NOT_FOUND', message: '[Resource] not found' } }, 404);
  return c.json({ data: result }, 200);
});

// UPDATE: PUT /api/v1/[resources]/:id
[resources].put('/:id', /* authenticate, validate[Resource], */ async (c: Context) => {
  const service = await getService();
  const id = c.req.param('id');
  const body = await c.req.json();
  const result = await service.update(id, body);
  if (!result) return c.json({ error: { code: 'NOT_FOUND', message: '[Resource] not found' } }, 404);
  return c.json({ data: result }, 200);
});

// DELETE: DELETE /api/v1/[resources]/:id
[resources].delete('/:id', /* authenticate, */ async (c: Context) => {
  const service = await getService();
  const id = c.req.param('id');
  const deleted = await service.delete(id);
  if (!deleted) return c.json({ error: { code: 'NOT_FOUND', message: '[Resource] not found' } }, 404);
  return c.body(null, 204);
});

// =============================================================================
// Custom Endpoints (Add below)
// =============================================================================

// TODO: Add custom endpoints here
// Example:
// [resources].post('/:id/action', authenticate, async (c) => { ... });

export default [resources];

/**
 * Error Handling Notes:
 * - Service methods throw ValidationError, ConflictError, etc.
 * - These are caught by global error handler middleware
 * - Only handle NOT_FOUND in routes (service returns null)
 * - For custom error handling, wrap in try-catch
 */
