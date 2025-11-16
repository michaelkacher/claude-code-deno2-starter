# System Architecture

**Last Updated:** 2025-11-08

## Overview

This is an **opinionated starter template** designed for building modern web applications with Deno 2. The architecture is pre-selected to provide a cohesive, production-ready stack optimized for serverless edge deployment.

**Philosophy:** Boring, proven technology that works together seamlessly.

---

## Architecture Pattern

**Pure Fresh - Single Server Architecture**

```
┌─────────────────────────────────────────────────────────┐
│         Fresh Server (localhost:3000)                    │
├─────────────────────────────────────────────────────────┤
│  Frontend (Pages & Islands)                             │
│  - SSR pages (routes/*.tsx)                             │
│  - Interactive islands (islands/*.tsx)                  │
│  - Preact for UI components                             │
├─────────────────────────────────────────────────────────┤
│  API Endpoints (routes/api/**)                          │
│  - REST API handlers (routes/api/**/*.ts)               │
│  - Fresh Handlers with typed context                    │
│  - Middleware for auth, validation, CORS                │
├─────────────────────────────────────────────────────────┤
│  Background Services                                     │
│  - Job queue processor                                  │
│  - Job scheduler (cron-like)                            │
│  - Background workers (email, cleanup, etc.)            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ Uses shared code
                  ↓
┌─────────────────────────────────────────────────────────┐
│          Shared Code (shared/)                          │
│  - Repositories (data access layer)                     │
│  - Workers (background job handlers)                    │
│  - Lib (utilities: JWT, KV, queue, scheduler)           │
│  - Config (environment validation)                      │
│  - Types (TypeScript definitions)                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ Deno KV API
                  ↓
┌─────────────────────────────────────────────────────────┐
│          Database (Deno KV)                             │
│  - Key-value store                                      │
│  - ACID transactions                                    │
│  - Secondary indexes                                    │
│  - Background job queue storage                         │
└─────────────────────────────────────────────────────────┘
```


### Framework: Fresh 2.1.x
### Runtime: Deno 2
**Framework:** [Fresh](https://fresh.deno.dev/) 2.x 
- ✅ TypeScript-native (no build step)
**Why Fresh 2?**
 - ✅ Vite integration (plugin architecture, access to Vite ecosystem)
 - ✅ True HMR for islands & client assets
 - ✅ Unified middleware/handler/component signatures (`(ctx) =>`)
 - ✅ Simplified App builder API (no `fresh.config.ts` / `fresh.gen.ts`)
 - ✅ Built-in OpenTelemetry hooks (optional; can instrument latency)
 - ✅ Unified `_error.tsx` template (replaces `_404.tsx` & `_500.tsx`)
 - ✅ Trailing slash behavior moved to explicit middleware (opt-in)
 - ✅ Improved build pipeline via Vite (static asset processing & CSS HMR)
- ✅ File-based routing

**Why Preact?**
- ✅ Tiny (3KB gzipped)
- ✅ React-compatible API
    _middleware.ts     # Middleware (update signature to (ctx) form)
    _error.tsx         # Unified error page (Fresh 2)

**Structure:**
  client.ts            # Client entry for CSS & HMR
  vite.config.ts       # Vite + Fresh plugin configuration
│   ├── index.tsx        # Homepage (SSR page)
│   ├── _app.tsx         # Root layout
│   ├── _middleware.ts   # Page auth middleware
│   └── api/             # API endpoints
│       ├── auth/        # Auth endpoints
│       ├── jobs/        # Job management
### Deployment: Deno Deploy
│   ├── LoginForm.tsx    # Client-side islands
**Development Workflow (Updated)**
│   └── mockups/         # UI mockup islands
├── components/          # Shared components (SSR)
deno task dev
│   └── design-system/   # Design system components
```bash
# Start dev (Vite + Fresh plugin)
deno task dev

# Build production assets
deno task build

# Preview production build
deno task preview  # serves _fresh/server.js

# Run tests (unchanged)
deno task test

# Type checking
deno task typecheck

# Linting & formatting
deno lint
deno fmt
```


**Frontend:**
- Optional: adopt additional Vite plugins (PWA, compression, bundle analysis)
- Optional: enable CSP & custom security headers middleware for stricter security posture
- Optional: OpenTelemetry instrumentation hooking into Deno Deploy traces

## Fresh 2 Migration Summary

**Date:** 2025-11-13
**From Version:** 1.7.3
**To Version:** 2.1.x

**Key Changes Applied:**
- Replaced legacy startup (`start(manifest, config)`) with `new App().use(...).fsRoutes().listen()`
- Removed `dev.ts`, `fresh.config.ts`, `fresh.gen.ts`
- Added `vite.config.ts`, `client.ts`, unified `_error.tsx`
- Updated tasks (`dev`, `build`, `preview`) and import map (`fresh`, `@fresh/plugin-vite`, `vite`)
- Architecture doc updated to reflect Vite integration & new middleware signature requirements

**Pending Follow-up (Not yet executed):**
- Update all route & middleware signatures to Fresh 2 `(ctx)` form (currently still legacy in some files)
- Evaluate adding CSP & headers middleware
- Instrument OpenTelemetry traces for key routes
- Consolidate error handling into `_error.tsx` logic with richer diagnostics

**Risk Assessment:**
- Low: Static code adjustments; major runtime API preserved via update script semantics
- Medium: Unupdated handlers may rely on old signatures (need staged refactor)
- Low: Removal of generated manifest reduces maintenance overhead

**Mitigation Plan:**
- Incrementally refactor handlers/middleware; add lint rule to detect old signatures
- Add integration tests around critical routes before signature migration

---

## Architecture Decision Records

Added ADR documenting Fresh 2 migration in `docs/adr/2025-11-13-fresh-2-migration.md`.

---

## Summary
│   └── composite-indexes.ts  # KV composite indexes
✅ **Use this template if you want:**
- Deno 2 runtime
- Fresh 2.x (SSR + Islands + Vite + HMR)
- Deno KV database
- Deno Deploy deployment
- Fast development & iteration
- Edge deployment
│   ├── user-repository.ts
**Questions?** Use `/architect` to propose further architectural changes (e.g., DB migration, microservice split).
│   ├── token-repository.ts
│   └── notification-repository.ts
├── services/            # Business logic layer
│   └── notifications.ts # Notification service
├── workers/             # Background job workers
│   ├── email-worker.ts
│   ├── cleanup-worker.ts
│   ├── report-worker.ts
│   ├── webhook-worker.ts
│   └── index.ts
├── templates/           # Code templates for services/repos
└── types/               # TypeScript types
    └── index.ts
```

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

**Routes (`frontend/routes/`):**
- Handle HTTP request/response
- Parse input
- Call services
- Return JSON

**Services (`shared/services/`):**
- **Business logic lives here**
- Domain operations
- Data validation
- Business rules

**Models/Types (`shared/types/`):**
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
- ❌ Framework code (Fresh/Deno runtime)
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
- **Coverage:** `deno task test --coverage`
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
# Frontend: http://localhost:3000

# Run tests
deno task test --allow-all

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
- Fresh 1.7.3 (API routes + SSR)
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
