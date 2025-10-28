# Backend Templates

Token-efficient templates for backend implementation.

## Quick Reference

| Template | Use For | Tokens Saved |
|----------|---------|--------------|
| `service-crud.template.ts` | CRUD services | ~600-800 |
| `routes-crud.template.ts` | REST endpoints | ~400-600 |
| `BACKEND_PATTERNS.md` | Patterns reference | ~200-400 |

## Usage

### Simple CRUD Feature

1. **Copy service template**: `service-crud.template.ts` → `backend/services/users.ts`
2. **Replace placeholders**: `[Resource]` → `User`, `[resources]` → `users`
3. **Copy routes template**: `routes-crud.template.ts` → `backend/routes/users.ts`
4. **Replace placeholders**: Same as service
5. **Customize**: Add custom business logic

**Result**: Complete CRUD implementation in ~1000 tokens (vs ~2500 from scratch)

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
