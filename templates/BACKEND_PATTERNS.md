# Backend Code Patterns Reference

This file contains standard backend implementation patterns for **Fresh 1.7.3 + Deno KV**. **Use these patterns to save tokens and ensure consistency.**

## Pattern Selection Guide

| Pattern | Use When | Token Savings | Implementation |
|---------|----------|---------------|----------------|
| `SERVICE_CRUD` | Business logic layer | ~600-800 | Static methods wrapping repositories |
| `REPOSITORY_CRUD` | Data access layer | ~600-800 | Repository pattern with Deno KV |
| `WEBSOCKET_BROADCAST` | Real-time updates | ~200-300 | Channel-based WebSocket notifications |
| `FRESH_HANDLERS` | Standard REST endpoints | ~400-600 | Fresh API route handlers |
| `ZOD_VALIDATION` | Input validation | ~100-150 | Zod schemas in route handlers |

## Service Patterns

### Pattern: `SERVICE_CRUD` (Static Methods + WebSocket)

Complete CRUD service with static methods, repository delegation, and WebSocket broadcasting.

**Operations covered**:
- ✅ Create with WebSocket broadcast
- ✅ Read by ID
- ✅ List with pagination
- ✅ Update with WebSocket broadcast
- ✅ Delete with WebSocket broadcast
- ✅ Custom business logic methods

**Service structure (`shared/services/resource.ts`)**:
```typescript
import { ResourceRepository } from '../repositories/resource-repository.ts';
import { notifyUser, sendToUser, broadcast } from '../lib/notification-websocket.ts';
import type { CreateResourceRequest, ResourceData } from '../types/resources.ts';

/**
 * Resource Service
 * Thin wrapper around ResourceRepository with WebSocket broadcasting
 */
export class ResourceService {
  private static repo = new ResourceRepository();

  /**
   * Create a new resource
   */
  static async create(userId: string, data: CreateResourceRequest): Promise<ResourceData> {
    // Create via repository
    const resource = await this.repo.create(userId, data);

    // Broadcast to user's WebSocket connection
    await notifyUser(userId, {
      type: 'resource_created',
      data: resource
    });

    return resource;
  }

  /**
   * Get resource by ID
   */
  static async getById(userId: string, resourceId: string): Promise<ResourceData | null> {
    return await this.repo.findById(userId, resourceId);
  }

  /**
   * List resources with pagination
   */
  static async list(userId: string, options?: { page?: number; limit?: number }) {
    return await this.repo.list(userId, options);
  }

  /**
   * Update resource
   */
  static async update(
    userId: string,
    resourceId: string,
    updates: Partial<ResourceData>
  ): Promise<ResourceData | null> {
    const updated = await this.repo.update(userId, resourceId, updates);
    if (!updated) return null;

    // Broadcast update to user's channel
    await sendToUser(userId, 'resources', {
      type: 'resource_updated',
      data: updated
    });

    return updated;
  }

  /**
   * Delete resource
   */
  static async delete(userId: string, resourceId: string): Promise<boolean> {
    const deleted = await this.repo.delete(userId, resourceId);
    if (!deleted) return false;

    // Broadcast deletion
    await sendToUser(userId, 'resources', {
      type: 'resource_deleted',
      data: { id: resourceId }
    });

    return true;
  }

  /**
   * Example business logic method
   */
  static async publish(userId: string, resourceId: string): Promise<ResourceData | null> {
    const resource = await this.repo.findById(userId, resourceId);
    if (!resource) return null;

    // Business logic
    if (resource.status !== 'draft') {
      throw new Error('Only draft resources can be published');
    }

    // Update via repository
    const published = await this.repo.update(userId, resourceId, {
      status: 'published',
      publishedAt: new Date().toISOString()
    });

    // Broadcast
    if (published) {
      await sendToUser(userId, 'resources', {
        type: 'resource_published',
        data: published
      });
    }

    return published;
  }
}
```

**Token savings**: ~600-800 tokens vs writing from scratch

---

## Repository Patterns

### Pattern: `REPOSITORY_CRUD` (Deno KV)

Complete CRUD repository with Deno KV persistence and secondary indexes.

**Operations covered**:
- ✅ Create with validation
- ✅ Read by ID
- ✅ Read by secondary index (e.g., email, name)
- ✅ List with pagination
- ✅ Update with validation
- ✅ Delete (with cleanup of indexes)

**Repository structure (`shared/repositories/resource-repository.ts`)**:
```typescript
import { BaseRepository } from './base-repository.ts';

export interface Resource {
  id: string;
  field1: string;
  field2: number;
  createdAt: string;
  updatedAt: string;
}

export class ResourceRepository extends BaseRepository<Resource> {
  constructor() {
    super('resources');
  }

  async create(data: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resource> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const resource: Resource = { id, ...data, createdAt: now, updatedAt: now };
    
    await this.kv.set(['resources', id], resource);
    return resource;
  }

  async findById(id: string): Promise<Resource | null> {
    const entry = await this.kv.get<Resource>(['resources', id]);
    return entry.value;
  }

  async findByField(field: string): Promise<Resource | null> {
    const idEntry = await this.kv.get<string>(['resources_by_field', field]);
    if (!idEntry.value) return null;
    return this.findById(idEntry.value);
  }

  async list(options: { page?: number; limit?: number } = {}): Promise<Resource[]> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;
    
    const items: Resource[] = [];
    const entries = this.kv.list<Resource>({ prefix: ['resources'] });
    
    let count = 0;
    for await (const entry of entries) {
      if (count >= offset && count < offset + limit) {
        items.push(entry.value);
      }
      count++;
      if (count >= offset + limit) break;
    }
    
    return items;
  }

  async update(id: string, updates: Partial<Resource>): Promise<Resource | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await this.kv.set(['resources', id], updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    
    await this.kv.delete(['resources', id]);
    return true;
  }
}
```

**Token savings**: ~600-800 tokens vs writing from scratch

---

### Pattern: `VALIDATION_SCHEMAS`

Zod validation schemas in `shared/types/resource.ts`.

```typescript
import { z } from "zod";

export const CreateResourceSchema = z.object({
  field1: z.string().min(1).max(100),
  field2: z.number().min(0),
});

export const UpdateResourceSchema = z.object({
  field1: z.string().min(1).max(100).optional(),
  field2: z.number().min(0).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

export type CreateResourceInput = z.infer<typeof CreateResourceSchema>;
export type UpdateResourceInput = z.infer<typeof UpdateResourceSchema>;
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

Page-based pagination with repositories.

```typescript
async list(options: { page?: number; limit?: number } = {}) {
  const page = options.page || 1;
  const limit = options.limit || 50;
  const offset = (page - 1) * limit;
  
  const items: Resource[] = [];
  const entries = this.kv.list<Resource>({ prefix: ['resources'] });
  
  let count = 0;
  for await (const entry of entries) {
    if (count >= offset && count < offset + limit) {
      items.push(entry.value);
    }
    count++;
    if (count >= offset + limit) break;
  }
  
  return items;
}
```

---

### Pattern: `WEBSOCKET_BROADCAST`

WebSocket broadcasting patterns for real-time updates.

**Available broadcast functions (`shared/lib/notification-websocket.ts`):**

```typescript
import { notifyUser, sendToUser, broadcast } from '../lib/notification-websocket.ts';

// 1. Notify specific user (notifications channel)
await notifyUser(userId, {
  type: 'notification_created',
  data: notification
});

// 2. Send to user's custom channel
await sendToUser(userId, 'resources', {
  type: 'resource_updated',
  data: resource
});

// 3. Broadcast to all connected clients
await broadcast({
  type: 'system_announcement',
  data: { message: 'Maintenance in 5 minutes' }
});
```

**Usage in services:**
```typescript
export class ResourceService {
  static async create(userId: string, data: CreateResourceRequest) {
    const resource = await this.repo.create(userId, data);
    
    // Broadcast to user's WebSocket connection
    await notifyUser(userId, {
      type: 'resource_created',
      data: resource
    });
    
    return resource;
  }

  static async delete(userId: string, resourceId: string) {
    const deleted = await this.repo.delete(userId, resourceId);
    
    // Broadcast deletion
    await sendToUser(userId, 'resources', {
      type: 'resource_deleted',
      data: { id: resourceId }
    });
    
    return deleted;
  }
}
```

**Channel subscription on frontend (`frontend/lib/websocket.ts`):**
```typescript
import { subscribeToChannel } from '../lib/websocket.ts';

// In component useEffect
const unsubscribe = subscribeToChannel('resources', (message) => {
  switch (message.type) {
    case 'resource_created':
      // Add to list
      break;
    case 'resource_updated':
      // Update in list
      break;
    case 'resource_deleted':
      // Remove from list
      break;
  }
});

return () => unsubscribe();
```

**Token savings**: ~200-300 tokens vs implementing from scratch

---

## Fresh API Route Patterns

### Pattern: `FRESH_HANDLERS`

Standard RESTful handlers for a resource using Fresh.

**Endpoints**:
- `POST /api/resources` - Create
- `GET /api/resources` - List (with pagination)
- `GET /api/resources/:id` - Get by ID
- `PATCH /api/resources/:id` - Update
- `DELETE /api/resources/:id` - Delete

### Pattern: `FRESH_HANDLERS`

Standard RESTful handlers for a resource using Fresh with Service layer.

**Endpoints**:
- `POST /api/resources` - Create
- `GET /api/resources` - List (with pagination)
- `GET /api/resources/:id` - Get by ID
- `PATCH /api/resources/:id` - Update
- `DELETE /api/resources/:id` - Delete

**Handler structure (`frontend/routes/api/resources/index.ts`)**:
```typescript
import { Handlers } from "$fresh/server.ts";
import { ResourceService } from "../../../../shared/services/resource.ts";
import { successResponse, errorResponse, requireAuth, type AppState } from "../../../lib/fresh-helpers.ts";
import { CreateResourceSchema } from "../../../../shared/types/resources.ts";
import { z } from "zod";

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    const user = requireAuth(ctx);
    
    try {
      const body = await req.json();
      const validatedData = CreateResourceSchema.parse(body);
      const resource = await ResourceService.create(user.sub, validatedData);
      return successResponse({ data: resource }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse('Validation failed', { status: 400, errors: error.errors });
      }
      throw error;
    }
  },
  
  async GET(req, ctx) {
    const user = requireAuth(ctx);
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    const resources = await ResourceService.list(user.sub, { page, limit });
    return successResponse({ data: resources });
  }
};
```

**Handler for single resource (`frontend/routes/api/resources/[id].ts`)**:
```typescript
import { Handlers } from "$fresh/server.ts";
import { ResourceService } from "../../../../shared/services/resource.ts";
import { successResponse, errorResponse, requireAuth, type AppState } from "../../../lib/fresh-helpers.ts";
import { UpdateResourceSchema } from "../../../../shared/types/resources.ts";
import { z } from "zod";

export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    const user = requireAuth(ctx);
    const id = ctx.params.id;
    
    const resource = await ResourceService.getById(user.sub, id);
    if (!resource) {
      return errorResponse('Resource not found', { status: 404, code: 'NOT_FOUND' });
    }
    
    return successResponse({ data: resource });
  },
  
  async PATCH(req, ctx) {
    const user = requireAuth(ctx);
    const id = ctx.params.id;
    
    try {
      const body = await req.json();
      const validatedData = UpdateResourceSchema.parse(body);
      
      const updated = await ResourceService.update(user.sub, id, validatedData);
      if (!updated) {
        return errorResponse('Resource not found', { status: 404, code: 'NOT_FOUND' });
      }
      
      return successResponse({ data: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse('Validation failed', { status: 400, errors: error.errors });
      }
      throw error;
    }
  },
  
  async DELETE(req, ctx) {
    const user = requireAuth(ctx);
    const id = ctx.params.id;
    
    const deleted = await ResourceService.delete(user.sub, id);
    if (!deleted) {
      return errorResponse('Resource not found', { status: 404, code: 'NOT_FOUND' });
    }
    
    return successResponse({ message: 'Resource deleted successfully' });
  }
};
```

**Token savings**: ~400-600 tokens vs writing from scratch

---

### Pattern: `ERROR_RESPONSE`

Standard error response format using Fresh helpers.

```typescript
// In route handler with Fresh helpers
import { errorResponse } from "../../../lib/fresh-helpers.ts";

// Validation error
if (error instanceof z.ZodError) {
  return errorResponse('Validation failed', {
    status: 400,
    errors: error.errors
  });
}

// Not found
return errorResponse('Resource not found', {
  status: 404,
  code: 'NOT_FOUND'
});

// Unauthorized
return errorResponse('Authentication required', {
  status: 401,
  code: 'UNAUTHORIZED'
});

// Forbidden
return errorResponse('Insufficient permissions', {
  status: 403,
  code: 'FORBIDDEN'
});

// Conflict
return errorResponse('Resource already exists', {
  status: 409,
  code: 'CONFLICT'
});

// Generic error with details
return errorResponse('Operation failed', {
  status: 500,
  code: 'INTERNAL_ERROR',
  details: { field: 'error detail' }
});
```

---

### Pattern: `SUCCESS_RESPONSE`

Standard success response format using Fresh helpers.

```typescript
import { successResponse } from "../../../lib/fresh-helpers.ts";

// Single resource
return successResponse({ data: resource });

// Created resource
return successResponse({ data: resource }, { status: 201 });

// List of resources with pagination
return successResponse({
  data: resources,
  pagination: {
    page,
    limit,
    total,
    hasMore: resources.length === limit
  }
});

// Success message
return successResponse({ message: 'Operation completed successfully' });

// No content
return new Response(null, { status: 204 });
```

---

## Middleware Patterns

### Pattern: `FRESH_MIDDLEWARE`

Fresh middleware for authentication and shared logic.

**Authentication middleware (`frontend/routes/api/_middleware.ts`)**:
```typescript
import type { FreshContext } from "$fresh/server.ts";
import { verifyToken } from "../../../shared/lib/jwt.ts";
import type { AppState } from "../../lib/fresh-helpers.ts";

export async function handler(
  req: Request,
  ctx: FreshContext<AppState>
): Promise<Response> {
  const authHeader = req.headers.get("Authorization");
  
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const payload = await verifyToken(token);
      ctx.state.user = payload;
    } catch (_error) {
      ctx.state.user = null;
    }
  }
  
  return await ctx.next();
}
```

**Using auth in routes**:
```typescript
import { requireAuth, requireRole } from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    // Require authentication
    const user = requireAuth(ctx);
    
    // Require specific role
    requireRole(user, ['admin']);
    
    // User is authenticated and authorized
    // ...
  }
};
```

---

## Helper Function Patterns

### Pattern: `FRESH_HELPERS`

Helper functions in `frontend/lib/fresh-helpers.ts`.

```typescript
import type { FreshContext } from "$fresh/server.ts";

export interface AppState {
  user: { sub: string; email: string; role: string } | null;
}

// Success response
export function successResponse(data: unknown, options?: { status?: number }) {
  return new Response(JSON.stringify(data), {
    status: options?.status || 200,
    headers: { "Content-Type": "application/json" }
  });
}

// Error response
export function errorResponse(
  message: string,
  options?: { status?: number; code?: string; errors?: unknown }
) {
  return new Response(
    JSON.stringify({
      error: {
        message,
        code: options?.code,
        errors: options?.errors
      }
    }),
    {
      status: options?.status || 500,
      headers: { "Content-Type": "application/json" }
    }
  );
}

// Require authentication
export function requireAuth(ctx: FreshContext<AppState>) {
  if (!ctx.state.user) {
    throw new Error("Authentication required");
  }
  return ctx.state.user;
}

// Require role
export function requireRole(user: { role: string }, allowedRoles: string[]) {
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Insufficient permissions");
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
| SERVICE_CRUD | ~600-800 tokens | Complete service vs from scratch |
| REPOSITORY_CRUD | ~600-800 tokens | Complete repository vs from scratch |
| WEBSOCKET_BROADCAST | ~200-300 tokens | Broadcasting vs custom implementation |
| FRESH_HANDLERS | ~400-600 tokens | Complete handlers vs individual |
| Zod validation | ~100-150 tokens | Schema reuse |
| Fresh helpers | ~200 tokens | Import vs define |
| KV key patterns | ~50 tokens/op | Reference vs design |
| **Total per feature** | **~2150-3400 tokens** | **Per CRUD feature with real-time** |

---

## Usage Guidelines

When implementing a feature:

1. **Create Service** → Static methods wrapping repository with WebSocket broadcasts
2. **Create Repository** → Extend `BaseRepository` with CRUD methods
3. **Define Schemas** → Create Zod schemas in `shared/types/`
4. **Create Route Files** → Use Fresh file-based routing
5. **Implement Handlers** → Use `Handlers` with service + helpers
6. **Add Validation** → Parse with Zod schemas, handle errors
7. **WebSocket Integration** → Use channel subscriptions on frontend

This approach saves 50-65% tokens in backend implementation.

---

## Best Practices

1. ✅ **Use service layer** - Import from `shared/services/`, call static methods
2. ✅ **Services wrap repositories** - Thin wrapper with WebSocket broadcasts
3. ✅ **Use repository pattern** - Import from `shared/repositories/`, never direct KV
4. ✅ **Use Fresh helpers** - `successResponse()`, `errorResponse()`, `requireAuth()`
5. ✅ **Validate with Zod** - Define schemas in `shared/types/`, parse in handlers
6. ✅ **File-based routing** - Leverage Fresh's routing: `index.ts`, `[id].ts`
7. ✅ **Middleware layering** - Use `_middleware.ts` for shared logic
8. ✅ **WebSocket broadcasts** - Use `notifyUser()`, `sendToUser()`, `broadcast()`
9. ❌ **Don't access repositories directly in routes** - Use service layer
10. ❌ **Don't access KV directly** - Always use repository pattern
11. ❌ **Don't skip validation** - Use Zod schemas for all input
12. ❌ **Don't skip error handling** - Use try/catch with helpers
13. ❌ **Don't use instance methods in services** - Use static methods

---

## Integration with Other Phases

**API Design** → defines endpoints and validation schemas
**Test Writing** → defines expected behavior
**Backend Implementation** → uses these patterns with Fresh

All phases reference the same patterns for consistency and token efficiency.
