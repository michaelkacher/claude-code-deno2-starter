# Backend Code Patterns Reference

This file contains standard backend implementation patterns. **Use these patterns to save tokens and ensure consistency.**

## Pattern Selection Guide

| Pattern | Use When | Token Savings | Template File |
|---------|----------|---------------|---------------|
| `CRUD_SERVICE` | Simple CRUD operations | ~600-800 | `service-crud.template.ts` |
| `CRUD_ROUTES` | Standard REST endpoints | ~400-600 | `routes-crud.template.ts` |
| `CUSTOM_SERVICE` | Complex business logic | ~200-300 | `service-custom.template.ts` |
| `VALIDATION_MIDDLEWARE` | Input validation | ~100-150 | `validation.template.ts` |

## Service Patterns

### Pattern: `CRUD_SERVICE` (Deno KV)

Complete CRUD service with Deno KV persistence and secondary indexes.

**Operations covered**:
- ✅ Create with validation
- ✅ Read by ID
- ✅ Read by secondary index (e.g., email, name)
- ✅ List with cursor pagination
- ✅ Update with validation
- ✅ Delete (with cleanup of indexes)

**Template structure**:
```typescript
export class ResourceService {
  constructor(private kv: Deno.Kv) {}

  async create(input: CreateResourceInput): Promise<Resource>
  async findById(id: string): Promise<Resource | null>
  async findByField(field: string): Promise<Resource | null>
  async findAll(options: PaginationOptions): Promise<PaginatedResult<Resource>>
  async update(id: string, updates: UpdateResourceInput): Promise<Resource | null>
  async delete(id: string): Promise<boolean>
}
```

**Token savings**: ~600-800 tokens vs writing from scratch

---

### Pattern: `VALIDATION_SERVICE`

Common validation functions used across services.

```typescript
// String validations
isValidEmail(email: string): boolean
isValidUUID(id: string): boolean
isValidUrl(url: string): boolean

// Length validations
isWithinLength(str: string, min: number, max: number): boolean
isNotEmpty(str: string): boolean

// Numeric validations
isWithinRange(num: number, min: number, max: number): boolean
isPositive(num: number): boolean

// Date validations
isValidDate(dateStr: string): boolean
isFutureDate(dateStr: string): boolean
isPastDate(dateStr: string): boolean
```

---

### Pattern: `SECONDARY_INDEX`

Standard pattern for maintaining secondary indexes in Deno KV.

```typescript
// Create with index
await kv.atomic()
  .set(['resources', id], resource)
  .set(['resources_by_field', field], id)
  .commit();

// Find by index
const idEntry = await kv.get<string>(['resources_by_field', field]);
if (!idEntry.value) return null;

const resourceEntry = await kv.get<Resource>(['resources', idEntry.value]);
return resourceEntry.value;

// Delete with index cleanup
await kv.atomic()
  .delete(['resources', id])
  .delete(['resources_by_field', field])
  .commit();
```

---

### Pattern: `PAGINATION`

Cursor-based pagination with Deno KV.

```typescript
async findAll(options: { limit?: number; cursor?: string } = {}) {
  const limit = options.limit || 10;
  const items: Resource[] = [];

  const entries = this.kv.list<Resource>({
    prefix: ['resources'],
    limit: limit + 1,  // Request 1 extra to detect next page
    cursor: options.cursor,
  });

  let nextCursor: string | undefined;
  let count = 0;

  for await (const entry of entries) {
    if (count < limit) {
      items.push(entry.value);
      count++;
    } else {
      nextCursor = entry.cursor;
    }
  }

  return { data: items, cursor: nextCursor || null };
}
```

---

## Route Patterns

### Pattern: `CRUD_ROUTES`

Standard RESTful routes for a resource.

**Endpoints**:
- `POST /api/v1/resources` - Create
- `GET /api/v1/resources` - List (with pagination)
- `GET /api/v1/resources/:id` - Get by ID
- `PUT /api/v1/resources/:id` - Update
- `DELETE /api/v1/resources/:id` - Delete

**Template structure**:
```typescript
import { Hono } from 'hono';
import { ResourceService } from '../services/resource.ts';
import { authenticate } from '../middleware/auth.ts';
import { validateResource } from '../middleware/validation.ts';

const routes = new Hono();
const service = new ResourceService();

routes.post('/', authenticate, validateResource, async (c) => { /* ... */ });
routes.get('/', authenticate, async (c) => { /* ... */ });
routes.get('/:id', authenticate, async (c) => { /* ... */ });
routes.put('/:id', authenticate, validateResource, async (c) => { /* ... */ });
routes.delete('/:id', authenticate, async (c) => { /* ... */ });

export default routes;
```

**Token savings**: ~400-600 tokens vs writing from scratch

---

### Pattern: `ERROR_RESPONSE`

Standard error response format.

```typescript
// In route handler
try {
  const result = await service.operation();
  return c.json({ data: result }, 200);
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

  if (error instanceof NotFoundError) {
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: error.message,
      },
    }, 404);
  }

  // Unexpected error
  console.error('Unexpected error:', error);
  return c.json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  }, 500);
}
```

---

### Pattern: `SUCCESS_RESPONSE`

Standard success response format.

```typescript
// Single resource
return c.json({ data: resource }, 200);

// Created resource
return c.json({ data: resource }, 201);

// List of resources (with pagination)
return c.json({
  data: resources,
  cursor: nextCursor,
}, 200);

// Delete (no content)
return c.body(null, 204);
```

---

## Middleware Patterns

### Pattern: `VALIDATION_MIDDLEWARE`

Zod-based request validation middleware.

```typescript
import { z } from 'zod';
import { ValidationError } from '../lib/errors.ts';

export const createResourceSchema = z.object({
  field1: z.string().min(1).max(100),
  field2: z.number().min(0),
});

export async function validateCreateResource(c: Context, next: () => Promise<void>) {
  try {
    const body = await c.req.json();
    createResourceSchema.parse(body);
    await next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        'Validation failed',
        error.errors.reduce((acc, err) => ({
          ...acc,
          [err.path.join('.')]: err.message,
        }), {})
      );
    }
    throw error;
  }
}
```

---

### Pattern: `AUTH_MIDDLEWARE`

Authentication middleware (placeholder for JWT/session).

```typescript
export async function authenticate(c: Context, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedError('Missing authentication token');
  }

  try {
    // Verify JWT token (implement based on auth method)
    // const decoded = await verifyJWT(token);
    // c.set('user', decoded);

    await next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
```

---

## Error Patterns

### Pattern: `CUSTOM_ERRORS`

Custom error classes for different scenarios.

```typescript
export class BaseError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string = 'Resource already exists') {
    super(409, 'CONFLICT', message);
  }
}
```

---

## Deno KV Key Patterns

### Pattern: `KEY_STRUCTURE`

Standard key structure for different operations.

```typescript
// Primary records
['resources', resourceId] -> Resource

// Secondary indexes (unique field)
['resources_by_email', email] -> resourceId
['resources_by_username', username] -> resourceId

// Secondary indexes (non-unique - for listing/filtering)
['resources_by_status', status, resourceId] -> null
['resources_by_date', dateKey, resourceId] -> null

// User-scoped resources
['users', userId, 'resources', resourceId] -> Resource

// Relationships
['user_resources', userId, resourceId] -> null
['resource_users', resourceId, userId] -> null
```

---

## Token Savings Summary

| Pattern | Saves per Usage | How |
|---------|-----------------|-----|
| CRUD_SERVICE template | ~600-800 tokens | Complete service vs from scratch |
| CRUD_ROUTES template | ~400-600 tokens | 5 endpoints vs individual |
| Validation middleware | ~100-150 tokens | Reuse vs custom |
| Error classes | ~200 tokens | Import vs define |
| KV key patterns | ~50 tokens/op | Reference vs design |
| **Total per feature** | **~1400-1900 tokens** | **Per CRUD feature** |

---

## Usage in Backend Agent

When the agent implements a service:

1. **Identify CRUD operations** → Use `CRUD_SERVICE` template
2. **Identify routes needed** → Use `CRUD_ROUTES` template
3. **Identify validations** → Reference Zod schemas from data-models
4. **Generate code** → Reference patterns, don't repeat boilerplate

This approach saves 50-60% tokens in backend implementation phase.

---

## Best Practices

1. ✅ **Use templates** - Start with CRUD templates for simple services
2. ✅ **Reference patterns** - Use standard error handling, pagination, indexes
3. ✅ **Import validations** - Use Zod schemas from data-models.md
4. ✅ **Follow conventions** - Consistent naming, structure, patterns
5. ❌ **Don't repeat boilerplate** - Use templates and patterns
6. ❌ **Don't skip error handling** - Use standard error patterns
7. ❌ **Don't forget indexes** - Use secondary index patterns

---

## Integration with Other Phases

**API Design** → defines endpoints and validation
**Test Writing** → defines expected behavior
**Backend Implementation** → uses these patterns to implement

All three phases should reference the same patterns for consistency and token efficiency.
