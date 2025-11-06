/**
 * Pagination Utilities
 * 
 * Provides standardized pagination handling with enforced limits.
 * Prevents users from requesting excessively large result sets.
 * 
 * Features:
 * - Maximum limit enforcement (default: 100 items per page)
 * - Default limit when not specified (default: 10 items)
 * - Cursor-based pagination support
 * - Type-safe pagination parameters
 * - Standardized pagination response format
 * 
 * @example
 * ```typescript
 * import { getPaginationParams, createPaginatedResponse } from './lib/pagination.ts';
 * 
 * app.get('/api/users', async (c) => {
 *   const { limit, cursor } = getPaginationParams(c);
 *   const result = await userService.findAll({ limit, cursor });
 *   return c.json(createPaginatedResponse(result));
 * });
 * ```
 */

import type { Context } from 'hono';

/**
 * Pagination configuration
 */
export const PAGINATION_CONFIG = {
  /** Default number of items per page when not specified */
  DEFAULT_LIMIT: 10,
  
  /** Maximum number of items per page (hard limit) */
  MAX_LIMIT: 100,
  
  /** Minimum number of items per page */
  MIN_LIMIT: 1,
} as const;

/**
 * Pagination parameters extracted from request
 */
export interface PaginationParams {
  /** Number of items to return (enforced between MIN_LIMIT and MAX_LIMIT) */
  limit: number;
  
  /** Cursor for pagination (optional) */
  cursor?: string;
  
  /** Offset for offset-based pagination (optional, alternative to cursor) */
  offset?: number;
}

/**
 * Paginated response data
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    cursor?: string;
    nextCursor?: string;
    hasMore: boolean;
    total?: number;
  };
}

/**
 * Extract and validate pagination parameters from request
 * 
 * @param c - Hono context
 * @param options - Optional configuration overrides
 * @returns Validated pagination parameters
 * 
 * @example
 * ```typescript
 * // Default limits
 * const params = getPaginationParams(c);
 * 
 * // Custom max limit for specific endpoint
 * const params = getPaginationParams(c, { maxLimit: 50 });
 * ```
 */
export function getPaginationParams(
  c: Context,
  options?: {
    maxLimit?: number;
    defaultLimit?: number;
  }
): PaginationParams {
  const maxLimit = options?.maxLimit ?? PAGINATION_CONFIG.MAX_LIMIT;
  const defaultLimit = options?.defaultLimit ?? PAGINATION_CONFIG.DEFAULT_LIMIT;
  
  // Get limit from query parameter
  const limitParam = c.req.query('limit');
  let limit = defaultLimit;
  
  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10);
    
    if (isNaN(parsedLimit)) {
      // Invalid number, use default
      limit = defaultLimit;
    } else if (parsedLimit < PAGINATION_CONFIG.MIN_LIMIT) {
      // Below minimum, use minimum
      limit = PAGINATION_CONFIG.MIN_LIMIT;
    } else if (parsedLimit > maxLimit) {
      // Above maximum, enforce maximum
      limit = maxLimit;
    } else {
      // Valid range
      limit = parsedLimit;
    }
  }
  
  // Get cursor (for cursor-based pagination)
  const cursor = c.req.query('cursor') || undefined;
  
  // Get offset (for offset-based pagination)
  const offsetParam = c.req.query('offset');
  let offset: number | undefined;
  
  if (offsetParam) {
    const parsedOffset = parseInt(offsetParam, 10);
    if (!isNaN(parsedOffset) && parsedOffset >= 0) {
      offset = parsedOffset;
    }
  }
  
  return { limit, cursor, offset };
}

/**
 * Create standardized paginated response
 * 
 * @param data - Array of items for current page
 * @param options - Pagination metadata
 * @returns Paginated response object
 * 
 * @example
 * ```typescript
 * const users = await userService.findAll({ limit: 10 });
 * return c.json(createPaginatedResponse(users, {
 *   limit: 10,
 *   nextCursor: 'abc123',
 *   hasMore: true,
 *   total: 156
 * }));
 * ```
 */
export function createPaginatedResponse<T>(
  data: T[],
  options: {
    limit: number;
    cursor?: string;
    nextCursor?: string;
    hasMore?: boolean;
    total?: number;
  }
): PaginatedResponse<T> {
  const { limit, cursor, nextCursor, total } = options;
  
  // Determine if there are more results
  // If nextCursor is provided, use that
  // Otherwise, check if we got a full page (might indicate more)
  const hasMore = options.hasMore ?? (nextCursor !== undefined);
  
  return {
    data,
    pagination: {
      limit,
      ...(cursor && { cursor }),
      ...(nextCursor && { nextCursor }),
      hasMore,
      ...(total !== undefined && { total }),
    },
  };
}

/**
 * Helper to extract next cursor from Deno KV list result
 * 
 * @param entries - Array of KV entries
 * @param limit - Number of items requested
 * @returns Next cursor if more results available
 * 
 * @example
 * ```typescript
 * const entries = [];
 * for await (const entry of kv.list({ prefix: ['users'] }, { limit: limit + 1 })) {
 *   entries.push(entry);
 * }
 * 
 * const items = entries.slice(0, limit);
 * const nextCursor = getNextCursor(entries, limit);
 * ```
 */
export function getNextCursor<T>(
  entries: Array<{ key: Deno.KvKey; value: T }>,
  limit: number
): string | undefined {
  if (entries.length > limit) {
    // We fetched limit + 1, so there are more results
    const lastEntry = entries[limit - 1];
    // Use the last key as cursor
    return JSON.stringify(lastEntry.key);
  }
  return undefined;
}

/**
 * Parse cursor back into Deno KV key
 * 
 * @param cursor - Cursor string (JSON-encoded key)
 * @returns Decoded Deno KV key
 */
export function parseCursor(cursor: string): Deno.KvKey {
  try {
    return JSON.parse(cursor) as Deno.KvKey;
  } catch {
    // Invalid cursor, return empty key
    return [];
  }
}

/**
 * Middleware to validate and enforce pagination limits
 * Use this before route handlers that support pagination
 * 
 * @example
 * ```typescript
 * import { validatePagination } from './lib/pagination.ts';
 * 
 * app.get('/api/users', validatePagination(), async (c) => {
 *   // Pagination params are already validated
 *   const { limit, cursor } = getPaginationParams(c);
 *   // ...
 * });
 * ```
 */
export function validatePagination(options?: {
  maxLimit?: number;
  defaultLimit?: number;
}) {
  return async (c: Context, next: () => Promise<void>) => {
    // Extract and validate params (this ensures they're valid)
    getPaginationParams(c, options);
    await next();
  };
}

/**
 * Calculate offset and limit for SQL-style pagination
 * 
 * @param page - Page number (1-based)
 * @param pageSize - Items per page
 * @param maxLimit - Maximum allowed page size
 * @returns Object with offset and limit
 * 
 * @example
 * ```typescript
 * const { offset, limit } = getOffsetLimit(2, 20); // page 2, 20 items per page
 * // offset: 20, limit: 20
 * ```
 */
export function getOffsetLimit(
  page: number,
  pageSize: number,
  maxLimit: number = PAGINATION_CONFIG.MAX_LIMIT
): { offset: number; limit: number } {
  // Validate and enforce limits
  const validPage = Math.max(1, Math.floor(page));
  const validPageSize = Math.min(
    maxLimit,
    Math.max(PAGINATION_CONFIG.MIN_LIMIT, Math.floor(pageSize))
  );
  
  return {
    offset: (validPage - 1) * validPageSize,
    limit: validPageSize,
  };
}

/**
 * Helper to validate total count
 * Use this when you need to return total count but want to cap it
 * 
 * @param count - Actual count from database
 * @param maxCount - Maximum count to return (default: 10000)
 * @returns Capped count or "10000+" if over limit
 */
export function formatTotalCount(
  count: number,
  maxCount: number = 10000
): number | string {
  if (count > maxCount) {
    return `${maxCount}+`;
  }
  return count;
}
