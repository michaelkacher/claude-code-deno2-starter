# Backend Templates

Token-efficient templates for backend implementation.

## Quick Reference

| Template | Use For | Tokens Saved | Best For |
|----------|---------|--------------|----------|
| `service-crud.template.ts` | CRUD services | ~600-800 | All services |
| `BACKEND_PATTERNS.md` ⭐ | Backend patterns reference | ~600-800 | All backend code |
| `ROUTE_PATTERNS.md` ⭐ | Route patterns reference | ~400-600 | All routes |

## Usage

### Simple CRUD Feature (Recommended)

1. **Copy service template**: `service-crud.template.ts` → `shared/services/users.ts`
2. **Replace placeholders**: `[Resource]` → `User`, `[resources]` → `users`
3. **Customize**: Add custom business logic, configure WebSocket broadcasts
4. **Create routes**: Reference `ROUTE_PATTERNS.md` for route handlers

**Result**: Complete CRUD in ~800 tokens (vs ~2500 from scratch) - **68% savings!**

### Complex Feature

1. **Copy service template**: `service-crud.template.ts` → customize
2. **Reference patterns**: Use `ROUTE_PATTERNS.md` for complex route scenarios
3. **Reference backend**: Use `BACKEND_PATTERNS.md` for WebSocket, repositories, etc.

**Result**: ~1200 tokens (vs ~3000 from scratch) - **60% savings**

## Architecture Layers

The app follows a three-layer architecture:

```
Routes → Services → Repositories → Deno KV
   ↓         ↓
  Thin    Business Logic
Handler   + WebSocket
```

**Routes** (`frontend/routes/api/`)
- Parse request (query params, body, path params)
- Validate with Zod schemas
- Call service static methods
- Return responses

**Services** (`shared/services/`)
- Static methods (stateless)
- Wrap repository calls
- Add business logic
- Broadcast WebSocket updates

**Repositories** (`shared/repositories/`)
- Instance methods
- Direct Deno KV access
- CRUD operations
- Data persistence

## Token Savings

**Per feature**:
- Service: ~600-800 tokens saved
- Routes: ~400-600 tokens saved
- **Total: ~1000-1400 tokens saved (50-65% reduction)**

See `docs/claude-optimization/TOKEN_OPTIMIZATION_GUIDE.md` for details.
