/**
 * Type declarations for Hono context extensions
 * 
 * Extends Hono's Context with custom variables set by middleware:
 * - user: JWT payload from auth middleware
 * - validatedBody: Validated request body from validateBody middleware
 * - validatedQuery: Validated query params from validateQuery middleware
 * - validatedParams: Validated path params from validateParams middleware
 */

import { JWTPayload } from '../lib/jwt.ts';

/**
 * Custom context variables available after middleware
 */
export interface HonoContextVariables {
  // From auth middleware
  user?: JWTPayload;
  
  // From validation middleware
  validatedBody?: unknown;
  validatedQuery?: unknown;
  validatedParams?: unknown;
}

/**
 * Type helper to get validated data from context
 * 
 * @example
 * ```typescript
 * app.post('/users', validateBody(CreateUserSchema), async (c) => {
 *   const data = c.get('validatedBody') as Validated<typeof CreateUserSchema>;
 *   // data is fully typed
 * });
 * ```
 */
export type Validated<T> = T extends { _output: infer O } ? O : never;
