# Claude Code + Deno 2 Starter: AI Agent Instructions

## Big Picture Architecture
- **Single Fresh Server**: All SSR, API, and client code run on one Deno 2 server (see `frontend/`). No separate backend.
- **Key Directories**:
  - `frontend/routes/`: Server-rendered pages and API endpoints (`api/` subdir)
  - `frontend/islands/`: Client-side interactive Preact components
  - `shared/`: Reusable business logic, repositories, services, and types
  - `features/`: Feature-scoped docs, specs, and requirements (see below)
  - `tests/`: Test templates, helpers, and coverage
- **Data**: Uses Deno KV for persistence (no SQL/ORM). See `shared/repositories/`.
- **Background Jobs**: Queue and scheduler system, optimized for Deno Deploy (see `docs/claude-optimization/`).

## Developer Workflows
- **Dev Server**: `deno task dev` (runs at http://localhost:3000)
- **Tests**:
  - Unit: `deno task test`
  - E2E: `npx playwright test` (see `playwright.config.ts`)
- **Feature Development**:
  - Start new feature: `/new-feature "feature-name"` (auto-creates docs/templates in `features/proposed/`)
  - Use templates in `features/_templates/` for API/data model specs
  - UI mockups: `/mockup` (generates `frontend/routes/mockups/` TSX files)
- **Token Efficiency**: Always prefer feature-scoped docs and code. Avoid global context when possible.

## Project-Specific Conventions
- **Feature-Scoped Docs**: Each feature has its own folder with requirements, API spec, data models, and notes. See `features/README.md`.
- **Templates**: Use provided templates for backend (`service-crud.template.ts`), frontend (`route-list.template.tsx`), and tests (`service.test.template.ts`).
- **Design System**: Use components from `frontend/components/design-system/` for all UI work—do not create custom UI unless necessary.
- **Testing**: Only test business/domain logic. Do not test framework code (routing, HTTP status, etc.). See `tests/README.md`.
- **Mockups**: All UI mockups are embedded as comments in TSX files in `frontend/routes/mockups/`.
- **Logging**: Use `shared/lib/logger.ts` for all server-side logging (API routes, services, repositories). Never use `console.log` in server code.

## Integration & Patterns
- **API**: REST endpoints live in `frontend/routes/api/`. Use shorthand templates for simple CRUD.
- **Data Models**: Use Zod patterns from `features/_templates/zod-patterns.ts`.
- **Background Jobs**: See `docs/claude-optimization/BACKEND_OPTIMIZATION_GUIDE.md` for queue/scheduler patterns.
- **Cross-Component**: Shared logic in `shared/`—never duplicate business logic in routes or islands.

## Examples
- **New Feature**: See `features/proposed/` for in-progress features, `features/implemented/` for completed ones.
- **UI**: Use `frontend/templates/` and `frontend/components/design-system/`.
- **Tests**: Use `tests/templates/` and follow `tests/README.md`.

---
For more, see `docs/README.md` and the quick reference guides in `docs/`.
