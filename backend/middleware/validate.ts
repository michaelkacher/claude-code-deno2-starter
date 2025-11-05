/**
 * Request Validation Middleware
 * 
 * Provides middleware for validating request bodies and query parameters
 * using Zod schemas. Ensures type safety and consistent error responses.
 * 
 * Features:
 * - Automatic validation with Zod
 * - Type-safe validated data in context
 * - Consistent error responses
 * - Support for body and query validation
 * 
 * @example
 * ```typescript
 * import { validateBody, validateQuery } from '../middleware/validate.ts';
 * import { CreateUserSchema } from '../types/user.ts';
 * 
 * app.post('/users', validateBody(CreateUserSchema), async (c) => {
 *   const data = c.get('validatedBody'); // Type-safe!
 *   // Data is already validated
 * });
 * ```
 */

import { Context, Next } from 'hono';
import { ZodError, ZodSchema } from 'zod';
import { createLogger } from '../lib/logger.ts';

const logger = createLogger('Validation');

/**
 * Format Zod error for API response
 */
function formatZodError(error: ZodError) {
  return {
    code: 'VALIDATION_ERROR',
    message: 'Invalid request data',
    details: error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code,
    })),
  };
}

/**
 * Validate request body against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @returns Hono middleware function
 * 
 * @example
 * ```typescript
 * const CreateUserSchema = z.object({
 *   email: z.string().email(),
 *   name: z.string().min(2),
 * });
 * 
 * app.post('/users', validateBody(CreateUserSchema), async (c) => {
 *   const data = c.get('validatedBody');
 *   // data is typed as { email: string; name: string }
 * });
 * ```
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async function(c: Context, next: Next) {
    try {
      // Parse request body
      const body = await c.req.json();
      
      // Validate against schema
      const validated = schema.parse(body);
      
      // Store validated data in context
      c.set('validatedBody', validated);
      
      // Continue to route handler
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Body validation failed', undefined, { 
          path: c.req.path,
          errors: error.errors,
        });
        
        return c.json({ error: formatZodError(error) }, 400);
      }
      
      // Re-throw non-Zod errors
      throw error;
    }
  };
}

/**
 * Validate query parameters against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @returns Hono middleware function
 * 
 * @example
 * ```typescript
 * const ListUsersQuerySchema = z.object({
 *   page: z.string().regex(/^\d+$/).transform(Number).default('1'),
 *   limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
 *   search: z.string().optional(),
 * });
 * 
 * app.get('/users', validateQuery(ListUsersQuerySchema), async (c) => {
 *   const query = c.get('validatedQuery');
 *   // query is typed with validated and transformed values
 * });
 * ```
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return async function(c: Context, next: Next) {
    try {
      // Get query parameters
      const query = c.req.query();
      
      // Validate against schema
      const validated = schema.parse(query);
      
      // Store validated data in context
      c.set('validatedQuery', validated);
      
      // Continue to route handler
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Query validation failed', undefined, { 
          path: c.req.path,
          errors: error.errors,
        });
        
        return c.json({ error: formatZodError(error) }, 400);
      }
      
      // Re-throw non-Zod errors
      throw error;
    }
  };
}

/**
 * Validate path parameters against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @returns Hono middleware function
 * 
 * @example
 * ```typescript
 * const UserIdParamSchema = z.object({
 *   id: z.string().uuid(),
 * });
 * 
 * app.get('/users/:id', validateParams(UserIdParamSchema), async (c) => {
 *   const params = c.get('validatedParams');
 *   // params.id is validated as UUID
 * });
 * ```
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return async function(c: Context, next: Next) {
    try {
      // Get path parameters
      const params = c.req.param();
      
      // Validate against schema
      const validated = schema.parse(params);
      
      // Store validated data in context
      c.set('validatedParams', validated);
      
      // Continue to route handler
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Params validation failed', undefined, { 
          path: c.req.path,
          errors: error.errors,
        });
        
        return c.json({ error: formatZodError(error) }, 400);
      }
      
      // Re-throw non-Zod errors
      throw error;
    }
  };
}
