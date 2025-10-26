---
description: Implement backend logic following TDD
---

Launch the backend-agent to implement server-side logic.

Prerequisites:
- `docs/api-spec.md` - API specification
- `tests/` - Existing tests (TDD approach)

The agent will:
1. Read the API specification
2. Read existing tests
3. Implement code to make tests pass (TDD Green phase)
4. Follow the architecture patterns defined in `docs/architecture.md`

This implements:
- API routes and endpoints
- Controllers and business logic
- Database models and queries
- Middleware (auth, validation, error handling)
- Utility functions

After implementation:
- Run `deno test --allow-all` to verify all tests pass
- Consider refactoring to improve code quality
- Run `/implement-frontend` to build the UI
