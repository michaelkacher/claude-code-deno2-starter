# Contributing Guide

Thank you for contributing to this project! This guide will help you understand our development workflow.

## Development Workflow

We follow Test-Driven Development (TDD) using Claude Code agents.

### Primary Workflow: /new-feature (Recommended for 90% of work)

For most development work, use the integrated workflow:

```bash
/new-feature
```

This command handles the entire feature lifecycle:
1. **Requirements gathering** - Documents what you're building
2. **API design** - Defines contracts and data models
3. **Database design** - Creates schema with migrations
4. **Test writing** (Red phase) - Writes failing tests
5. **Backend implementation** (Green phase) - Makes backend tests pass
6. **Frontend implementation** (Green phase) - Builds UI components
7. **Review** - Validates code quality and test coverage

**Benefits:**
- 40-50% more token efficient than individual commands
- Feature-scoped documentation (avoids global file conflicts)
- Integrated workflow with automatic handoffs
- Built-in mockup detection and conversion

### Alternative: UI Mockup First

For UI-heavy features, prototype the design first:

```bash
# 1. Create visual mockup (no backend logic)
/mockup

# 2. Review mockup at http://localhost:3000/mockups/{name}

# 3. Convert to full feature (auto-detects mockup)
/new-feature
```

### Design System Updates

For customizing the app's visual design:

```bash
/design
```

Use this to:
- Update design tokens (colors, typography, spacing)
- Customize component styles (buttons, cards, inputs, etc.)
- Rebrand the application
- Add new component variants
- Update design showcase page

### Advanced: Individual Agent Commands

For specific tasks or updating existing code, use individual agents:

```bash
/write-tests         # Add tests to existing code
/implement-backend   # Implement backend logic
/implement-frontend  # Build UI components
/review             # Review code quality
```

**Note:** These commands work with the existing global docs approach and are less token-efficient than `/new-feature`.

### When to Use /architect

**Only use for major architectural changes:**
```bash
/architect
```

Valid scenarios:
- Migrating from Deno KV to PostgreSQL (outgrowing KV)
- Splitting monolith into microservices (scaling)
- Adding major infrastructure (Redis, message queues, CDN)

**Note:** This template ships with production-ready architecture (Deno 2 + Hono + Fresh + Deno KV). Most projects won't need architectural changes.

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

- Read the [README](./README.md) for setup and overview
- Check `docs/QUICK_REFERENCE.md` for common patterns and commands
- Review `docs/architecture.md` for system architecture
- Browse `features/implemented/` to see examples of completed features
- Ask questions in pull request discussions

## Architecture Decisions

**This template ships with production-ready architecture.** Most projects won't need architectural changes.

If you need to make a major architectural change (database migration, microservices, etc.), use `/architect` to update `docs/architecture.md` and document the decision.

**Note:** Minor decisions (like adding a new API endpoint or UI component) don't require architectural documentation - just use `/new-feature`.

## Documentation

### Feature-Scoped Documentation (Preferred)

When using `/new-feature`, documentation is automatically created in `features/proposed/{feature-name}/`:
- `requirements.md` - Feature requirements and acceptance criteria
- `api-spec.md` - API endpoints and data models
- `database-schema.md` - Database tables and relationships

After implementation, move the feature folder to `features/implemented/{feature-name}/`.

**Benefits:**
- No merge conflicts from global docs
- Self-contained feature context
- Easy to reference and maintain

### Global Documentation (Only for Major Changes)

Update global docs only for project-wide changes:
- `docs/architecture.md` - Major architectural decisions (database migration, etc.)
- `docs/QUICK_REFERENCE.md` - Common patterns and workflows
- `README.md` - Setup and overview

**Note:** Avoid updating global `docs/requirements.md` or `docs/api-spec.md` - use feature-scoped docs instead.

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

### Port Already in Use
If you get "port already in use" errors:
```bash
deno task kill-ports  # Kills processes on ports 3000 and 8000
deno task dev         # Then restart
```

This is useful when hidden instances of the app are blocking the ports.

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
