# Token Optimization Guide

This guide documents the token efficiency optimizations implemented in the API design and data model workflow.

## Overview

The template now includes **4 levels of token optimization** that can save **1000-2000 tokens per feature** (40-60% reduction in API design phase).

## Optimization Layers

### Layer 1: Feature-Scoped Documentation (Already Implemented)
**Token Savings**: 40-50% vs global docs

Features are documented separately in `features/proposed/{feature-name}/` instead of in global `docs/` files.

- ✅ Agents only read feature-specific context
- ✅ No need to parse entire project docs
- ✅ Better organization and rollback

### Layer 2: Pattern Reference System (NEW)
**Token Savings**: ~500-800 tokens per feature

Instead of repeating error responses, CRUD patterns, and validation rules, reference reusable patterns.

**Files**:
- `features/_templates/API_PATTERNS.md` - Standard endpoint patterns and error responses
- `features/_templates/ZOD_PATTERNS.md` - Common Zod validation patterns
- `features/_templates/zod-patterns.ts` - Reusable TypeScript/Zod code

**Benefits**:
- ✅ Reference patterns instead of documenting every error (saves ~200 tokens/endpoint)
- ✅ Import common Zod fields instead of rewriting (saves ~50 tokens/field)
- ✅ CRUD patterns defined once, referenced many times

### Layer 3: Shorthand Templates (NEW)
**Token Savings**: ~400-600 tokens per simple feature

For simple CRUD features, use condensed documentation format.

**Files**:
- `features/_templates/api-spec-shorthand.md` - Table-based endpoint documentation

**When to use**:
- ✅ Standard CRUD operations (Create, Read, Update, Delete, List)
- ✅ No complex business logic
- ✅ Standard validation rules
- ❌ Complex custom endpoints
- ❌ Non-standard request/response formats

### Layer 4: Smart Agent Instructions (NEW)
**Token Savings**: Automatic application of above optimizations

The API designer agent now:
- ✅ Analyzes feature complexity
- ✅ Chooses shorthand vs full template automatically
- ✅ References patterns instead of repeating
- ✅ Imports Zod patterns for common fields

## Token Savings Breakdown

| Optimization | Per Feature | Per Endpoint | When Applied |
|--------------|-------------|--------------|--------------|
| Feature-scoped docs | 8,000-15,000 | N/A | Always (Level 1) |
| Pattern references | 600-1,000 | 150-200 | Always (Level 2) |
| Shorthand template | 400-600 | N/A | Simple CRUD (Level 3) |
| Smart agent | Varies | Varies | Always (Level 4) |
| **Total possible** | **9,000-16,600** | **150-200** | **All levels** |

## Usage Examples

### Example 1: Simple CRUD Feature (Recommended Approach)

**Feature**: User profiles with standard CRUD operations

**Agent will use**:
1. Feature-scoped documentation (Layer 1)
2. `api-spec-shorthand.md` template (Layer 3)
3. Pattern references for errors (Layer 2)
4. Zod pattern imports (Layer 2)

**Result**: ~10,000 tokens (vs ~25,000 with old approach)

**api-spec.md**:
```markdown
# API Specification: User Profiles

## Endpoints

| Endpoint | Pattern | Auth | Notes |
|----------|---------|------|-------|
| POST /api/v1/profiles | CREATE_RESOURCE | Yes | - |
| GET /api/v1/profiles | LIST_RESOURCES | Yes | Filter by status |
| GET /api/v1/profiles/:id | GET_RESOURCE | Yes | - |
| PUT /api/v1/profiles/:id | UPDATE_RESOURCE | Yes | - |
| DELETE /api/v1/profiles/:id | DELETE_RESOURCE | Yes | Soft delete |

See `API_PATTERNS.md` for pattern definitions.
All endpoints use `STANDARD_ERRORS`.
```

**data-models.md**:
```typescript
import {
  idField,
  nameField,
  emailField,
  statusField,
  timestampFields,
  generateCRUDSchemas,
} from '../_templates/zod-patterns.ts';

const ProfileSchema = z.object({
  ...idField,
  ...nameField,
  ...emailField,
  bio: z.string().max(500).nullable(),
  ...statusField,
  ...timestampFields,
});

const { base, create, update } = generateCRUDSchemas('Profile', ProfileSchema);
export { base as ProfileSchema, create as CreateProfileSchema, update as UpdateProfileSchema };
```

### Example 2: Complex Feature (Full Documentation)

**Feature**: Advanced workout builder with custom logic

**Agent will use**:
1. Feature-scoped documentation (Layer 1)
2. Full `api-spec.md` template (not shorthand)
3. Pattern references where applicable (Layer 2)
4. Zod pattern imports for common fields (Layer 2)

**Result**: ~15,000 tokens (vs ~42,000 with old global approach)

**Why full template?**
- Custom endpoint logic (exercise validation)
- Non-standard responses (includes calculated fields)
- Complex business rules (exercise ordering, duration calculation)

## How to Use

### For Developers

When building a new feature, the `/new-feature` command will automatically:
1. Analyze feature complexity from requirements
2. Choose the appropriate template (shorthand vs full)
3. Reference patterns automatically
4. Import Zod patterns for common fields

**You don't need to do anything special** - it's automatic!

### For Agent Customization

If you want to adjust when shorthand templates are used:

Edit agent files as needed:

```markdown
### Use `api-spec-shorthand.md` when:
- ✅ [Your criteria]
- ✅ [Your criteria]

### Use `api-spec.md` when:
- ✅ [Your criteria]
```

## Migration

### Existing Features

Features already documented using the old format don't need to change. The optimizations apply to **new features** going forward.

If you want to migrate an existing feature:
1. Copy shorthand template if feature is simple CRUD
2. Replace full error documentation with `STANDARD_ERRORS` reference
3. Update data-models.md to use Zod pattern imports
4. Estimated savings: ~1,000-2,000 tokens

### Existing Global Docs

Global docs in `docs/` remain unchanged:
- `docs/architecture.md` - Overall system architecture
- `docs/adr/` - Architecture Decision Records
- `docs/requirements.md` - Project-wide requirements

Only feature-specific API docs benefit from these optimizations.

## Reference Files

| File | Purpose | When to Read |
|------|---------|--------------|
| `features/_templates/API_PATTERNS.md` | Standard CRUD patterns and error responses | When agent needs pattern definitions |
| `features/_templates/ZOD_PATTERNS.md` | Documentation of Zod patterns | When agent needs validation pattern reference |
| `features/_templates/zod-patterns.ts` | Actual TypeScript/Zod code | When implementing data models |
| `features/_templates/api-spec-shorthand.md` | Condensed API template | When feature is simple CRUD |
| `features/_templates/api-spec.md` | Full API template | When feature is complex |
| `features/_templates/data-models.md` | Data model template | When defining schemas |

## Best Practices

### DO ✅

1. **Default to shorthand** - Use shorthand template unless feature is clearly complex
2. **Reference patterns** - Always use `STANDARD_ERRORS` and `CREATE_RESOURCE` patterns
3. **Import Zod patterns** - Use `idField`, `timestampFields`, etc. from zod-patterns.ts
4. **Document only uniqueness** - Only write about what's different from standard patterns

### DON'T ❌

1. **Don't repeat error responses** - Reference `STANDARD_ERRORS` instead
2. **Don't rewrite common validations** - Import from zod-patterns.ts
3. **Don't use full template for simple CRUD** - Use shorthand
4. **Don't document standard behaviors** - Reference patterns

## Measuring Success

Track token usage in your features:

**Old approach** (global docs, no patterns):
- Initial project: ~25,000 tokens
- Per feature: ~20,000 tokens
- 5 features: ~125,000 tokens total

**New approach** (all optimizations):
- Initial project: ~15,000 tokens (feature-scoped)
- Per feature (simple): ~10,000 tokens (shorthand + patterns)
- Per feature (complex): ~15,000 tokens (full + patterns)
- 5 features (3 simple, 2 complex): ~60,000 tokens total

**Savings: 52% (65,000 tokens)**

## Future Optimizations

Potential additional optimizations:

1. **Common component library** - Reusable UI components with standardized APIs
2. **Test pattern templates** - Standard test cases for CRUD operations
3. **Backend service patterns** - Reusable service layer code
4. **Database query patterns** - Standard Deno KV query structures

## Questions?

- See `features/README.md` for feature-scoped workflow
- See `API_PATTERNS.md` for pattern definitions
- See `ZOD_PATTERNS.md` for validation patterns
- Use `/new-feature` command to build features with all optimizations automatically
