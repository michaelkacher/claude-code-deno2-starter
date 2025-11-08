# System Architecture

**Last Updated:** 2025-11-07

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

**Why Pure Fresh (Single Server)?**
- ✅ Simpler deployment (one server, one port)
- ✅ No CORS complexity (same origin)
- ✅ Faster development (no context switching)
- ✅ Perfect for Deno Deploy edge deployment
- ✅ Fresh handles both pages AND APIs natively
- ✅ Reduced operational complexity

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

### Framework: Fresh 1.7.3

**Framework:** [Fresh](https://fresh.deno.dev/) 1.7+
**UI Library:** [Preact](https://preactjs.com/) 10+
**State:** [Preact Signals](https://preactjs.com/guide/v10/signals/)

**Why Fresh?**
- ✅ Deno-native (no Node.js needed)
- ✅ Islands architecture (minimal JS)
- ✅ Server-side rendering (SSR)
- ✅ Handles both pages AND API endpoints
- ✅ File-based routing
- ✅ Zero config required
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
├── routes/              # File-based routes
│   ├── index.tsx        # Homepage (SSR page)
│   ├── _app.tsx         # Root layout
│   ├── _middleware.ts   # Page auth middleware
│   └── api/             # API endpoints
│       ├── auth/        # Auth endpoints
│       ├── admin/       # Admin endpoints
│       ├── jobs/        # Job management
│       └── _middleware.ts  # API middleware
├── islands/             # Interactive components
│   ├── LoginForm.tsx    # Client-side islands
│   └── Navigation.tsx   # Persistent navigation
├── components/          # Shared components (SSR)
│   └── common/          # Reusable UI components
├── lib/                 # Frontend utilities
│   ├── api-client.ts    # Type-safe API client
│   ├── storage.ts       # Storage abstraction
│   └── fresh-helpers.ts # Fresh utilities
└── static/              # Static assets

shared/
├── lib/                 # Server-side utilities
│   ├── jwt.ts          # JWT handling
│   ├── kv.ts           # Deno KV wrapper
│   ├── queue.ts        # Background job queue
│   ├── scheduler.ts    # Job scheduler
│   ├── logger.ts       # Structured logging
│   └── totp.ts         # 2FA TOTP
├── repositories/        # Data access layer
│   ├── user-repository.ts
│   ├── job-repository.ts
│   └── notification-repository.ts
├── workers/             # Background job workers
│   ├── email-worker.ts
│   ├── cleanup-worker.ts
│   └── index.ts
├── config/              # Configuration
│   └── env.ts          # Environment validation
├── middleware/          # Shared middleware
│   ├── auth.ts         # JWT verification
│   └── validate.ts     # Zod validation
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
