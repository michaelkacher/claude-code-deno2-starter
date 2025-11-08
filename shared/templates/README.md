# Backend Templates

Token-efficient templates for backend implementation.

## Quick Reference

| Template | Use For | Tokens Saved | Best For |
|----------|---------|--------------|----------|
| `service-crud.template.ts` | CRUD services | ~600-800 | All services |
| `routes-shorthand.template.ts` ⭐ NEW | Simple REST endpoints | ~600-800 | Simple CRUD |
| `routes-crud.template.ts` | Full REST endpoints | ~400-600 | Complex routes |
| `ROUTE_PATTERNS.md` ⭐ NEW | Route patterns reference | ~300-500 | All routes |
| `BACKEND_PATTERNS.md` | Backend patterns reference | ~200-400 | All backend |

## Usage

### Simple CRUD Feature (Recommended)

1. **Copy service template**: `service-crud.template.ts` → `shared/services/users.ts`
3. **Replace placeholders**: `[Resource]` → `User`, `[resources]` → `users`
4. **Uncomment middleware**: If auth/validation needed
5. **Customize**: Add custom business logic only

**Result**: Complete CRUD in ~800 tokens (vs ~2500 from scratch) - **68% savings!**

### Complex Feature

1. **Copy service template**: `service-crud.template.ts` → customize
2. **Copy full routes template**: `routes-crud.template.ts` → customize
3. **Reference patterns**: Use `ROUTE_PATTERNS.md` for complex scenarios

**Result**: ~1200 tokens (vs ~3000 from scratch) - **60% savings**

### Complex Service

1. Start with CRUD template as base
2. Add custom methods from `BACKEND_PATTERNS.md`
3. Reference patterns for common scenarios

## Token Savings

**Per feature**:
- Service: ~600-800 tokens saved
- Routes: ~400-600 tokens saved
- **Total: ~1000-1400 tokens saved (50-60% reduction)**

See `docs/BACKEND_OPTIMIZATION_GUIDE.md` for details.
