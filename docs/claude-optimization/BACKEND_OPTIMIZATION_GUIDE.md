# Backend Implementation Optimization Guide

Token efficiency optimizations for backend service and route implementation.

## Overview

**3 optimization layers** save **1300-2000 tokens per service** (50-60% reduction in backend implementation phase).

## Optimization Layers

### Layer 1: CRUD Service Template
**Token Savings**: ~600-800 tokens per service

Pre-built service with all CRUD operations, Deno KV integration, and secondary indexes.

**File**: `backend/templates/service-crud.template.ts`

### Layer 2: CRUD Routes Template
**Token Savings**: ~400-600 tokens per service

Pre-built REST endpoints with error handling and authentication hooks.

**File**: `backend/templates/routes-crud.template.ts`

### Layer 3: Pattern Reference
**Token Savings**: ~200-400 tokens per service

Common patterns for validation, pagination, error handling, Deno KV operations.

**File**: `backend/templates/BACKEND_PATTERNS.md`

## Token Savings Breakdown

| Optimization | Per Service | When Applied |
|--------------|-------------|--------------|
| CRUD service template | 600-800 | Simple CRUD (Layer 1) |
| CRUD routes template | 400-600 | Standard REST (Layer 2) |
| Pattern references | 200-400 | Complex services (Layer 3) |
| **Total possible** | **1200-1800** | **All layers** |

## Usage Example

### Simple CRUD Service

**Old approach** (~2500 tokens):
- Write service class from scratch
- Implement 6-8 CRUD methods
- Handle Deno KV operations
- Implement secondary indexes
- Write 5 route handlers
- Add error handling for each route

**New approach** (~1000 tokens):
```typescript
// 1. Copy service template (50 tokens)
// cp backend/templates/service-crud.template.ts backend/services/users.ts

// 2. Replace placeholders (50 tokens)
// [Resource] → User
// [resource] → user
// [resources] → users

// 3. Copy routes template (50 tokens)
// cp backend/templates/routes-crud.template.ts backend/routes/users.ts

// 4. Replace placeholders (50 tokens)

// 5. Customize validation (200 tokens)
// Add business-specific rules

// 6. Add custom methods (600 tokens)
// Only what's unique to this service
```

**Result**: ~1000 tokens (60% savings)

## Combined Savings

### Full Feature Development

| Phase | Old | New | Savings |
|-------|-----|-----|---------|
| API Design | 25,000 | 8-12,000 | 52-68% |
| Test Writing | 7,500 | 3,600 | 52% |
| Backend Impl | 2,500 | 1,000 | 60% |
| **Total** | **35,000** | **12,600-16,600** | **53-64%** |

**Combined optimizations save 18,400-22,400 tokens per feature!**

## Best Practices

✅ **Use templates** - Start with CRUD templates for simple services
✅ **Reference patterns** - Use BACKEND_PATTERNS.md for common scenarios
✅ **Import schemas** - Use Zod schemas from data models
✅ **Follow TDD** - Implement to pass tests

❌ **Don't write from scratch** - Use templates
❌ **Don't repeat patterns** - Reference BACKEND_PATTERNS.md
❌ **Don't redefine schemas** - Import from data models

## Reference Files

| File | Purpose |
|------|---------|
| `backend/templates/service-crud.template.ts` | CRUD service template |
| `backend/templates/routes-crud.template.ts` | REST routes template |
| `backend/templates/BACKEND_PATTERNS.md` | Pattern reference |
| `backend/templates/README.md` | Quick start guide |

See also:
- [Token Optimization Guide](TOKEN_OPTIMIZATION_GUIDE.md) - API design optimizations
- [Test Optimization Guide](TEST_OPTIMIZATION_GUIDE.md) - Test writing optimizations
