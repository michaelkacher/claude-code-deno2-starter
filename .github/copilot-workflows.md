# GitHub Copilot Custom Instructions

This file extends the `.github/copilot-instructions.md` with custom workflow commands that mirror Claude Code functionality.

## How to Use

In GitHub Copilot Chat, type:
- `@workspace run new-feature workflow`
- `@workspace run mockup workflow`

Or simply ask:
- `@workspace I want to create a new feature`
- `@workspace I want to create a UI mockup`

## Custom Workflows

### New Feature Workflow

**Trigger phrases:**
- "create new feature"
- "build new feature"  
- "new feature workflow"
- "start feature development"

**Instructions:**

When user requests a new feature, follow the workflow defined in:
```
Read file: .claude/commands/new-feature.md
```

**Summary of workflow:**
1. Get feature name (kebab-case)
2. Detect if first feature (check `features/proposed/` and `features/implemented/`)
3. If first feature, ask 3 lightweight questions:
   - What are you building? (1-2 sentences)
   - Who are the primary users? (1 sentence)
   - What problem does this solve? (1-2 sentences)
4. Create feature directory: `features/proposed/{feature-name}/`
5. Gather requirements → `requirements.md`
6. Design API → `api-spec.md` and `data-models.md`
7. Write tests (TDD) → `tests/unit/` or `tests/integration/`
8. Implement backend → `backend/`
9. Implement frontend → `frontend/`
10. Verify tests pass
11. Move to `features/implemented/` when complete

**Key principles:**
- Feature-scoped documentation (saves 40-50% tokens)
- Test-driven development (write tests first)
- Use templates from `tests/templates/`
- Use agents from `.claude/agents/_full/` for detailed instructions

---

### Mockup Workflow

**Trigger phrases:**
- "create mockup"
- "create UI mockup"
- "mockup workflow"
- "design mockup page"

**Instructions:**

When user requests a mockup, follow the workflow defined in:
```
Read file: .claude/commands/mockup.md
```

**Summary of workflow:**
1. Get feature/page name (kebab-case)
2. Create mockup directory: `features/mockups/{name}/`
3. Create design specification → `design.md` with:
   - Purpose and context
   - User personas
   - Visual design (layout, colors, components)
   - Interactions and states
   - Data requirements
4. Create mockup route → `frontend/routes/mockups/{name}.tsx`
5. Use design system components from `frontend/components/design-system/`
6. Add to mockup index → `frontend/routes/mockups/index.tsx`
7. Test at `http://localhost:3000/mockups/{name}`

**Key principles:**
- Mockups are dev-only (not in production builds)
- Use existing design system components
- Create realistic, interactive prototypes
- Document design decisions
- Link from mockup index page

---

### Test Writer Workflow

**Trigger phrases:**
- "write tests"
- "create tests"
- "generate tests"
- "test workflow"

**Instructions:**

When user requests tests, follow the workflow defined in:
```
Read file: .claude/agents/_full/test-writer-agent.md
```

**Summary:**
1. Choose appropriate template from `tests/templates/`:
   - `service.test.template.ts` - Business logic (80% of tests)
   - `unit.test.template.ts` - Pure functions
   - `integration-api.test.template.ts` - API endpoints
   - `e2e.test.template.ts` - Browser tests with Playwright
2. Read API spec from `features/proposed/{feature-name}/api-spec.md`
3. Read data models from `features/proposed/{feature-name}/data-models.md`
4. Write failing tests first (TDD Red phase)
5. Use AAA pattern (Arrange, Act, Assert)
6. Use test helpers from `tests/helpers/`
7. Reference patterns from `tests/templates/TEST_PATTERNS.md`

---

### Backend Implementation Workflow

**Trigger phrases:**
- "implement backend"
- "create backend"
- "backend implementation"

**Instructions:**

Follow the workflow defined in:
```
Read file: .claude/agents/_full/backend-agent.md
```

**Key patterns:**
- JWT uses `payload.sub` for user ID (NOT `payload.userId`)
- Mount specific routes before general routes (e.g., `/api/admin/data` before `/api/admin`)
- Use Zod for validation
- Use `c.json()` for responses
- Create services for business logic
- Use Deno KV with proper prefixes

---

### Frontend Implementation Workflow

**Trigger phrases:**
- "implement frontend"
- "create frontend"
- "frontend implementation"

**Instructions:**

Follow the workflow defined in:
```
Read file: .claude/agents/_full/frontend-agent.md
```

**Key patterns:**
- Islands for client-side interactivity
- Routes for server-side rendering
- Check `IS_BROWSER` before using browser APIs
- Replace port in API calls: `window.location.origin.replace(':3000', ':8000')`
- Use Tailwind CSS for styling
- Use Preact hooks (not React)

---

## File References

All workflows reference these core files:
- `.claude/commands/new-feature.md` - Complete feature workflow
- `.claude/commands/mockup.md` - Mockup creation workflow
- `.claude/agents/_full/test-writer-agent.md` - Test writing guide
- `.claude/agents/_full/backend-agent.md` - Backend implementation guide
- `.claude/agents/_full/frontend-agent.md` - Frontend implementation guide
- `tests/templates/*.template.ts` - Test templates
- `tests/templates/TEST_PATTERNS.md` - Testing patterns
- `tests/templates/E2E_PATTERNS.md` - E2E testing patterns

## Usage Examples

### Example 1: Create New Feature
```
@workspace I want to create a new feature for user profiles

[Copilot will read .claude/commands/new-feature.md and guide you through the workflow]
```

### Example 2: Create Mockup
```
@workspace create a mockup for the user profile page

[Copilot will read .claude/commands/mockup.md and create the mockup]
```

### Example 3: Generate Tests
```
@workspace write tests for the user service

[Copilot will read the test writer agent and generate tests]
```

## How This Works

1. **GitHub Copilot reads this file** via `.github/copilot-instructions.md` reference
2. **When triggered**, Copilot reads the referenced markdown files
3. **Shares the same documentation** that Claude Code uses
4. **No duplication** - one source of truth for both tools

## Limitations

Unlike Claude Code:
- ❌ No custom `/` slash commands (use `@workspace` instead)
- ❌ No automatic agent orchestration (manual step-through)
- ❌ Can't execute commands directly (provides code you run)
- ❌ Less context persistence between steps

But still powerful:
- ✅ Uses same documentation as Claude Code
- ✅ Follows same patterns and workflows
- ✅ Generates code using project templates
- ✅ Context-aware with `@workspace`
