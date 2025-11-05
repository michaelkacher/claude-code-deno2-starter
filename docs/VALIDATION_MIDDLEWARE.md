# Request Validation Middleware - Usage Examples

## Overview

The validation middleware provides type-safe request validation using Zod schemas. It automatically validates request bodies, query parameters, and path parameters before they reach your route handlers.

## Features

- **Type Safety**: Validated data is fully typed
- **Automatic Validation**: Runs before route handlers
- **Consistent Errors**: Standardized error responses
- **Zod Integration**: Leverage Zod's powerful validation features
- **Multiple Validators**: Body, query, and params validation

## Basic Usage

### 1. Body Validation

```typescript
import { validateBody } from '../middleware/validate.ts';
import { SignupSchema } from '../types/user.ts';

// Define schema
const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

// Use in route
app.post('/signup', validateBody(SignupSchema), async (c) => {
  // Data is already validated
  const { email, password, name } = c.get('validatedBody') as z.infer<typeof SignupSchema>;
  
  // No need for manual validation!
  // Type-safe access to data
});
```

### 2. Query Parameter Validation

```typescript
import { validateQuery } from '../middleware/validate.ts';

const ListUsersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  search: z.string().optional(),
  role: z.enum(['admin', 'user']).optional(),
});

app.get('/users', validateQuery(ListUsersQuerySchema), async (c) => {
  const { page, limit, search, role } = c.get('validatedQuery') as {
    page: number;      // Transformed from string!
    limit: number;     // Transformed from string!
    search?: string;
    role?: 'admin' | 'user';
  };
  
  // All types are correct, numbers are parsed
});
```

### 3. Path Parameter Validation

```typescript
import { validateParams } from '../middleware/validate.ts';

const UserIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

app.get('/users/:id', validateParams(UserIdParamSchema), async (c) => {
  const { id } = c.get('validatedParams') as { id: string };
  
  // ID is validated as UUID format
});
```

## Advanced Examples

### Schema with Transforms

```typescript
const DateRangeQuerySchema = z.object({
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .transform(str => new Date(str)),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .transform(str => new Date(str)),
  timezone: z.string().default('UTC'),
});

app.get('/reports', validateQuery(DateRangeQuerySchema), async (c) => {
  const { startDate, endDate, timezone } = c.get('validatedQuery') as {
    startDate: Date;  // Transformed to Date object!
    endDate: Date;
    timezone: string;
  };
});
```

### Schema with Custom Validation

```typescript
const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

app.post('/change-password', validateBody(PasswordChangeSchema), async (c) => {
  const { currentPassword, newPassword } = c.get('validatedBody') as {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  
  // Password match is already validated!
});
```

### Combining Multiple Validators

```typescript
app.put(
  '/users/:id',
  validateParams(UserIdParamSchema),
  validateBody(UpdateUserSchema),
  async (c) => {
    const { id } = c.get('validatedParams') as { id: string };
    const updateData = c.get('validatedBody') as UpdateUser;
    
    // Both params and body are validated
  }
);
```

### Optional Fields with Defaults

```typescript
const PaginationQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('1'),
  limit: z.string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('10')
    .refine(val => val <= 100, 'Limit cannot exceed 100'),
  sort: z.enum(['asc', 'desc']).default('desc'),
});
```

## Error Responses

When validation fails, the middleware returns a consistent error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "path": "email",
        "message": "Invalid email address",
        "code": "invalid_string"
      },
      {
        "path": "password",
        "message": "Password must be at least 8 characters",
        "code": "too_small"
      }
    ]
  }
}
```

Status code: `400 Bad Request`

## Best Practices

### 1. Define Schemas in Type Files

Keep schemas organized with your type definitions:

```typescript
// backend/types/user.ts
export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export type SignupRequest = z.infer<typeof SignupSchema>;
```

### 2. Use Descriptive Error Messages

```typescript
const EmailSchema = z.string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');
```

### 3. Transform Data Early

Let Zod transform strings to the types you need:

```typescript
const FilterQuerySchema = z.object({
  active: z.enum(['true', 'false']).transform(val => val === 'true'),
  limit: z.string().regex(/^\d+$/).transform(Number),
});
```

### 4. Validate Enums for Type Safety

```typescript
const RoleSchema = z.enum(['admin', 'user', 'moderator']);
// TypeScript will enforce these exact values
```

### 5. Add Context to Logs

The middleware automatically logs validation failures with context:

```typescript
// Logged automatically:
// {
//   level: 'warn',
//   message: 'Body validation failed',
//   context: 'Validation',
//   meta: {
//     path: '/api/signup',
//     errors: [...]
//   }
// }
```

## Integration with Existing Routes

### Before (Manual Validation)

```typescript
app.post('/users', async (c) => {
  try {
    const body = await c.req.json();
    const result = UserSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }
    
    const data = result.data;
    // ... use data
  } catch (error) {
    return c.json({ error: 'Invalid JSON' }, 400);
  }
});
```

### After (Validation Middleware)

```typescript
app.post('/users', validateBody(UserSchema), async (c) => {
  const data = c.get('validatedBody') as User;
  // Data is already validated and typed!
});
```

## Type Safety Tips

### Get Full Type Inference

```typescript
// Define schema
const CreatePostSchema = z.object({
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
});

// Export type
export type CreatePost = z.infer<typeof CreatePostSchema>;

// Use in route with type
app.post('/posts', validateBody(CreatePostSchema), async (c) => {
  const data = c.get('validatedBody') as CreatePost;
  // Full autocomplete and type checking!
});
```

### Use Zod's Output Type for Transforms

```typescript
const QuerySchema = z.object({
  page: z.string().transform(Number),
});

type QueryInput = z.input<typeof QuerySchema>;   // { page: string }
type QueryOutput = z.output<typeof QuerySchema>; // { page: number }

// In route handler, use output type
const query = c.get('validatedQuery') as QueryOutput;
```

## Testing

```typescript
import { validateBody } from '../middleware/validate.ts';

Deno.test('validateBody returns 400 for invalid data', async () => {
  const app = new Hono();
  app.post('/test', validateBody(z.object({ email: z.string().email() })), (c) => {
    return c.json({ success: true });
  });

  const res = await app.request('/test', {
    method: 'POST',
    body: JSON.stringify({ email: 'invalid' }),
    headers: { 'Content-Type': 'application/json' },
  });

  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error.code, 'VALIDATION_ERROR');
});
```

## Common Patterns

### Pagination

```typescript
export const PaginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
});
```

### Date Range

```typescript
export const DateRangeQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
}).refine(data => new Date(data.from) < new Date(data.to), {
  message: 'Start date must be before end date',
});
```

### UUID Param

```typescript
export const UuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});
```

### Optional Search

```typescript
export const SearchQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
}).refine(data => data.q || data.category, {
  message: 'Either search query or category must be provided',
});
```

## Related Documentation

- [Zod Documentation](https://zod.dev)
- [Hono Middleware Guide](https://hono.dev/guides/middleware)
- [backend/types/user.ts](../types/user.ts) - Example schemas
- [backend/middleware/validate.ts](../middleware/validate.ts) - Implementation
