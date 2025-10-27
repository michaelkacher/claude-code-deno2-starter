# System Architecture

**Last Updated:** 2025-01-27

## Overview

This is an **opinionated starter template** designed for building modern web applications with Deno 2. The architecture is pre-selected to provide a cohesive, production-ready stack optimized for serverless edge deployment.

**Philosophy:** Boring, proven technology that works together seamlessly.

---

## Architecture Pattern

**Monolithic with clear separation of concerns**

```
┌─────────────────────────────────────────┐
│         Frontend (Fresh + Preact)       │
│              Port 3000                  │
│  - SSR pages (routes/)                  │
│  - Interactive islands (islands/)       │
│  - Preact Signals for state             │
└─────────────────┬───────────────────────┘
                  │
                  │ HTTP/Fetch
                  ↓
┌─────────────────────────────────────────┐
│          Backend (Hono)                 │
│              Port 8000                  │
│  - REST API endpoints                   │
│  - Business logic in services/          │
│  - Validation middleware                │
└─────────────────┬───────────────────────┘
                  │
                  │ Deno KV API
                  ↓
┌─────────────────────────────────────────┐
│          Database (Deno KV)             │
│  - Key-value store                      │
│  - ACID transactions                    │
│  - Secondary indexes                    │
└─────────────────────────────────────────┘
```

**Why monolithic?**
- ✅ Simple deployment (single artifact)
- ✅ Easier development (no distributed complexity)
- ✅ Perfect for Deno Deploy edge deployment
- ✅ Can split later if needed (YAGNI principle)

---

## Technology Stack

### Runtime: Deno 2

**Why Deno?**
- ✅ TypeScript-native (no build step)
- ✅ Secure by default (explicit permissions)
- ✅ Built-in tooling (test, fmt, lint)
- ✅ Modern web APIs (fetch, crypto)
- ✅ Fast module resolution
- ✅ Built-in Deno KV database

### Backend: Hono

**Framework:** [Hono](https://hono.dev/) v4+

**Why Hono?**
- ✅ Ultra-fast (built for edge)
- ✅ Small bundle size (~12KB)
- ✅ Works on Deno Deploy natively
- ✅ Express-like API (familiar)
- ✅ TypeScript-first
- ✅ Middleware ecosystem

**Structure:**
```
backend/
├── main.ts              # Server entry point
├── routes/              # Route handlers
│   └── [resource].ts    # REST endpoints
├── services/            # Business logic
│   └── [resource].ts    # Domain operations
├── middleware/          # Custom middleware
├── lib/                 # Utilities
└── types/               # TypeScript types
```

### Frontend: Fresh + Preact

**Framework:** [Fresh](https://fresh.deno.dev/) 1.7+
**UI Library:** [Preact](https://preactjs.com/) 10+
**State:** [Preact Signals](https://preactjs.com/guide/v10/signals/)

**Why Fresh?**
- ✅ Deno-native (no Node.js needed)
- ✅ Islands architecture (minimal JS)
- ✅ Server-side rendering (SSR)
- ✅ Zero-config (no webpack)
- ✅ File-based routing
- ✅ Edge-ready

**Why Preact?**
- ✅ Tiny (3KB gzipped)
- ✅ React-compatible API
- ✅ Fast performance
- ✅ Great DX with Signals

**Structure:**
```
frontend/
├── routes/              # File-based routes (SSR)
│   ├── index.tsx        # Homepage
│   └── _app.tsx         # Root layout
├── islands/             # Interactive components
│   └── Counter.tsx      # Client-side islands
├── components/          # Shared components (SSR)
└── static/              # Static assets
```

**Note:** Frontend is **optional**. You can:
- Remove it entirely for API-only projects
- Replace with any SPA framework
- Use a separate frontend repo

### Database: Deno KV

**Database:** [Deno KV](https://deno.com/kv) (FoundationDB on Deno Deploy)

**Why Deno KV?**
- ✅ Zero configuration
- ✅ Built into Deno runtime
- ✅ ACID transactions
- ✅ Global replication on Deno Deploy
- ✅ Perfect for edge deployment
- ✅ No connection strings or migrations
- ✅ In-memory mode for tests (`:memory:`)

**When to use Deno KV:**
- ✅ Key-value access patterns
- ✅ Secondary indexes
- ✅ Simple queries
- ✅ Edge deployment
- ✅ Fast development

**When to use PostgreSQL instead:**
- ❌ Complex JOINs across many tables
- ❌ Advanced aggregations (GROUP BY with HAVING)
- ❌ Full-text search at database level
- ❌ Existing PostgreSQL infrastructure
- ❌ Complex reporting queries

**Data modeling:**
```typescript
// Keys are arrays (hierarchical)
['users', userId]                    // User by ID
['users_by_email', email]            // Secondary index
['posts', postId]                    // Post by ID
['posts_by_user', userId, postId]    // User's posts
['comments', postId, commentId]      // Post's comments
```

### Deployment: Deno Deploy

**Platform:** [Deno Deploy](https://deno.com/deploy)

**Why Deno Deploy?**
- ✅ Zero configuration
- ✅ Global edge network (35+ regions)
- ✅ Built-in Deno KV (globally distributed)
- ✅ Auto-scaling (serverless)
- ✅ GitHub integration
- ✅ Free tier
- ✅ HTTPS included

**Alternatives:**
- Docker + any cloud (AWS/GCP/Azure)
- Compile to binary for VPS
- Self-hosted

---

## API Design

### REST API

**Style:** RESTful HTTP with JSON

**Endpoints pattern:**
```
GET    /api/[resource]           # List
GET    /api/[resource]/:id       # Get one
POST   /api/[resource]           # Create
PUT    /api/[resource]/:id       # Update
DELETE /api/[resource]/:id       # Delete
```

**Response format:**
```typescript
// Success
{
  "data": { /* resource */ }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format"
  }
}
```

**Why REST (not GraphQL/tRPC)?**
- ✅ Simple and well-understood
- ✅ Works everywhere (mobile, web)
- ✅ Easy to cache
- ✅ No special tooling needed
- ✅ Perfect for CRUD operations

---

## Code Organization

### Separation of Concerns

```
Request → Route → Service → Database
   ↓         ↓        ↓         ↓
  HTTP   Validation  Business  Data
         Auth       Logic    Persistence
```

**Routes (`backend/routes/`):**
- Handle HTTP request/response
- Parse input
- Call services
- Return JSON

**Services (`backend/services/`):**
- **Business logic lives here**
- Domain operations
- Data validation
- Business rules

**Models/Types (`backend/types/`):**
- TypeScript interfaces
- Data shapes
- Validation schemas (Zod)

---

## Security

### Authentication

**Recommended:** JWT tokens

**Why JWT?**
- ✅ Stateless (perfect for edge)
- ✅ Works across distributed servers
- ✅ Standard (many libraries)

**Implementation:**
```typescript
// 1. Login: Issue JWT
POST /api/auth/login
→ { token: "eyJ..." }

// 2. Protected routes: Verify JWT
GET /api/users
Authorization: Bearer eyJ...
```

### Authorization

**Model:** Role-based access control (RBAC)

```typescript
interface User {
  id: string;
  role: 'admin' | 'user';
}

// Middleware checks role
function requireAdmin(c, next) {
  if (c.get('user').role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  return next();
}
```

### Data Protection

- ✅ Passwords hashed with Web Crypto API
- ✅ HTTPS enforced (Deno Deploy default)
- ✅ CORS configured
- ✅ Input validation (Zod)
- ✅ SQL injection: N/A (no SQL, using KV)
- ✅ XSS: Sanitize user input

---

## Testing Strategy

### Focus: Business Logic Only

**What we test:**
- ✅ Business rules (YOUR code)
- ✅ Service layer logic
- ✅ Data transformations
- ✅ Domain-specific validation

**What we DON'T test:**
- ❌ Framework code (Hono/Fresh/Deno)
- ❌ HTTP routing
- ❌ Authentication middleware
- ❌ JSON serialization

### Test Types

**1. Service Tests (80%):**
```typescript
// Test business logic
Deno.test('UserService - prevents duplicate emails', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new UserService(kv);
    await service.create({ email: 'test@test.com' });

    await assertRejects(
      () => service.create({ email: 'test@test.com' }),
      Error,
      'duplicate'
    );
  } finally {
    await cleanup();
  }
});
```

**2. Unit Tests (15%):**
```typescript
// Test pure functions
Deno.test('validateEmail - rejects invalid format', () => {
  assertEquals(validateEmail('invalid'), false);
});
```

**3. Integration Tests (5%):**
```typescript
// Test data persistence only
// NOT HTTP routing
```

### Test Environment

- **Runtime:** Deno's built-in test runner
- **Database:** `:memory:` Deno KV (fast, isolated)
- **Coverage:** `deno test --coverage`
- **CI:** GitHub Actions

---

## Scalability

### Current Architecture

**Good for:**
- ✅ 0 - 100K users
- ✅ Edge deployment (low latency)
- ✅ API-driven applications
- ✅ CRUD operations
- ✅ Real-time apps (with WebSockets)

### Scaling Strategy

**Horizontal scaling:** Deno Deploy handles automatically

**Vertical scaling:** N/A (serverless)

**Database scaling:**
- Deno KV scales automatically on Deno Deploy
- If outgrown, migrate to PostgreSQL
- If massive scale, consider separate microservices

### When to Refactor

**Split to microservices when:**
- Different services need different scaling
- Team size > 10 developers
- Clear domain boundaries emerge
- Different deployment cadences needed

**Migrate to PostgreSQL when:**
- Need complex JOINs regularly
- Analytics/reporting requirements
- Full-text search
- Existing PostgreSQL expertise

---

## Development Workflow

### Local Development

```bash
# Start dev servers
deno task dev
# Backend: http://localhost:8000
# Frontend: http://localhost:3000

# Run tests
deno test --allow-all

# Type checking
deno task type-check

# Linting
deno lint

# Formatting
deno fmt
```

### TDD Workflow

```
1. Write failing test (RED)
2. Write minimal code (GREEN)
3. Refactor (REFACTOR)
```

### Deployment

```bash
# Auto-deploy on push to main
git push origin main

# Or manual deploy
deno task deploy
```

---

## Architecture Decision Records

Major architectural decisions are documented in `docs/adr/`.

**Existing ADRs:**
- (None yet - add as you make decisions)

**When to create an ADR:**
- Technology choice
- Architectural pattern change
- Major refactoring
- Database schema change

---

## Future Considerations

### What might change:

**Database:**
- If Deno KV becomes limiting, migrate to PostgreSQL
- Plan: Create database abstraction layer in services

**Frontend:**
- Could replace Fresh with React/Vue/Svelte
- Could remove entirely for API-only

**Backend:**
- Could split into microservices if needed
- For now: Keep simple, YAGNI

**Deployment:**
- Could move to Docker + Kubernetes
- Could compile to binary for VPS
- For now: Deno Deploy is perfect

---

## Summary

**This template is opinionated by design.**

✅ **Use this template if you want:**
- Deno 2 runtime
- Hono backend
- Fresh frontend (optional)
- Deno KV database
- Deno Deploy deployment
- Fast development
- Edge deployment

❌ **Don't use this template if you need:**
- Node.js runtime
- Express/NestJS backend
- React/Vue/Angular frontend
- PostgreSQL/MySQL database
- Complex microservices
- On-premise deployment

**The stack is chosen. Focus on building features, not debating tech choices.**

---

**Questions?** See `/architect` command to update this document when making architectural changes.
