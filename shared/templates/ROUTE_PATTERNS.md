# HTTP Route Patterns Reference

Comprehensive patterns for creating token-efficient Fresh API routes.

## Template Selection Guide

| Template | Use When | Token Savings | Complexity |
|----------|----------|---------------|------------|
| Repository + Handlers | Simple CRUD with repository pattern | ~600-800 | ⭐ Easiest |
| Full validation | Standard CRUD with Zod validation | ~400-600 | ⭐⭐ Standard |
| Custom implementation | Complex business logic, non-REST | N/A | ⭐⭐⭐ Complex |

## Quick Reference

### Standard CRUD Routes (RESTful)

```typescript
POST   /api/resources/index.ts      → Create new resource
GET    /api/resources/index.ts      → List resources (paginated)
GET    /api/resources/[id].ts       → Get single resource
PATCH  /api/resources/[id].ts       → Update resource
DELETE /api/resources/[id].ts       → Delete resource
```

---

## Pattern: SIMPLE_CRUD

Ultra-concise CRUD with repository pattern.

**When to use:**
- ✅ Standard CRUD operations
- ✅ Repository handles all data access
- ✅ Middleware handles authentication
- ✅ Minimal custom logic in routes

**Token savings:** ~600-800 tokens

**Example: `frontend/routes/api/users/index.ts`**
```typescript
import { Handlers } from "$fresh/server.ts";
import { UserRepository } from "../../../../shared/repositories/index.ts";
import { successResponse, errorResponse, requireAuth, type AppState } from "../../../lib/fresh-helpers.ts";
import { CreateUserSchema } from "../../../../shared/types/user.ts";
import { z } from "zod";

export const handler: Handlers<unknown, AppState> = {
  // Create new user
  async POST(req, ctx) {
    const user = requireAuth(ctx);
    const userRepo = new UserRepository();
    
    try {
      const body = await req.json();
      const validatedData = CreateUserSchema.parse(body);
      const newUser = await userRepo.create(validatedData);
      return successResponse({ data: newUser }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse('Validation failed', { status: 400, errors: error.errors });
      }
      throw error;
    }
  },
  
  // List users
  async GET(req, ctx) {
    const user = requireAuth(ctx);
    const userRepo = new UserRepository();
    const url = new URL(req.url);
    
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    const users = await userRepo.list({ page, limit });
    return successResponse({ data: users });
  }
};
```

---

## Pattern: FULL_VALIDATION

Explicit error handling per route.

**When to use:**
- ✅ Need custom validation logic
- ✅ Complex error responses per endpoint
- ✅ Multiple validation schemas

**Token savings:** ~400-600 tokens

**Example: `frontend/routes/api/users/[id].ts`**
```typescript
import { Handlers } from "$fresh/server.ts";
import { UserRepository } from "../../../../shared/repositories/index.ts";
import { successResponse, errorResponse, requireAuth, type AppState } from "../../../lib/fresh-helpers.ts";
import { UpdateUserSchema } from "../../../../shared/types/user.ts";
import { z } from "zod";

export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    const user = requireAuth(ctx);
    const userId = ctx.params.id;
    const userRepo = new UserRepository();
    
    const foundUser = await userRepo.findById(userId);
    if (!foundUser) {
      return errorResponse('User not found', { status: 404, code: 'NOT_FOUND' });
    }
    
    return successResponse({ data: foundUser });
  },
  
  async PATCH(req, ctx) {
    const user = requireAuth(ctx);
    const userId = ctx.params.id;
    const userRepo = new UserRepository();
    
    try {
      const body = await req.json();
      const validatedData = UpdateUserSchema.parse(body);
      
      const existingUser = await userRepo.findById(userId);
      if (!existingUser) {
        return errorResponse('User not found', { status: 404, code: 'NOT_FOUND' });
      }
      
      const updated = await userRepo.update(userId, validatedData);
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
    const userId = ctx.params.id;
    const userRepo = new UserRepository();
    
    const existingUser = await userRepo.findById(userId);
    if (!existingUser) {
      return errorResponse('User not found', { status: 404, code: 'NOT_FOUND' });
    }
    
    await userRepo.delete(userId);
    return successResponse({ message: 'User deleted successfully' });
  }
};
```

---

## Pattern: MIDDLEWARE_USAGE

Using Fresh middleware for authentication and shared logic.

**Authentication Middleware (`frontend/routes/api/_middleware.ts`):**
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

**Using Auth in Route:**
```typescript
import { Handlers } from "$fresh/server.ts";
import { requireAuth, requireRole, type AppState } from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    // Check authentication
    const user = requireAuth(ctx);
    
    // Check role
    requireRole(user, ['admin']);
    
    // User is authenticated and authorized
    // ...
  }
};
```

---

## Pattern: QUERY_PARAMETERS

Handling query params for filtering, pagination, sorting.

**Pagination:**
```typescript
export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    const repo = new ResourceRepository();
    const result = await repo.list({ page, limit });
    return successResponse({ data: result });
  }
};
```

**Filtering:**
```typescript
export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const status = url.searchParams.get('status'); // ?status=active
    const role = url.searchParams.get('role');     // ?role=admin
    
    const repo = new ResourceRepository();
    const result = await repo.list({ filters: { status, role } });
    return successResponse({ data: result });
  }
};
```

**Sorting:**
```typescript
export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const sortBy = url.searchParams.get('sort') || 'createdAt';
    const order = url.searchParams.get('order') || 'desc';
    
    const repo = new ResourceRepository();
    const result = await repo.list({ sort: { field: sortBy, order } });
    return successResponse({ data: result });
  }
};
```

---

## Pattern: PATH_PARAMETERS

Working with URL parameters in Fresh file-based routing.

**Single param (`frontend/routes/api/users/[id].ts`):**
```typescript
export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    const id = ctx.params.id;
    const repo = new UserRepository();
    const user = await repo.findById(id);
    
    if (!user) {
      return errorResponse('User not found', { status: 404, code: 'NOT_FOUND' });
    }
    
    return successResponse({ data: user });
  }
};
```

**Multiple params (`frontend/routes/api/users/[userId]/posts/[postId].ts`):**
```typescript
export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    const userId = ctx.params.userId;
    const postId = ctx.params.postId;
    
    const postRepo = new PostRepository();
    const post = await postRepo.findUserPost(userId, postId);
    
    if (!post) {
      return errorResponse('Post not found', { status: 404, code: 'NOT_FOUND' });
    }
    
    return successResponse({ data: post });
  }
};
```

---

## Pattern: REQUEST_BODY

Parsing request bodies in Fresh.

**JSON body:**
```typescript
export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    const body = await req.json();
    // body is parsed JSON object
    
    const repo = new ResourceRepository();
    const result = await repo.create(body);
    return successResponse({ data: result }, { status: 201 });
  }
};
```

**With Zod validation:**
```typescript
import { CreateResourceSchema } from "../../../../shared/types/resource.ts";
import { z } from "zod";

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      const body = await req.json();
      const validatedData = CreateResourceSchema.parse(body);
      
      const repo = new ResourceRepository();
      const result = await repo.create(validatedData);
      return successResponse({ data: result }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse('Validation failed', { status: 400, errors: error.errors });
      }
      throw error;
    }
  }
};
```

**Form data:**
```typescript
export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    const formData = await req.formData();
    const file = formData.get('file');
    const name = formData.get('name');
    
    // Process file upload
    // ...
  }
};
```

---

## Pattern: RESPONSE_FORMATS

Standard response structures using Fresh helpers.

**Success with data:**
```typescript
return successResponse({ data: resource });
```

**Success with custom status:**
```typescript
return successResponse({ data: resource }, { status: 201 });
```

**No content:**
```typescript
return new Response(null, { status: 204 });
```

**List with pagination:**
```typescript
return successResponse({
  data: resources,
  pagination: {
    page,
    limit,
    total,
    hasMore: resources.length === limit
  }
});
```

**Error:**
```typescript
return errorResponse(
  'Human-readable message',
  { 
    status: 400,
    code: 'ERROR_CODE',
    errors: { field: 'error detail' } // optional
  }
);
```

**Common error responses:**
```typescript
// Not found
return errorResponse('Resource not found', { status: 404, code: 'NOT_FOUND' });

// Validation error
return errorResponse('Validation failed', { status: 400, errors: zodError.errors });

// Unauthorized
return errorResponse('Authentication required', { status: 401, code: 'UNAUTHORIZED' });

// Forbidden
return errorResponse('Insufficient permissions', { status: 403, code: 'FORBIDDEN' });

// Conflict
return errorResponse('Resource already exists', { status: 409, code: 'CONFLICT' });
```

---

## Pattern: CUSTOM_ENDPOINTS

Non-CRUD endpoints in Fresh.

**Actions on resources (`frontend/routes/api/users/[id]/activate.ts`):**
```typescript
export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    const user = requireAuth(ctx);
    const id = ctx.params.id;
    
    const userRepo = new UserRepository();
    const result = await userRepo.activate(id);
    return successResponse({ data: result });
  }
};
```

**Batch operations (`frontend/routes/api/users/batch-delete.ts`):**
```typescript
export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    const user = requireAuth(ctx);
    requireRole(user, ['admin']);
    
    const { ids } = await req.json();
    const userRepo = new UserRepository();
    const result = await userRepo.deleteMany(ids);
    return successResponse({ data: { deleted: result } });
  }
};
```

**Search (`frontend/routes/api/users/search.ts`):**
```typescript
export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    const user = requireAuth(ctx);
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    
    const userRepo = new UserRepository();
    const results = await userRepo.search(query);
    return successResponse({ data: results });
  }
};
```

---

## Pattern: ROUTE_ORGANIZATION

Organizing routes in Fresh file-based structure.

**File-based routing structure:**
```
frontend/routes/api/
├── users/
│   ├── index.ts              → GET/POST /api/users
│   ├── [id].ts               → GET/PATCH/DELETE /api/users/:id
│   ├── [id]/
│   │   ├── activate.ts       → POST /api/users/:id/activate
│   │   └── posts/
│   │       └── [postId].ts   → GET /api/users/:id/posts/:postId
│   ├── search.ts             → GET /api/users/search
│   └── batch-delete.ts       → POST /api/users/batch-delete
├── posts/
│   ├── index.ts
│   └── [id].ts
└── _middleware.ts            → Middleware for all /api/* routes
```

**Shared middleware (`frontend/routes/api/_middleware.ts`):**
```typescript
import type { FreshContext } from "$fresh/server.ts";
import type { AppState } from "../../lib/fresh-helpers.ts";

export async function handler(
  req: Request,
  ctx: FreshContext<AppState>
): Promise<Response> {
  // Apply to all /api/* routes
  // Authentication, logging, etc.
  return await ctx.next();
}
```

**Nested middleware (`frontend/routes/api/admin/_middleware.ts`):**
```typescript
export async function handler(
  req: Request,
  ctx: FreshContext<AppState>
): Promise<Response> {
  // Apply only to /api/admin/* routes
  const user = requireAuth(ctx);
  requireRole(user, ['admin']);
  return await ctx.next();
}
```

---

## Token Savings Summary

| Pattern | Tokens Saved | Use Case |
|---------|--------------|----------|
| Repository + Handlers | ~600-800 | Simple CRUD |
| Full validation | ~400-600 | CRUD with Zod validation |
| Fresh helpers | ~100-200 | successResponse, errorResponse |
| Response patterns | ~50-100 | Consistent responses |
| **Total per feature** | **~1150-1700** | **Complete route set** |

---

## Best Practices

✅ **Use repository pattern** - Import from `shared/repositories/`, never direct KV access
✅ **Use Fresh helpers** - `successResponse()`, `errorResponse()`, `requireAuth()`, `requireRole()`
✅ **Validate with Zod** - Define schemas in `shared/types/`, parse in handlers
✅ **File-based routing** - Leverage Fresh's routing: `index.ts`, `[id].ts`, `[id]/activate.ts`
✅ **Middleware layering** - Use `_middleware.ts` for shared logic (auth, logging)
✅ **Consistent responses** - Always use helper functions for responses

❌ **Don't access KV directly** - Always use repository pattern
❌ **Don't skip validation** - Use Zod schemas for all input
❌ **Don't skip authentication** - Use `requireAuth()` for protected routes
❌ **Don't repeat error handling** - Use try/catch with consistent error responses
❌ **Don't use nested routes in one file** - Use Fresh's file-based routing instead

---

## Integration with Repository Layer

**Routes should be thin:**
```typescript
// ✅ GOOD - Route delegates to repository
export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    const user = requireAuth(ctx);
    const body = await req.json();
    const validatedData = CreateUserSchema.parse(body);
    
    const userRepo = new UserRepository();
    const result = await userRepo.create(validatedData);
    return successResponse({ data: result }, { status: 201 });
  }
};

// ❌ BAD - Business logic and database access in route
export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    const user = requireAuth(ctx);
    const body = await req.json();
    
    // Validation in route (should use Zod schema)
    if (!body.email) throw new Error('Email required');
    if (body.email.length > 100) throw new Error('Email too long');
    
    // Direct database access (should use repository)
    const kv = await getKv();
    const newUser = {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString()
    };
    await kv.set(['users', newUser.id], newUser);
    
    return successResponse({ data: newUser }, { status: 201 });
  }
};
```

---

## See Also

- `BACKEND_PATTERNS.md` - Complete backend patterns with repositories
- `.github/copilot-instructions.md` - Fresh patterns and best practices
- `frontend/routes/api/` - Working examples
- `shared/repositories/` - Repository implementations
- `shared/types/` - Zod validation schemas
