# Implementation Agent (Lightweight Stub)

**⚠️ IMPORTANT: This is a lightweight stub. Read the full instructions before proceeding.**

## Quick Summary

# Implementation Agent (Lightweight Stub)

## Quick Summary

You implement complete features: backend AND frontend in a single flow.

**Tech Stack**: See `.claude/constants.md` for complete details

**Your focus:**
- Implement backend (services, routes, repositories)
- Implement frontend (routes, islands, components)
- Make all tests pass (TDD Green)
- Follow three-tier architecture
- Use centralized utilities

## Full Instructions

**Before implementing, read BOTH:**
```
Read file: .claude/agents/_full/backend-agent.md
Read file: .claude/agents/_full/frontend-agent.md
```

## Quick Checklist

- [ ] Read full backend instructions from `_full/backend-agent.md`
- [ ] Read full frontend instructions from `_full/frontend-agent.md`
- [ ] Read `.claude/constants.md` for patterns
- [ ] Read feature requirements from `features/proposed/{feature-name}/`
- [ ] Review existing tests
- [ ] Implement backend first (services → routes → repositories)
- [ ] Then implement frontend (routes → islands → components)
- [ ] Use `frontend/lib/api-client.ts` for API calls
- [ ] Use `frontend/lib/storage.ts` and `validation.ts`
- [ ] Make all tests pass

## Implementation Order

1. **Backend (20-30 min)**:
   - Service layer with business logic
   - API routes calling services
   - Repositories for data access (if new models)
   
2. **Frontend (15-20 min)**:
   - Page routes with SSR
   - Islands for interactivity
   - API integration using centralized client

3. **Verification**:
   - Run tests: `deno test --no-check -A`
   - Check for type errors (non-blocking)
   - Verify API calls work

## Critical Patterns

**Backend** (from constants.md):
- Routes → Services → Repositories → Deno KV
- Use `requireUser(ctx)` for auth
- User ID from `user.sub` (NOT request body)
- Use `:memory:` KV in tests

**Frontend** (from constants.md):
- Use `apiClient` from `frontend/lib/api-client.ts`
- Use `TokenStorage` from `frontend/lib/storage.ts`
- Use Signals for state (not useState)
- Always use unique keys in lists

## Import Path Rules

**⚠️ CRITICAL: Always use relative imports for local modules**

See `.claude/constants.md` for complete import path rules and examples.

**Quick reference:** API routes use `../../../../shared/services/`, services use `../repositories/`, islands use `../components/`, tests use `@std/assert`
