# Feature Templates

This folder contains templates for feature-scoped documentation with token efficiency optimizations.

## Template Files

### API Specification Templates

| File | Use Case | Token Savings | When to Use |
|------|----------|---------------|-------------|
| `api-spec-shorthand.md` | Simple CRUD features | ~600 tokens | ✅ Default for most features |
| `api-spec.md` | Complex features | ~200 tokens | Only if custom logic needed |

**Decision rule**: If feature has 5+ endpoints that are all standard CRUD, use shorthand. Otherwise, use full template.

### Data Model Templates

| File | Use Case | Purpose |
|------|----------|---------|
| `data-models.md` | All features | Template with Zod pattern imports |
| `ZOD_PATTERNS.md` | Reference | Documentation of available Zod patterns |
| `zod-patterns.ts` | All features | Actual TypeScript code to import |

### Pattern Reference Files

| File | Purpose | When to Reference |
|------|---------|-------------------|
| `API_PATTERNS.md` | Standard CRUD patterns and error responses | Every API spec |
| `ZOD_PATTERNS.md` | Common validation patterns | Every data model |

### Other Templates

| File | Purpose |
|------|---------|
| `requirements.md` | Feature requirements template |
| `notes.md` | Additional notes during development |
| `implementation.md` | Post-completion summary |

## Usage Flow

When creating a new feature:

```bash
/new-feature "user-profiles"
```

The agent will:

1. **Analyze complexity** from requirements
   - Simple CRUD? → Use `api-spec-shorthand.md`
   - Complex logic? → Use `api-spec.md`

2. **Create API spec** with pattern references
   - Reference `API_PATTERNS.md` for CRUD patterns
   - Use `STANDARD_ERRORS` for error responses
   - Only document unique behaviors

3. **Create data models** with Zod imports
   - Import from `zod-patterns.ts` for common fields
   - Reference `ZOD_PATTERNS.md` for available patterns
   - Only define custom fields

## Example: Using Shorthand Template

**Feature**: Task management with standard CRUD

**api-spec.md** (shorthand):
```markdown
# API Specification: Task Management

## Endpoints

| Endpoint | Pattern | Auth | Notes |
|----------|---------|------|-------|
| POST /api/tasks | CREATE_RESOURCE | Yes | - |
| GET /api/tasks | LIST_RESOURCES | Yes | Filter by status |
| GET /api/tasks/:id | GET_RESOURCE | Yes | - |
| PUT /api/tasks/:id | UPDATE_RESOURCE | Yes | - |
| DELETE /api/tasks/:id | DELETE_RESOURCE | Yes | Soft delete |

All endpoints use `STANDARD_ERRORS` (see API_PATTERNS.md).
```

**Result**: ~300 tokens vs ~900 tokens with full documentation

## Example: Using Zod Patterns

**data-models.md**:
```typescript
import {
  idField,
  nameField,
  statusField,
  timestampFields,
  generateCRUDSchemas,
} from '../_templates/zod-patterns.ts';

const TaskSchema = z.object({
  ...idField,
  ...nameField,
  description: z.string().max(1000),
  ...statusField,
  ...timestampFields,
});

const { base, create, update } = generateCRUDSchemas('Task', TaskSchema);
export { base as TaskSchema, create as CreateTaskSchema, update as UpdateTaskSchema };
```

**Result**: ~200 tokens vs ~350 tokens writing schemas manually

## Token Savings Summary

| Optimization | Savings per Feature | Cumulative |
|--------------|---------------------|------------|
| Feature-scoped (vs global) | 8,000-15,000 | 40-50% |
| Pattern references | 600-1,000 | +15-20% |
| Shorthand template | 400-600 | +10-15% |
| Zod pattern imports | 100-200 | +5% |
| **Total potential** | **9,000-16,800** | **50-60%** |

## Best Practices

1. ✅ **Default to shorthand** - Use `api-spec-shorthand.md` unless complexity requires full template
2. ✅ **Reference patterns** - Always use `STANDARD_ERRORS` and CRUD patterns from `API_PATTERNS.md`
3. ✅ **Import Zod patterns** - Use `idField`, `timestampFields`, etc. instead of rewriting
4. ✅ **Document uniqueness only** - Only write about what's different from standard patterns
5. ✅ **Calculate import paths correctly** - See "Import Path Rules" section below
6. ❌ **Don't repeat errors** - Reference `STANDARD_ERRORS` instead of documenting all 5 error codes
7. ❌ **Don't rewrite validations** - Import common fields from `zod-patterns.ts`
8. ❌ **Don't copy-paste import paths** - Calculate depth for each file independently

## Import Path Rules for API Routes

**CRITICAL**: Always calculate import paths correctly to avoid "Module not found" errors.

When creating API routes in `frontend/routes/`:

1. **Count directory depth** from `routes/` (excluding the filename)
2. **For `shared/` imports**: use `(depth + 1)` parent references (`../`)
3. **For `frontend/lib/` imports**: use `(depth)` parent references (`../`)

### Examples:

```typescript
// File at: frontend/routes/api/campaigns/[id]/members/leave.ts
// Depth: 5 directories (api/campaigns/[id]/members/leave.ts)

// ✅ CORRECT shared/ imports (depth + 1 = 6 levels)
import { getKv } from "../../../../../../shared/lib/kv.ts";

// ✅ CORRECT lib/ imports (depth = 5 levels)  
import { requireUser } from "../../../../../lib/fresh-helpers.ts";

// ❌ WRONG - too many ../
import { getKv } from "../../../../../../../shared/lib/kv.ts";
```

**Quick Reference Table:**

| Depth | Example | shared/ | lib/ |
|-------|---------|---------|------|
| 1 | `api/users.ts` | `../../shared/` | `../lib/` |
| 2 | `api/users/[id].ts` | `../../../shared/` | `../../lib/` |
| 3 | `api/users/[id]/posts.ts` | `../../../../shared/` | `../../../lib/` |
| 5 | `api/campaigns/[id]/members/leave.ts` | `../../../../../../shared/` | `../../../../../lib/` |

**See `API_PATTERNS.md` for full documentation and validation script.**

## For Developers

You don't need to manually copy these templates. The `/new-feature` command automatically:
- Chooses the right template based on complexity
- References patterns appropriately
- Imports Zod patterns for common fields

Just use `/new-feature` and let the agent apply the optimizations!

## For Maintainers

### Adding New Patterns

To add a new reusable pattern:

1. **API Pattern**: Add to `API_PATTERNS.md` under appropriate section
2. **Zod Pattern**: Add to both `ZOD_PATTERNS.md` (docs) and `zod-patterns.ts` (code)
3. **Update agent**: Reference the new pattern in agent documentation as needed

### Updating Templates

When updating templates:
- Maintain backward compatibility (old features still work)
- Update all 3 places: template file, agent instructions, this README
- Test with both simple and complex features

## Questions?

- See `docs/TOKEN_OPTIMIZATION_GUIDE.md` for detailed explanation
- See `features/README.md` for feature-scoped workflow overview
- Use `/new-feature` to build features with automatic optimization
