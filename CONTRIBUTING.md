# Contributing Guide

Thank you for contributing to this project! This guide will help you understand our development workflow.

## Development Workflow

We follow Test-Driven Development (TDD) using Claude Code agents:

### 1. Requirements Phase
```bash
/requirements
```
Document what you're building before writing code.

### 2. Architecture Phase
```bash
/architect
```
Design the system architecture and document decisions in ADRs.

### 3. API Design Phase
```bash
/design-api
```
Define API contracts before implementation.

### 4. Test Phase (Red)
```bash
/write-tests
```
Write tests that fail initially. This is the **Red** phase of TDD.

### 5. Implementation Phase (Green)
```bash
/implement-backend
/implement-frontend
```
Write minimal code to make tests pass. This is the **Green** phase of TDD.

### 6. Refactor Phase
After tests pass, refactor code while keeping tests green.

## Code Style

- **TypeScript**: Use strict mode, no `any` types
- **Formatting**: Run `deno fmt` before committing
- **Linting**: Fix all lint warnings: `deno lint`
- **Testing**: Maintain 80%+ test coverage

## Testing Guidelines

### Unit Tests
- Test individual functions in isolation
- Use mocks for dependencies
- Follow AAA pattern (Arrange, Act, Assert)

### Integration Tests
- Test API endpoints end-to-end
- Use test database
- Clean up after each test

### Component Tests
- Test user interactions
- Check accessibility
- Test error states

## Commit Messages

Use conventional commits:

```
feat: add user authentication
fix: resolve login form validation
docs: update API documentation
test: add tests for user service
refactor: simplify error handling
```

## Pull Request Process

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Follow the TDD workflow above
3. Ensure all tests pass: `deno task test`
4. Check test coverage: `deno task test:coverage`
5. Run linter: `deno lint`
6. Type check: `deno task type-check`
7. Create PR with description of changes
8. Link related issues

## Review Checklist

Before requesting review, run:

```bash
/review
```

This will check:
- Code quality
- Test coverage
- Security
- Performance
- Accessibility
- Documentation

## Getting Help

- Read the [README](./README.md) for overview
- Check `.claude/agents/` for agent documentation
- Review existing `docs/` for architecture decisions
- Ask questions in pull request discussions

## Architecture Decisions

Major architectural changes require an ADR (Architecture Decision Record):

1. Use `/architect` to help create the ADR
2. Place in `docs/adr/NNN-title.md`
3. Follow the ADR template
4. Get team review before implementing

## Documentation

Keep documentation up to date:

- Update `docs/requirements.md` when requirements change
- Update `docs/architecture.md` for architectural changes
- Update `docs/api-spec.md` when API changes
- Add ADRs for major decisions
- Update README for new features

## Local Development

```bash
# No installation needed - Deno manages dependencies automatically!

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run development server
deno task dev

# Run tests in watch mode
deno task test:watch

# Type check
deno task type-check
```

## Common Issues

### Tests Failing
1. Ensure you're in the correct TDD phase
2. Check test expectations match implementation
3. Verify test data is correctly set up

### Type Errors
1. Run `deno task type-check` to see all errors
2. Update types in `backend/types/`
3. Ensure API spec matches implementation

### Linting Errors
1. Run `deno lint` to see issues
2. Format code: `deno fmt`
3. Deno's linter is built-in with sensible defaults

## Questions?

Open an issue or discussion if you have questions!
