# HTTP Route Patterns Reference

Comprehensive patterns for creating token-efficient Hono routes.

## Template Selection Guide

| Template | Use When | Token Savings | Complexity |
|----------|----------|---------------|------------|
| `routes-shorthand.template.ts` | Simple CRUD, minimal custom logic | ~600-800 | ⭐ Easiest |
| `routes-crud.template.ts` | Standard CRUD with full error handling | ~400-600 | ⭐⭐ Standard |
| Custom implementation | Complex business logic, non-REST | N/A | ⭐⭐⭐ Complex |

## Quick Reference

### Standard CRUD Routes (RESTful)

```typescript
POST   /api/v1/resources      → Create new resource
GET    /api/v1/resources      → List resources (paginated)
GET    /api/v1/resources/:id  → Get single resource
PUT    /api/v1/resources/:id  → Update resource
DELETE /api/v1/resources/:id  → Delete resource
```

---

## Pattern: SHORTHAND_ROUTES

Ultra-concise for simple CRUD with service layer.

**When to use:**
- ✅ Standard CRUD operations
- ✅ Service handles all business logic
- ✅ Global error handler middleware exists
- ✅ Minimal custom logic in routes

**Token savings:** ~600-800 tokens

**Example:**
```typescript
import { Hono } from 'hono';
import { UserService } from '../services/users.ts';
import { getKv } from '../lib/kv.ts';

const users = new Hono();

async function getService() {
  return new UserService(await getKv());
}

// All 5 CRUD routes in ~40 lines
users.post('/', async (c) => {
  const service = await getService();
  const result = await service.create(await c.req.json());
  return c.json({ data: result }, 201);
});

users.get('/', async (c) => {
  const service = await getService();
  const result = await service.findAll({
    limit: Number(c.req.query('limit')) || 10,
    cursor: c.req.query('cursor')
  });
  return c.json(result);
});

// ... 3 more routes
```

---

## Pattern: STANDARD_ROUTES

Full error handling in routes.

**When to use:**
- ✅ Need explicit error handling per route
- ✅ No global error handler
- ✅ Custom error responses per endpoint

**Token savings:** ~400-600 tokens

**Example:**
```typescript
users.post('/', authenticate, validateUser, async (c) => {
  try {
    const service = await getService();
    const body = await c.req.json();
    const result = await service.create(body);
    return c.json({ data: result }, 201);
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: error.message } }, 400);
    }
    if (error instanceof ConflictError) {
      return c.json({ error: { code: 'CONFLICT', message: error.message } }, 409);
    }
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed' } }, 500);
  }
});
```

---

## Pattern: MIDDLEWARE_CHAIN

Composing middleware for routes.

**Authentication:**
```typescript
import { authenticate } from '../middleware/auth.ts';

users.post('/', authenticate, async (c) => {
  // User is authenticated, token decoded
  const userId = c.get('userId'); // Set by middleware
  // ...
});
```

**Validation:**
```typescript
import { validateUser } from '../middleware/validation.ts';

users.post('/', authenticate, validateUser, async (c) => {
  // Request body already validated
  const body = await c.req.json();
  // ...
});
```

**Multiple middleware:**
```typescript
users.post('/',
  authenticate,     // Auth check
  validateUser,     // Validate request body
  rateLimit,        // Rate limiting
  async (c) => {
    // All checks passed
  }
);
```

---

## Pattern: QUERY_PARAMETERS

Handling query params for filtering, pagination, sorting.

**Pagination:**
```typescript
users.get('/', async (c) => {
  const limit = Number(c.req.query('limit')) || 10;
  const cursor = c.req.query('cursor');

  const result = await service.findAll({ limit, cursor });
  return c.json(result);
});
```

**Filtering:**
```typescript
users.get('/', async (c) => {
  const status = c.req.query('status'); // ?status=active
  const role = c.req.query('role');     // ?role=admin

  const result = await service.findAll({
    filters: { status, role }
  });
  return c.json(result);
});
```

**Sorting:**
```typescript
users.get('/', async (c) => {
  const sortBy = c.req.query('sort') || 'createdAt';
  const order = c.req.query('order') || 'desc';

  const result = await service.findAll({
    sort: { field: sortBy, order }
  });
  return c.json(result);
});
```

---

## Pattern: PATH_PARAMETERS

Working with URL parameters.

**Single param:**
```typescript
users.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = await service.findById(id);

  if (!user) {
    return c.json({ error: { code: 'NOT_FOUND' } }, 404);
  }

  return c.json({ data: user });
});
```

**Multiple params:**
```typescript
// GET /api/v1/users/:userId/posts/:postId
users.get('/:userId/posts/:postId', async (c) => {
  const userId = c.req.param('userId');
  const postId = c.req.param('postId');

  const post = await service.findUserPost(userId, postId);
  return c.json({ data: post });
});
```

---

## Pattern: REQUEST_BODY

Parsing request bodies.

**JSON body:**
```typescript
users.post('/', async (c) => {
  const body = await c.req.json();
  // body is parsed JSON object

  const result = await service.create(body);
  return c.json({ data: result }, 201);
});
```

**Form data:**
```typescript
users.post('/upload', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file');
  const name = formData.get('name');

  // Process file upload
});
```

---

## Pattern: RESPONSE_FORMATS

Standard response structures.

**Success with data:**
```typescript
return c.json({ data: resource }, 200);
```

**Success without data (no content):**
```typescript
return c.body(null, 204);
```

**Created:**
```typescript
return c.json({ data: resource }, 201);
```

**List with pagination:**
```typescript
return c.json({
  data: resources,
  cursor: nextCursor || null
}, 200);
```

**Error:**
```typescript
return c.json({
  error: {
    code: 'ERROR_CODE',
    message: 'Human-readable message',
    details: { field: 'error' } // optional
  }
}, statusCode);
```

---

## Pattern: CUSTOM_ENDPOINTS

Non-CRUD endpoints.

**Actions on resources:**
```typescript
// POST /api/v1/users/:id/activate
users.post('/:id/activate', authenticate, async (c) => {
  const id = c.req.param('id');
  const result = await service.activate(id);
  return c.json({ data: result });
});
```

**Batch operations:**
```typescript
// POST /api/v1/users/batch-delete
users.post('/batch-delete', authenticate, async (c) => {
  const { ids } = await c.req.json();
  const result = await service.deleteMany(ids);
  return c.json({ data: { deleted: result } });
});
```

**Search:**
```typescript
// GET /api/v1/users/search?q=john
users.get('/search', async (c) => {
  const query = c.req.query('q');
  const results = await service.search(query);
  return c.json({ data: results });
});
```

---

## Pattern: ROUTE_GROUPING

Organizing routes by feature.

**Feature-based groups:**
```typescript
// backend/routes/users.ts
const users = new Hono();
users.post('/', ...);
users.get('/', ...);
export default users;

// backend/routes/index.ts
import users from './users.ts';
import posts from './posts.ts';

const api = new Hono();
api.route('/users', users);
api.route('/posts', posts);

export default api;
```

**Versioned API:**
```typescript
// backend/routes/v1/index.ts
const v1 = new Hono();
v1.route('/users', users);
v1.route('/posts', posts);

// backend/main.ts
app.route('/api/v1', v1);
```

---

## Token Savings Summary

| Pattern | Tokens Saved | Use Case |
|---------|--------------|----------|
| Shorthand template | ~600-800 | Simple CRUD |
| Standard template | ~400-600 | Full CRUD with error handling |
| Middleware patterns | ~100-200 | Auth, validation |
| Response patterns | ~50-100 | Consistent responses |
| **Total per feature** | **~1150-1700** | **Complete route set** |

---

## Best Practices

✅ **Use shorthand** - For simple CRUD with service layer
✅ **Service does logic** - Routes should be thin, delegate to service
✅ **Consistent responses** - Use standard formats (see RESPONSE_FORMATS)
✅ **Global error handler** - Catch service errors in middleware
✅ **Middleware chain** - Compose: authenticate → validate → handler

❌ **Don't put business logic in routes** - Use service layer
❌ **Don't repeat error handling** - Use global error handler
❌ **Don't skip validation** - Use middleware or service validation
❌ **Don't skip authentication** - Use middleware for protected routes

---

## Integration with Service Layer

**Routes should be thin:**
```typescript
// ✅ GOOD - Route delegates to service
users.post('/', authenticate, async (c) => {
  const service = await getService();
  const result = await service.create(await c.req.json());
  return c.json({ data: result }, 201);
});

// ❌ BAD - Business logic in route
users.post('/', authenticate, async (c) => {
  const body = await c.req.json();

  // Validation in route (should be in service)
  if (!body.email) throw new Error('Email required');
  if (body.email.length > 100) throw new Error('Email too long');

  // Business logic in route (should be in service)
  const user = {
    id: crypto.randomUUID(),
    ...body,
    createdAt: new Date().toISOString()
  };

  // Database logic in route (should be in service)
  const kv = await getKv();
  await kv.set(['users', user.id], user);

  return c.json({ data: user }, 201);
});
```

---

## See Also

- `BACKEND_PATTERNS.md` - Complete backend patterns
- `routes-shorthand.template.ts` - Shorthand route template
- `routes-crud.template.ts` - Full CRUD route template
