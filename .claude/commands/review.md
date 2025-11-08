---
description: Review code quality, test coverage, and best practices
---

Perform a comprehensive code review focusing on:

## Code Quality
- [ ] Code follows the project's style guide
- [ ] No code duplication (DRY principle)
- [ ] Functions are small and focused (single responsibility)
- [ ] Meaningful variable and function names
- [ ] Appropriate comments for complex logic
- [ ] Server-side code uses `shared/lib/logger.ts` (not console.log)
- [ ] Shared business logic in `shared/` (not duplicated in routes/islands)

## Testing
- [ ] Run all tests: `deno task test` (includes all necessary flags)
- [ ] Check test coverage: `deno task test:coverage && deno task coverage`
- [ ] All tests passing
- [ ] Tests use BDD pattern (describe()/it() from @std/testing/bdd)
- [ ] Tests use lifecycle hooks (beforeEach/afterEach for setup/cleanup)
- [ ] Tests organized in tests/unit/ with subdirectories
- [ ] Test data builders used for consistent test data
- [ ] Coverage meets targets (80%+ for business logic)
- [ ] Edge cases are tested
- [ ] Error scenarios are tested
- [ ] Only business logic is tested (not framework code)

## Security
- [ ] No hardcoded secrets or API keys
- [ ] Input validation on all user inputs using Zod schemas
- [ ] No SQL injection (using Deno KV, not SQL)
- [ ] XSS protection
- [ ] Authentication/authorization implemented correctly
- [ ] Sensitive data is encrypted

## Performance
- [ ] Minimal client JavaScript (Fresh islands architecture)
- [ ] Server-side rendering used where appropriate (Fresh routes)
- [ ] Efficient Deno KV queries (batched reads, proper indexing)
- [ ] Images optimized
- [ ] Islands are lazy-loaded when possible
- [ ] No memory leaks (proper KV cleanup with closeKv())
- [ ] Background jobs use queue system (not blocking requests)

## Accessibility
- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader friendly

## Documentation
- [ ] README is up to date
- [ ] Feature-scoped docs in `features/proposed/` or `features/implemented/`
- [ ] API specs use templates from `features/_templates/`
- [ ] Complex logic has comments
- [ ] Major decisions documented in feature notes

## Architecture
- [ ] Follows architecture in `docs/architecture.md`
- [ ] Separation of concerns: Routes → Services → Repositories
- [ ] Fresh routes (`frontend/routes/`) for SSR pages
- [ ] Fresh islands (`frontend/islands/`) for client interactivity
- [ ] API routes in `frontend/routes/api/`
- [ ] Shared business logic in `shared/services/` and `shared/repositories/`
- [ ] Preact Signals used for state (not React hooks)
- [ ] Design system components used from `frontend/components/design-system/`
- [ ] Deno KV for persistence (`shared/repositories/`)
- [ ] Background jobs use queue/scheduler system (`shared/lib/queue.ts`, `shared/lib/scheduler.ts`)
- [ ] No violations of established patterns
- [ ] Dependencies prefer JSR over npm where possible

After review, provide a summary of:
1. What's working well
2. Issues that must be fixed
3. Suggestions for improvement
4. Next steps
