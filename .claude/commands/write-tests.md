---
description: Write tests following TDD principles
---

Launch the test-writer-agent to create comprehensive tests before implementation.

Prerequisites:
- `docs/api-spec.md` or clear requirements for what to test

The agent will create test files:
- `tests/unit/` - Unit tests for business logic
- `tests/integration/` - Integration tests for API endpoints
- `src/components/**/*.test.tsx` - Component tests

This follows Test-Driven Development (TDD):
1. **Red**: Write failing tests first (this command)
2. **Green**: Implement code to pass tests (`/implement-backend` or `/implement-frontend`)
3. **Refactor**: Improve code while keeping tests green

After completion, run:
- `npm test` to verify tests fail (Red phase)
- `/implement-backend` or `/implement-frontend` to implement the code
