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
- [ ] Run all tests: `npm test`
- [ ] Check test coverage: `npm test -- --coverage`
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
- [ ] No unnecessary re-renders (React)
- [ ] Efficient database queries (no N+1 problems)
- [ ] Images optimized
- [ ] Code splitting implemented where beneficial
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
- [ ] Follows architecture decisions in `docs/architecture.md`
- [ ] Separation of concerns maintained
- [ ] No violations of established patterns
- [ ] Dependencies are appropriate

After review, provide a summary of:
1. What's working well
2. Issues that must be fixed
3. Suggestions for improvement
4. Next steps
