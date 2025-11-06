# Quick Reference Guide

**Last Updated:** 2025-01-27

This is a condensed reference for common patterns and workflows. For detailed guides, see `docs/guides/`.

---

## Stack Overview

- **Runtime:** Deno 2 (TypeScript-native, secure, edge-ready)
- **Backend:** Hono (ultra-fast, <12KB, edge-optimized)
- **Frontend:** Fresh + Preact (SSR, islands, optional)
- **Database:** Deno KV (built-in, zero-config, globally distributed)
- **Deployment:** Deno Deploy (serverless edge, auto-scaling)

---

## Quick Start Commands

```bash
# Start development
deno task dev                    # Backend (8000) + Frontend (3000)

# Build feature (recommended)
/new-feature                     # Handles everything: requirements → tests → implementation

# Create UI mockup first
/mockup                          # Fast visual prototype
/new-feature                     # Converts mockup to full feature

# Testing
deno test                        # Run all tests
deno task test:watch             # Watch mode
deno task test:coverage          # Coverage report

# Code quality
deno task check                  # Lint + format + type check
deno fmt                         # Format code
deno lint                        # Lint code

# Deployment
deno task deploy                 # Deploy to Deno Deploy
git push origin main             # Auto-deploy via GitHub Actions
```

---

## Common Patterns

### API Endpoints (REST)

```typescript
// Standard CRUD pattern
GET    /api/resource             // List all
GET    /api/resource/:id         // Get one
POST   /api/resource             // Create
PUT    /api/resource/:id         // Update
DELETE /api/resource/:id         // Delete
```

### Deno KV Keys

```typescript
// Hierarchical key patterns
['users', userId]                    // User by ID
['users_by_email', email]            // Secondary index
['posts', postId]                    // Post by ID
['posts_by_user', userId, postId]    // User's posts
['comments', postId, commentId]      // Post's comments

// Composite indexes (for fast multi-field queries)
['users_by_role', role, timestamp, userId]              // Query by role
['users_by_role_verified', role, verified, timestamp]   // Query by role + verified
['notifications_by_user_read', userId, read, timestamp] // Unread notifications
['jobs_by_name_status', name, status, priority]         // Jobs by name + status
```

### Composite Index Queries (100x-1000x faster)

```typescript
import { CompositeIndexManager } from './lib/composite-indexes.ts';

// ❌ SLOW: Full table scan
const allUsers = kv.list({ prefix: ['users'] });
for await (const entry of allUsers) {
  if (entry.value.role === 'admin') admins.push(entry.value);
}

// ✅ FAST: Indexed query (O(log n) instead of O(n))
const admins = await CompositeIndexManager.queryUsers({ role: 'admin' });

// Multi-field query (role + emailVerified)
const verifiedAdmins = await CompositeIndexManager.queryUsers({ 
  role: 'admin', 
  emailVerified: true 
});

// Unread notifications
const unread = await CompositeIndexManager.queryNotifications({ 
  userId: '123',
  read: false 
});

// See docs/COMPOSITE_INDEXES.md for full guide
```

### Response Format

```typescript
// Success
{ "data": { /* resource */ } }

// Error
{ "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
```

---

## Token Optimization

### Feature-Scoped Development (Recommended)

```bash
/new-feature                     # Creates docs in features/proposed/[name]/
# vs global docs approach        # 40-50% fewer tokens
```

### Pattern References

Agents automatically use templates from:
- `backend/templates/` - Service & route patterns
- `frontend/templates/` - Component & page patterns
- `tests/templates/` - Test patterns

**Savings:** ~50-60% reduction per feature (from ~38K to ~14K tokens)

---

## TDD Workflow

```
1. RED:   Write failing test
2. GREEN: Write minimal code
3. REFACTOR: Improve code        (while keeping tests green)
```

---

## File Structure

```
backend/
├── main.ts              # Server entry
├── routes/              # API routes (HTTP handlers)
├── services/            # Business logic
└── types/               # TypeScript types

frontend/
├── routes/              # Fresh routes (SSR)
├── islands/             # Interactive components (client-side)
└── components/          # Shared components

tests/
├── unit/                # Unit tests
└── integration/         # Integration tests

features/
├── proposed/            # Features being developed
└── implemented/         # Completed features

docs/
├── architecture.md      # System architecture (THIS FILE IS ESSENTIAL)
└── guides/              # Detailed guides (reference only)
```

---

## Testing with Deno KV

```typescript
// In-memory KV for tests (fast, isolated)
const kv = await Deno.openKv(':memory:');

// Cleanup after tests
try {
  // ... test code
} finally {
  await kv.close();
}
```

---

## When to Migrate

### Deno KV → PostgreSQL
When you need:
- Complex JOINs across many tables
- Advanced aggregations (GROUP BY with HAVING)
- Full-text search at database level
- Analytics/reporting queries

### Monolith → Microservices
When you have:
- 10+ developers
- Clear domain boundaries
- Different scaling needs per service
- 100K+ users

---

## Slash Commands Quick Ref

| Command | Use Case | When to Use |
|---------|----------|-------------|
| `/new-feature` | Build complete feature | 90% of development |
| `/mockup` | Visual prototype | UI-heavy features |
| `/design` | Update design system | Rebrand, customize styling |

| `/review` | Code review | Before merging |
| `/requirements` | Project docs | Large projects (10+ features) |
| `/architect` | Update architecture | DB migration, microservices |

---

## Best Practices

### Code
- ✅ YAGNI - You Ain't Gonna Need It
- ✅ KISS - Keep It Simple, Stupid
- ✅ DRY - Don't Repeat Yourself
- ✅ Test first (TDD)

### Architecture
- ✅ Start simple, scale later
- ✅ Use boring, proven technology
- ✅ Avoid premature optimization
- ✅ Clear separation: Routes → Services → Database

### Testing
- ✅ Test business logic (not frameworks)
- ✅ Use in-memory KV for speed
- ✅ AAA pattern (Arrange, Act, Assert)
- ✅ One assertion per test

---

## Common Issues

### "Port already in use"
```bash
# Kill processes on ports 3000 and 8000
deno task kill-ports
# Then restart: deno task dev
```

### "Permission Denied"
```bash
# Deno requires explicit permissions
deno run --allow-net --allow-read --allow-env backend/main.ts
# Or use deno task dev (permissions in deno.json)
```

### "Module not found"
```bash
# Always include .ts extension in imports
import { foo } from './bar.ts';  // ✅ Correct
import { foo } from './bar';      // ❌ Wrong
```

### "Tests failing"
```bash
# Ensure using in-memory KV for tests
const kv = await Deno.openKv(':memory:');
```

---

## Resources

- **Architecture:** `docs/architecture.md` (ESSENTIAL - read this!)
- **Detailed Guides:** `docs/guides/` (reference when needed)
- **Templates:** `backend/templates/`, `frontend/templates/`, `tests/templates/`
- **Deno Docs:** https://deno.com/manual
- **Fresh Docs:** https://fresh.deno.dev/docs
- **Hono Docs:** https://hono.dev/

---

## Token Optimization Summary

| Approach | Tokens/Feature | Speed | Use When |
|----------|----------------|-------|----------|
| **Feature-scoped + patterns** | ~14K | Fast | New features (recommended) |
| Feature-scoped only | ~20K | Fast | Basic features |
| Global docs | ~38K | Slower | Initial setup |

**Recommendation:** Always use `/new-feature` for 40-50% token savings.

---

**Need more details?** See comprehensive guides in `docs/guides/`:
- `TOKEN_OPTIMIZATION_GUIDE.md`
- `TEST_OPTIMIZATION_GUIDE.md`
- `BACKEND_OPTIMIZATION_GUIDE.md`
- `FRONTEND_OPTIMIZATION_GUIDE.md`
- `ORCHESTRATION_GUIDE.md`
- `DENO_KV_GUIDE.md`
