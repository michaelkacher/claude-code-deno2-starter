# Import Checklist - MUST READ BEFORE CODING

## ⚠️ Common Import Mistakes That Break the Server

**These files DO NOT exist - do not import them:**
- ❌ `lib/auth.ts`
- ❌ `lib/types.ts`
- ❌ `lib/error-handler.ts`
- ❌ `shared/lib/db.ts`

## ✅ Correct Imports

### For API Routes (`frontend/routes/api/**/*.ts`)

```typescript
// Authentication, error handling, types
import {
  requireUser,
  withErrorHandler,
  successResponse,
  type AppState,
} from "../../../lib/fresh-helpers.ts";  // Adjust ../ based on depth

// Database
import { getKv } from "../../../../shared/lib/kv.ts";  // Adjust ../ based on depth

// Services
import { YourService } from "../../../../shared/services/your.service.ts";

// Repositories
import { YourRepository } from "../../../../shared/repositories/your.repository.ts";
```

### For SSR Pages (`frontend/routes/**/*.tsx`)

```typescript
// Authentication, types
import {
  requireUser,
  type AppState,
} from "../../lib/fresh-helpers.ts";  // Adjust ../ based on depth

// API client
import { apiClient } from "../../lib/api-client.ts";  // Adjust ../ based on depth
```

## 📏 Import Path Depth Rules

**Count the directory levels** from `frontend/routes/` to your file (excluding filename):

```
frontend/routes/api/dashboard/index.ts
                ─┬─ ────┬────
                 1      2         = Depth 2

frontend/routes/campaigns/[id].tsx
                ────┬──── ──┬──
                    1       2      = Depth 2

frontend/routes/api/campaigns/[id]/members/leave.ts
                ─┬─ ────┬──── ──┬── ───┬──
                 1      2       3      4      = Depth 4
```

**Then apply:**
- **shared/ imports**: Use `(depth + 1)` levels of `../`
- **lib/ imports**: Use `(depth)` levels of `../`

### Examples by Depth

```typescript
// Depth 1: api/dashboard.ts
import { getKv } from "../../../shared/lib/kv.ts";      // depth+1 = 2
import { requireUser } from "../../lib/fresh-helpers.ts"; // depth = 1

// Depth 2: api/dashboard/index.ts
import { getKv } from "../../../../shared/lib/kv.ts";      // depth+1 = 3
import { requireUser } from "../../../lib/fresh-helpers.ts"; // depth = 2

// Depth 3: api/users/[id]/posts.ts
import { getKv } from "../../../../../shared/lib/kv.ts";      // depth+1 = 4
import { requireUser } from "../../../../lib/fresh-helpers.ts"; // depth = 3
```

## 🔍 Validation Steps

**Before running the server:**

```bash
# 1. Validate all imports
deno task validate-imports

# 2. Type check (will fail if imports are wrong)
deno task type-check

# 3. Or run both with check task
deno task check
```

## 🚨 If You See "Module not found"

1. Check the module name:
   - Is it `fresh-helpers.ts` (not `auth.ts`, `types.ts`)?
   - Is it `kv.ts` (not `db.ts`)?

2. Check the path depth:
   - Count directories from `routes/`
   - Use depth+1 for `shared/`
   - Use depth for `lib/`

3. Run validation:
   ```bash
   deno task validate-imports
   ```

## 📚 More Details

See `features/_templates/API_PATTERNS.md` → "Import Path Calculation" section for:
- Full import path calculation rules
- Quick reference table by depth
- Common mistakes to avoid
- Verification commands
