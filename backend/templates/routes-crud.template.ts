/**
 * CRUD Routes Template (Hono)
 *
 * Use this template for standard RESTful CRUD routes.
 * Complete implementation with authentication, validation, and error handling.
 *
 * Pattern: CRUD_ROUTES (see BACKEND_PATTERNS.md)
 *
 * Token savings: ~400-600 tokens vs writing from scratch
 *
 * Instructions:
 * 1. Replace [Resource] with your resource name (e.g., User, Task, Workout)
 * 2. Replace [resource] with lowercase version (e.g., user, task, workout)
 * 3. Replace [resources] with plural lowercase (e.g., users, tasks, workouts)
 * 4. Update imports for service and types
 * 5. Customize authentication/validation middleware
 * 6. Add custom endpoints below CRUD section
 * 7. Delete routes that don't apply
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { [Resource]Service } from '../services/[resource].ts';
// TODO: Import types
// import type { Create[Resource], Update[Resource] } from '../types/index.ts';

// TODO: Import middleware (customize as needed)
// import { authenticate } from '../middleware/auth.ts';
// import { validate[Resource] } from '../middleware/validation.ts';

// TODO: Import errors
import { ValidationError, NotFoundError } from '../lib/errors.ts';

// Initialize router
const [resources] = new Hono();

// Initialize service
// TODO: Pass KV instance if using dependency injection
// import { getKv } from '../lib/kv.ts';
// const kv = await getKv();
// const service = new [Resource]Service(kv);

// =============================================================================
// CREATE
// =============================================================================

/**
 * POST /api/v1/[resources]
 * Create a new [resource]
 *
 * Auth: Required (TODO: uncomment authenticate middleware)
 * Body: Create[Resource]
 * Response: 201 { data: [Resource] }
 * Errors: 400 (validation), 401 (unauthorized), 409 (conflict)
 */
[resources].post(
  '/',
  // authenticate,          // TODO: Uncomment if auth required
  // validate[Resource],    // TODO: Uncomment if validation middleware exists
  async (c: Context) => {
    try {
      // TODO: Initialize service with KV
      // const kv = await getKv();
      // const service = new [Resource]Service(kv);

      const body = await c.req.json();
      const [resource] = await service.create(body);

      return c.json({ data: [resource] }, 201);
    } catch (error) {
      if (error instanceof ValidationError) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            details: error.details,
          },
        }, 400);
      }

      if (error instanceof ConflictError) {
        return c.json({
          error: {
            code: 'CONFLICT',
            message: error.message,
          },
        }, 409);
      }

      // Unexpected error
      console.error('[Resource] create error:', error);
      return c.json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create [resource]',
        },
      }, 500);
    }
  }
);

// =============================================================================
// LIST
// =============================================================================

/**
 * GET /api/v1/[resources]
 * List all [resources] with pagination
 *
 * Auth: Optional (TODO: add authenticate if required)
 * Query: limit (number), cursor (string)
 * Response: 200 { data: [Resource][], cursor: string | null }
 * Errors: 401 (unauthorized)
 */
[resources].get('/', async (c: Context) => {
  try {
    // TODO: Initialize service with KV
    // const kv = await getKv();
    // const service = new [Resource]Service(kv);

    const limit = Number(c.req.query('limit')) || 10;
    const cursor = c.req.query('cursor');

    const result = await service.findAll({ limit, cursor });

    return c.json(result, 200);
  } catch (error) {
    console.error('[Resource] list error:', error);
    return c.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list [resources]',
      },
    }, 500);
  }
});

// =============================================================================
// GET BY ID
// =============================================================================

/**
 * GET /api/v1/[resources]/:id
 * Get a [resource] by ID
 *
 * Auth: Required (TODO: uncomment authenticate middleware)
 * Params: id (string)
 * Response: 200 { data: [Resource] }
 * Errors: 401 (unauthorized), 404 (not found)
 */
[resources].get(
  '/:id',
  // authenticate,       // TODO: Uncomment if auth required
  async (c: Context) => {
    try {
      // TODO: Initialize service with KV
      // const kv = await getKv();
      // const service = new [Resource]Service(kv);

      const id = c.req.param('id');
      const [resource] = await service.findById(id);

      if (![resource]) {
        return c.json({
          error: {
            code: 'NOT_FOUND',
            message: '[Resource] not found',
          },
        }, 404);
      }

      return c.json({ data: [resource] }, 200);
    } catch (error) {
      console.error('[Resource] get error:', error);
      return c.json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get [resource]',
        },
      }, 500);
    }
  }
);

// =============================================================================
// UPDATE
// =============================================================================

/**
 * PUT /api/v1/[resources]/:id
 * Update a [resource]
 *
 * Auth: Required (TODO: uncomment authenticate middleware)
 * Params: id (string)
 * Body: Update[Resource] (partial)
 * Response: 200 { data: [Resource] }
 * Errors: 400 (validation), 401 (unauthorized), 404 (not found), 409 (conflict)
 */
[resources].put(
  '/:id',
  // authenticate,          // TODO: Uncomment if auth required
  // validate[Resource],    // TODO: Uncomment if validation middleware exists
  async (c: Context) => {
    try {
      // TODO: Initialize service with KV
      // const kv = await getKv();
      // const service = new [Resource]Service(kv);

      const id = c.req.param('id');
      const body = await c.req.json();

      const updated = await service.update(id, body);

      if (!updated) {
        return c.json({
          error: {
            code: 'NOT_FOUND',
            message: '[Resource] not found',
          },
        }, 404);
      }

      return c.json({ data: updated }, 200);
    } catch (error) {
      if (error instanceof ValidationError) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            details: error.details,
          },
        }, 400);
      }

      if (error instanceof ConflictError) {
        return c.json({
          error: {
            code: 'CONFLICT',
            message: error.message,
          },
        }, 409);
      }

      console.error('[Resource] update error:', error);
      return c.json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update [resource]',
        },
      }, 500);
    }
  }
);

// =============================================================================
// DELETE
// =============================================================================

/**
 * DELETE /api/v1/[resources]/:id
 * Delete a [resource]
 *
 * Auth: Required (TODO: uncomment authenticate middleware)
 * Params: id (string)
 * Response: 204 (no content)
 * Errors: 401 (unauthorized), 404 (not found)
 */
[resources].delete(
  '/:id',
  // authenticate,       // TODO: Uncomment if auth required
  async (c: Context) => {
    try {
      // TODO: Initialize service with KV
      // const kv = await getKv();
      // const service = new [Resource]Service(kv);

      const id = c.req.param('id');
      const deleted = await service.delete(id);

      if (!deleted) {
        return c.json({
          error: {
            code: 'NOT_FOUND',
            message: '[Resource] not found',
          },
        }, 404);
      }

      return c.body(null, 204);
    } catch (error) {
      console.error('[Resource] delete error:', error);
      return c.json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete [resource]',
        },
      }, 500);
    }
  }
);

// =============================================================================
// CUSTOM ENDPOINTS (Add below)
// =============================================================================

/**
 * TODO: Add custom endpoints for non-CRUD operations
 * Examples:
 * - POST /api/v1/[resources]/:id/action
 * - GET /api/v1/[resources]/search
 * - PATCH /api/v1/[resources]/:id/status
 */

// Export router
export default [resources];
