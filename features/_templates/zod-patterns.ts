/**
 * Reusable Zod validation patterns
 *
 * Use these patterns instead of rewriting common validations to:
 * - Save tokens (less code to read/write)
 * - Ensure consistency across features
 * - Maintain type safety
 *
 * @example
 * ```typescript
 * import { idField, nameField, timestampFields } from '../_templates/zod-patterns.ts';
 *
 * const UserSchema = z.object({
 *   ...idField,
 *   ...nameField,
 *   ...timestampFields,
 *   email: z.string().email(),
 * });
 * ```
 */

import { z } from 'zod';

// ============================================================================
// Common Field Patterns
// ============================================================================

export const idField = {
  id: z.string().uuid(),
} as const;

export const timestampFields = {
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
} as const;

export const nameField = {
  name: z.string().min(1).max(100),
} as const;

export const descriptionField = {
  description: z.string().max(500).nullable(),
} as const;

export const emailField = {
  email: z.string().email(),
} as const;

export const urlField = {
  url: z.string().url(),
} as const;

export const statusField = {
  status: z.enum(['active', 'inactive', 'deleted']),
} as const;

// ============================================================================
// Pagination
// ============================================================================

export const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().optional(),
});

export type Pagination = z.infer<typeof paginationSchema>;

// ============================================================================
// Schema Generators
// ============================================================================

/**
 * Generate Create schema from base schema (omits id, timestamps)
 */
export function createSchemaFrom<T extends z.ZodObject<any>>(schema: T) {
  return schema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });
}

/**
 * Generate Update schema from base schema (partial, omits id, createdAt)
 */
export function updateSchemaFrom<T extends z.ZodObject<any>>(schema: T) {
  return schema
    .omit({
      id: true,
      createdAt: true,
      updatedAt: true,
    })
    .partial();
}

/**
 * Generate all CRUD schemas from base schema
 *
 * @example
 * ```typescript
 * const UserSchema = z.object({
 *   ...idField,
 *   ...nameField,
 *   ...emailField,
 *   ...timestampFields,
 * });
 *
 * export const { UserSchema, CreateUserSchema, UpdateUserSchema } =
 *   generateCRUDSchemas('User', UserSchema);
 * ```
 */
export function generateCRUDSchemas<T extends z.ZodObject<any>>(
  _name: string,
  baseSchema: T
) {
  return {
    base: baseSchema,
    create: createSchemaFrom(baseSchema),
    update: updateSchemaFrom(baseSchema),
  };
}

// ============================================================================
// Response Wrappers
// ============================================================================

/**
 * Wrap data schema in standard success response format
 */
export function successResponse<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: dataSchema,
  });
}

/**
 * Wrap item schema in standard list response format (with cursor pagination)
 */
export function listResponse<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    cursor: z.string().nullable(),
  });
}

// ============================================================================
// Error Response Schema
// ============================================================================

export const errorSchema = z.object({
  error: z.object({
    code: z.enum([
      'VALIDATION_ERROR',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'CONFLICT',
      'INTERNAL_ERROR',
    ]),
    message: z.string(),
    details: z.record(z.any()).optional(),
  }),
});

export type ErrorResponse = z.infer<typeof errorSchema>;

// ============================================================================
// Example Usage (Comment out in production)
// ============================================================================

/*
// Example: Define a User schema with patterns
const UserSchema = z.object({
  ...idField,
  ...nameField,
  ...emailField,
  role: z.enum(['admin', 'user']),
  ...timestampFields,
});

// Generate CRUD schemas
const { base, create, update } = generateCRUDSchemas('User', UserSchema);

export const UserSchema = base;
export const CreateUserSchema = create;
export const UpdateUserSchema = update;

// Export types
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

// API response schemas
export const UserResponseSchema = successResponse(UserSchema);
export const UsersListResponseSchema = listResponse(UserSchema);
*/
