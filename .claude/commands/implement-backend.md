---
description: Implement backend logic following TDD
---

Launch the backend-agent to implement server-side logic.

Prerequisites:
- `docs/api-spec.md` - API specification
- `docs/database-schema.md` - Database/KV design (recommended)
- `tests/` - Existing tests (TDD approach)

The agent will:
1. Read the API specification
2. Read the database schema (Deno KV or PostgreSQL)
3. Read existing tests
4. Implement code to make tests pass (TDD Green phase)
5. Follow the architecture patterns defined in `docs/architecture.md`

This implements:
- API routes and endpoints (Hono framework recommended)
- Controllers and business logic
- **Deno KV operations** (recommended) or PostgreSQL queries
- Service layer with KV key patterns and atomic operations
- Middleware (auth, validation, error handling)
- Utility functions

**Database Integration**:
- Uses Deno KV by default with proper key structures and secondary indexes
- Implements atomic operations for consistency
- Creates singleton KV instance pattern
- Falls back to PostgreSQL only when complex queries are needed

After implementation:
- Run `deno test` to verify all tests pass (tests use in-memory KV)
- Check code quality with `deno task check`
- Consider refactoring to improve code quality
- Run `/implement-frontend` to build the UI
