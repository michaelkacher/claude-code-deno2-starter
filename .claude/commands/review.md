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

## Testing
- [ ] Run all tests: `deno task test --allow-all`
- [ ] Check test coverage: `deno task test:coverage && deno task coverage`
- [ ] All tests passing
- [ ] Coverage meets targets (80%+ for unit tests)
- [ ] Edge cases are tested
- [ ] Error scenarios are tested

## Security
- [ ] No hardcoded secrets or API keys
- [ ] Input validation on all user inputs
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection
- [ ] Authentication/authorization implemented correctly
- [ ] Sensitive data is encrypted

## Performance
- [ ] Minimal client JavaScript (Fresh islands architecture)
- [ ] Server-side rendering used where appropriate (Fresh routes)
- [ ] Efficient database queries (no N+1 problems)
- [ ] Images optimized
- [ ] Islands are lazy-loaded when possible
- [ ] No memory leaks

## Accessibility
- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader friendly

## Documentation
- [ ] README is up to date
- [ ] API documentation is complete
- [ ] Complex logic has comments
- [ ] ADRs document major decisions

## Architecture
- [ ] Follows architecture decisions in `.docs/architecture.md` or `docs/architecture.md`
- [ ] Separation of concerns maintained (Controller → Service → Repository)
- [ ] Fresh routes used for SSR pages, islands for interactivity
- [ ] Preact Signals used for state (not React hooks)
- [ ] No violations of established patterns
- [ ] Dependencies are appropriate (prefer Deno/JSR over npm)

After review, provide a summary of:
1. What's working well
2. Issues that must be fixed
3. Suggestions for improvement
4. Next steps
