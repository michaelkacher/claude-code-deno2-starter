# API Patterns Reference

This file contains standard API patterns to reference in feature-specific API specs. **Reference these patterns instead of repeating them** to save tokens.

## Standard Error Responses

All endpoints use these standard error formats. **Reference by pattern name** instead of documenting each error.

### Pattern: `STANDARD_ERRORS`

```json
// 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { "field": "error message" }
  }
}

// 401 Unauthorized
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}

// 403 Forbidden
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}

// 404 Not Found
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}

// 409 Conflict
{
  "error": {
    "code": "CONFLICT",
    "message": "Resource already exists"
  }
}

// 500 Internal Server Error
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Standard Success Patterns

### Pattern: `SINGLE_RESOURCE`
```json
{
  "data": { /* resource object */ }
}
```

### Pattern: `RESOURCE_LIST`
```json
{
  "data": [ /* array of resources */ ],
  "cursor": "next-cursor-token"  // null if no more results
}
```

### Pattern: `NO_CONTENT`
```
204 No Content (empty response body)
```

## CRUD Endpoint Patterns

### Pattern: `CREATE_RESOURCE`

**Endpoint**: `POST /api/{resources}`
**Auth**: Required
**Request**: JSON body with resource fields (omit id, timestamps)
**Success**: 201 with `SINGLE_RESOURCE` response
**Errors**: `STANDARD_ERRORS` (400, 401, 409, 500)

### Pattern: `LIST_RESOURCES`

**Endpoint**: `GET /api/{resources}?limit=10&cursor=abc`
**Auth**: Required/Optional
**Query Params**: `limit` (number, 1-100), `cursor` (string, optional)
**Success**: 200 with `RESOURCE_LIST` response
**Errors**: `STANDARD_ERRORS` (400, 401, 500)

### Pattern: `GET_RESOURCE`

**Endpoint**: `GET /api/{resources}/:id`
**Auth**: Required
**Success**: 200 with `SINGLE_RESOURCE` response
**Errors**: `STANDARD_ERRORS` (401, 404, 500)

### Pattern: `UPDATE_RESOURCE`

**Endpoint**: `PUT /api/{resources}/:id`
**Auth**: Required
**Request**: JSON body with partial resource fields
**Success**: 200 with `SINGLE_RESOURCE` response
**Errors**: `STANDARD_ERRORS` (400, 401, 404, 500)

### Pattern: `DELETE_RESOURCE`

**Endpoint**: `DELETE /api/{resources}/:id`
**Auth**: Required
**Success**: `NO_CONTENT` (204)
**Errors**: `STANDARD_ERRORS` (401, 404, 500)

## Usage in API Specs

Instead of documenting full endpoints, reference patterns:

```markdown
### 1. Create Workout

**Pattern**: `CREATE_RESOURCE` (see API_PATTERNS.md)

**Request Body**:
\`\`\`json
{
  "name": "string (required, 1-100 chars)",
  "exercises": "array (required, 1-50 items)"
}
\`\`\`

**Unique to this endpoint**:
- Validates exercise IDs exist
- Auto-calculates duration based on exercises
```

This saves ~200 tokens per endpoint by referencing patterns instead of repeating them.

## Notes

- All endpoints use consistent response formats
- All timestamps are ISO 8601 in UTC
- All IDs are UUID v4
- Cursor-based pagination for lists (request 1 extra to detect next page)

## Import Path Calculation for API Routes

**CRITICAL**: Always calculate import paths correctly to avoid "Module not found" errors.

### Rules for `frontend/routes/` files:

1. **Count directory depth** from `routes/` (excluding the filename)
2. **For `shared/` imports** (workspace root): use `(depth + 1)` parent directory references (`../`)
3. **For `frontend/lib/` imports**: use `(depth)` parent directory references (`../`)

### Path Calculation Examples:

```typescript
// File: frontend/routes/api/campaigns/[id]/members/leave.ts
// Path segments: api/campaigns/[id]/members/leave.ts
// Depth: 5 directories from routes/

// ✅ CORRECT - shared imports (depth + 1 = 6 levels up)
import { getKv } from "../../../../../../shared/lib/kv.ts";
import { CampaignService } from "../../../../../../shared/services/campaign.service.ts";

// ✅ CORRECT - frontend/lib imports (depth = 5 levels up)
import { requireUser } from "../../../../../lib/fresh-helpers.ts";
import { BadRequestError } from "../../../../../lib/errors.ts";

// ❌ WRONG - too many ../
import { getKv } from "../../../../../../../shared/lib/kv.ts"; // 7 levels = wrong!

// ❌ WRONG - too few ../
import { getKv } from "../../../../../shared/lib/kv.ts"; // 5 levels = wrong!
```

### Quick Reference Table:

| Route Depth | Example Path | shared/ imports | frontend/lib/ imports |
|-------------|--------------|-----------------|----------------------|
| 1 | `api/users.ts` | `../../shared/` | `../lib/` |
| 2 | `api/users/[id].ts` | `../../../shared/` | `../../lib/` |
| 3 | `api/users/[id]/posts.ts` | `../../../../shared/` | `../../../lib/` |
| 4 | `api/campaigns/[id]/members.ts` | `../../../../../shared/` | `../../../../lib/` |
| 5 | `api/campaigns/[id]/members/leave.ts` | `../../../../../../shared/` | `../../../../../lib/` |
| 6 | `api/campaigns/[id]/members/[userId]/ban.ts` | `../../../../../../../shared/` | `../../../../../../lib/` |

### Verification:

Always verify paths resolve correctly:
```bash
# From workspace root, check if path resolves
deno check frontend/routes/api/your-new-route.ts
```

### Common Mistakes to Avoid:

1. ❌ Counting the filename as a level
2. ❌ Using the same `../` count for both `shared/` and `lib/` imports
3. ❌ Not accounting for dynamic route segments like `[id]` as directory levels
4. ❌ Copy-pasting import paths from files at different depths

### Correct Module Names:

**ALWAYS use these exact module names** (checked by `validate-imports` script):

```typescript
// ✅ CORRECT - These files exist
import { requireUser, withErrorHandler, type AppState } from "../lib/fresh-helpers.ts";
import { getKv } from "../../shared/lib/kv.ts";

// ❌ WRONG - These files DO NOT exist
import { requireUser } from "../lib/auth.ts";           // Use fresh-helpers.ts
import { withErrorHandler } from "../lib/error-handler.ts"; // Use fresh-helpers.ts
import { type AppState } from "../lib/types.ts";        // Use fresh-helpers.ts
import { getKv } from "../../shared/lib/db.ts";         // Use kv.ts, not db.ts
```

**Why these mistakes happen:**
- AI may hallucinate common file names like `auth.ts`, `types.ts`, `db.ts`
- These seem logical but don't match the actual codebase structure
- This project consolidates helpers in `fresh-helpers.ts` for token efficiency

**Prevention:**
- Always reference this pattern guide before writing imports
- Run `deno task validate-imports` to catch errors before runtime
- Add to CI/CD: `deno task check` includes import validation
