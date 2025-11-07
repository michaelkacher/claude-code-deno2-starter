# Folder Rename Complete: backend → shared

**Date**: 2025-11-07  
**Status**: ✅ Complete  
**Migration Type**: Folder structure reorganization (no functional changes)

## Summary

Successfully renamed the `backend/` folder to `shared/` to better reflect the Pure Fresh architecture where there is no separate backend server. The code in this folder is shared between Fresh API routes (server-side) and background workers.

## Why the Rename?

### Problem
- The name `backend/` implied a separate backend server running on port 8000
- This was confusing in Pure Fresh architecture where there's only one server (port 3000)
- Fresh serves both pages AND API endpoints from the same server process

### Solution
- Renamed to `shared/` to clarify its purpose
- This folder contains code shared between:
  - Fresh API routes (`frontend/routes/api/**/*.ts`)
  - Background workers (queue, scheduler, cleanup)
  - Startup initialization code

## Architecture

### Pure Fresh (Current)
```
┌─────────────────────────────────────────┐
│   Fresh Server (localhost:3000)         │
├─────────────────────────────────────────┤
│  • Pages (routes/*.tsx)                 │
│  • API Endpoints (routes/api/**/*.ts)   │
│  • Islands (client-side interactivity)  │
│  • Background Services (queue/scheduler)│
└─────────────────────────────────────────┘
              ↓ uses
    ┌────────────────────┐
    │   /shared folder   │
    │  • Repositories    │
    │  • Workers         │
    │  • Lib utilities   │
    │  • Config          │
    │  • Types           │
    └────────────────────┘
```

### Old Hono Architecture (Removed)
```
Backend (localhost:8000)     Frontend (localhost:3000)
    Hono API                      Fresh SSR
       ↓                              ↓
    /backend folder          API calls via fetch
```

## Changes Made

### 1. Folder Rename
```bash
mv backend shared
```

### 2. Import Path Updates (100+ files)

**Before:**
```typescript
import { UserRepository } from "../../../../backend/repositories/index.ts";
import { createAccessToken } from "../../../../backend/lib/jwt.ts";
import { getKv } from "../../../backend/lib/kv.ts";
```

**After:**
```typescript
import { UserRepository } from "../../../../shared/repositories/index.ts";
import { createAccessToken } from "../../../../shared/lib/jwt.ts";
import { getKv } from "../../../shared/lib/kv.ts";
```

### 3. Files Updated

#### Frontend API Routes (45 files)
- `frontend/routes/api/auth/*.ts`
- `frontend/routes/api/admin/**/*.ts`
- `frontend/routes/api/jobs/**/*.ts`
- `frontend/routes/api/notifications/**/*.ts`
- `frontend/routes/api/two-factor/*.ts`

**Special handling for dynamic routes:**
- `[id].ts` - User ID parameter
- `[name].ts` - Schedule name parameter
- `[model].ts` - KV model parameter

#### Scripts (15+ files)
- `scripts/list-users.ts`
- `scripts/make-admin.ts`
- `scripts/seed-test-notifications.ts`
- All other utility scripts

#### Tests (10+ files)
- `tests/unit/*.test.ts`
- `tests/templates/*.ts`

#### Configuration
- `deno.json` - Import map: `"@/": "./shared/"`
- `.github/copilot-instructions.md` - Updated all references

### 4. Documentation Updates
- Updated Copilot instructions to reflect Pure Fresh architecture
- Added CHANGELOG entry documenting the rename
- Created this migration document

## Verification

### Server Startup
```bash
deno task dev
```

**Expected Output:**
```
🚀 [Startup] initializeBackgroundServices() CALLED
✉️  Email worker registered
📊 Report worker registered
🪝 Webhook worker registered
🧹 Cleanup worker registered
✅ All workers registered
🍋 Fresh ready
    Local: http://localhost:3000/
```

### Import Path Check
```bash
# Should return no results (all backend/ references gone)
grep -r "backend/" --include="*.ts" --include="*.tsx"
```

### Folder Structure
```
/shared/
├── config/        # Environment configuration
├── lib/           # Shared utilities (JWT, KV, queue, scheduler, etc.)
├── middleware/    # Request validation
├── repositories/  # Data access layer
├── services/      # Business logic (optional)
├── templates/     # Service templates
├── types/         # TypeScript definitions
└── workers/       # Background job workers
```

## Impact Assessment

### ✅ No Breaking Changes
- All functionality remains the same
- Only import paths changed
- Server still runs on port 3000
- Background services still initialize properly

### ✅ No Runtime Changes
- Repository pattern unchanged
- API response structures unchanged
- Fresh routes unchanged
- Authentication flow unchanged

### ✅ Improved Clarity
- Folder name matches architecture (Pure Fresh)
- No confusion about "backend server"
- Clear separation: `/shared` (server-side code) vs `/frontend` (Fresh routes/islands)

## Migration Notes for Team

### If You Have Open PRs
1. Pull latest changes from main
2. Run this command to update your imports:
   ```bash
   # PowerShell
   Get-ChildItem -Path . -Include *.ts,*.tsx -Recurse | ForEach-Object {
     (Get-Content $_.FullName) -replace '/backend/', '/shared/' | Set-Content $_.FullName
   }
   
   # Or manually find/replace in VS Code:
   # Find: /backend/
   # Replace: /shared/
   ```

### When Writing New Code
- Import from `shared/repositories/index.ts` (NOT `backend/`)
- Use relative paths like `../../../../shared/lib/kv.ts`
- Or use import alias: `@/lib/kv.ts` (defined in deno.json)

### Common Import Patterns
```typescript
// Repositories
import { UserRepository, JobRepository } from "../../../../shared/repositories/index.ts";

// Libraries
import { createAccessToken } from "../../../../shared/lib/jwt.ts";
import { getKv } from "../../../../shared/lib/kv.ts";
import { createLogger } from "../../../../shared/lib/logger.ts";

// Workers
import { queue } from "../../../../shared/lib/queue.ts";
import { scheduler } from "../../../../shared/lib/scheduler.ts";
```

## Troubleshooting

### Import Errors After Pull
**Symptom:** `Module not found: backend/...`  
**Fix:** Run the find/replace command above

### TypeScript Errors
**Symptom:** Cannot find module '@/...'  
**Fix:** Check `deno.json` has `"@/": "./shared/"`

### Server Won't Start
**Symptom:** Background services not initializing  
**Fix:** Check `frontend/dev.ts` imports from `../shared/startup.ts`

## Related Documentation

- [FRESH_MIGRATION_COMPLETE.md](./FRESH_MIGRATION_COMPLETE.md) - Pure Fresh migration details
- [ARCHITECTURE.md](./architecture.md) - Overall architecture overview
- [REPOSITORY_PATTERN.md](./REPOSITORY_PATTERN.md) - Data access layer patterns

## Timeline

1. **2025-11-05**: Completed Pure Fresh migration (45/45 endpoints)
2. **2025-11-05**: Fixed all runtime issues (jobs, schedules, notifications, users, profile)
3. **2025-11-06**: Cleaned up all Hono references, deleted obsolete files
4. **2025-11-07**: ✅ Renamed `backend/` → `shared/` (this document)

## Success Criteria

- [x] Folder renamed from `backend/` to `shared/`
- [x] All TypeScript imports updated
- [x] Server starts without errors
- [x] Background services initialize
- [x] All admin pages work correctly
- [x] No `backend/` references in code files
- [x] Documentation updated
- [x] CHANGELOG entry added
- [x] Copilot instructions updated

## Next Steps

1. ✅ Folder rename complete
2. 🔄 Update README.md with architecture section
3. 🔄 Test background job system
4. 🔄 Remove old Hono documentation references
5. 🔄 Consider creating architecture diagram

---

**Questions?** See `.github/copilot-instructions.md` or ask the team.
