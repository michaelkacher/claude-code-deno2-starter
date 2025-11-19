# Project Constants & Tech Stack

This file contains the canonical definitions for the project's tech stack, architecture patterns, and common guidelines. Reference this file instead of duplicating content.

---

## � BEFORE YOU CREATE FILES

**⚠️ IMPORT PATHS: Read `.claude/IMPORT_PATHS.md` FIRST!**

Common mistakes cost 10+ minutes of debugging. The import path guide has:
- Copy-paste ready patterns for every file type
- Calculator script: `deno run -A scripts/calculate-import-path.ts <from> <to>`
- Visual examples of correct vs incorrect paths

**When creating ANY new file that imports local modules, check IMPORT_PATHS.md first!**

---

## �📋 Table of Contents

**Quick Reference:**
- [Tech Stack](#tech-stack) - Framework, runtime, database, styling
- [Architecture](#architecture) - Three-tier pattern, layer responsibilities
- [Standard Patterns](#standard-patterns) - Security, auth, testing, errors
- [File Locations](#file-locations) - Where to create files
- [Import Path Rules](#import-path-rules) - See IMPORT_PATHS.md for details
- [Common Guidelines](#common-guidelines) - API client, storage, validation
- [Detailed Patterns](#detailed-architecture-patterns) - Service, repository, route, island examples
- [Anti-Patterns](#common-anti-patterns-to-avoid) - What NOT to do

**Most Critical Sections:**
- **[IMPORT_PATHS.md](.claude/IMPORT_PATHS.md)** - ALWAYS check before writing imports!
- [Security Pattern](#security-pattern) - Authentication and user ID handling
- [Deno KV Keys](#deno-kv-key-structure) - Key naming conventions
- [Testing Pattern](#testing-pattern) - In-memory KV setup

---

## Tech Stack

**Framework**: Fresh 1.7.3 (Deno's full-stack framework)
- File-based routing
- Server-side rendering (SSR)
- Interactive islands (Preact)
- API routes in `frontend/routes/api/`

**Runtime**: Deno 2
- Native TypeScript support
- Secure by default
- Built-in tooling (test, lint, fmt)

**Database**: Deno KV
- Key-value store
- Built-in, zero-config
- Edge-ready
- ACID transactions

**Frontend**: Preact
- Lightweight React alternative (3KB)
- Same API as React
- Signals for state management
- JSX support

**Styling**: Tailwind CSS
- Utility-first CSS
- JIT compilation
- Design system in `frontend/components/design-system/`

**Deployment**: Deno Deploy
- Edge hosting
- Zero-config
- Git integration

---

## Architecture

### Three-Tier Architecture

```
Routes (HTTP) → Services (Business Logic) → Repositories (Data Access) → Deno KV
```

**Routes** (`frontend/routes/api/`):
- Handle HTTP requests/responses
- Validate input (Zod schemas)
- Call service layer
- Never contain business logic

**Services** (`shared/services/`):
- Business logic and orchestration
- Feature-specific operations
- Call repositories for data
- Framework-agnostic

**Repositories** (`shared/repositories/`):
- Data access layer
- CRUD operations on Deno KV
- Abstract storage implementation
- Reusable across features

---

## Standard Patterns

### Deno KV Key Structure
```typescript
["resource", resourceId]                    // Single resource
["resource_by_user", userId, resourceId]   // User-scoped index
["resource_by_field", fieldValue, resourceId] // Secondary index
```

### Security Pattern
```typescript
// ✅ ALWAYS: Get user from JWT token
const user = await requireUser(ctx);
const userId = user.sub;

// ❌ NEVER: Accept userId from request
const { userId } = await req.json();
```

### Authentication Helpers
- `requireUser(ctx)` - Returns authenticated user or throws 401
- `requireAdmin(ctx)` - Returns admin user or throws 403
- User ID field: `user.sub` (NOT `user.id`)

### Testing Pattern
```typescript
// Always use :memory: for isolated tests
const kv = await Deno.openKv(":memory:");
```

### Error Handling
```typescript
// Standard error response
return new Response(
  JSON.stringify({ error: "Message" }),
  { status: 400, headers: { "Content-Type": "application/json" } }
);
```

### API Route Naming Convention

**Pattern**: Use plural resource names for RESTful APIs

```typescript
// ✅ CORRECT - Plural resource names
frontend/routes/api/campaigns/index.ts     → POST /api/campaigns, GET /api/campaigns
frontend/routes/api/campaigns/[id].ts      → GET/PUT/DELETE /api/campaigns/:id
frontend/routes/api/users/index.ts         → POST /api/users, GET /api/users

// ❌ WRONG - Singular resource names
frontend/routes/api/campaign/index.ts      → POST /api/campaign

// Special cases (use singular):
// - Authentication: /api/auth/login, /api/auth/register
// - User's own data: /api/profile (not /api/profiles)
// - Singleton resources: /api/settings

// Action endpoints (use verb):
// - /api/campaigns/:id/invite
// - /api/campaigns/:id/publish
```

**Scaffold Script Default**: Adds 's' to feature name (override if needed)


---

## File Locations

**Backend**:
- Services: `shared/services/{feature-name}.service.ts`
- Repositories: `shared/repositories/{resource}.repository.ts`
- Types: `shared/types/{feature-name}.types.ts`
- Workers: `shared/workers/{name}.worker.ts`

**Frontend**:
- Routes (pages): `frontend/routes/{path}.tsx`
- API Routes: `frontend/routes/api/{resource}/[id].ts`
- Islands: `frontend/islands/{ComponentName}.tsx`
- Components: `frontend/components/{category}/{ComponentName}.tsx`
- Lib: `frontend/lib/{utility}.ts`

**Tests**:
- Unit: `tests/unit/{layer}/{file}.test.ts`
- Integration: `tests/workflows/{feature}.test.ts`
- Helpers: `tests/helpers/{name}.ts`

**Features**:
- Proposed: `features/proposed/{feature-name}/requirements.md`
- Implemented: `features/implemented/{feature-name}/requirements.md`

---

## Import Path Rules

**🚨 STOP! Read [IMPORT_PATHS.md](.claude/IMPORT_PATHS.md) before writing ANY imports!**

### Why This Matters

Import path mistakes cause immediate runtime errors that waste 10+ minutes debugging. The dedicated guide has:

1. **Calculator Script** - Get exact paths automatically
   ```bash
   deno run -A scripts/calculate-import-path.ts <from-file> <to-file>
   ```

2. **Copy-Paste Tables** - Common patterns for every file type
3. **Visual Examples** - How to count directory levels
4. **Troubleshooting** - Fix "Module not found" errors

### Rule: Always Use Relative Imports

```typescript
// ✅ CORRECT - Relative paths
import { Service } from "@/services/feature.service.ts";
import { Button } from "@/components/design-system/Button.tsx";

// ❌ WRONG - Absolute paths don't work in Deno
import { Service } from "/shared/services/feature.service.ts";
```

### Before Creating Any New File:

1. ✅ Check [IMPORT_PATHS.md](.claude/IMPORT_PATHS.md) for the correct pattern
2. ✅ OR run `calculate-import-path.ts` script
3. ✅ OR copy from an existing file at the same directory level
4. ❌ DON'T guess the number of `../` levels

**See [IMPORT_PATHS.md](.claude/IMPORT_PATHS.md) for complete reference with examples**

---

## Shared Validation Constants

**⚠️ CRITICAL: Use shared validation constants - NEVER hardcode limits**

Location: `shared/constants/validation.ts`

### Validation Limits

Organized by resource type to prevent duplication between backend (Zod) and frontend (client validation):

```typescript
import { VALIDATION_LIMITS as V } from "../../shared/constants/validation.ts";

// Backend - Zod schema (frontend/routes/api/campaigns/index.ts)
const createCampaignSchema = z.object({
  name: z.string().min(V.CAMPAIGN.NAME_MIN).max(V.CAMPAIGN.NAME_MAX),
  description: z.string().max(V.CAMPAIGN.DESCRIPTION_MAX),
});

// Frontend - Island validation (frontend/islands/CampaignCreator.tsx)
if (name.length > V.CAMPAIGN.NAME_MAX) {
  errors.value.name = M.MAX_LENGTH("Name", V.CAMPAIGN.NAME_MAX);
}
```

### Available Resources

```typescript
VALIDATION_LIMITS = {
  CAMPAIGN: {
    NAME_MIN: 1,
    NAME_MAX: 100,
    DESCRIPTION_MAX: 1000,
    SETTING_MAX: 200,
    BACKGROUND_MAX: 5000,
  },
  USER: {
    EMAIL_MAX: 255,
    PASSWORD_MIN: 8,
    PASSWORD_MAX: 128,
    USERNAME_MIN: 3,
    USERNAME_MAX: 50,
  },
  // Add new resources as needed
}
```

### Validation Messages

Consistent error messages across frontend and backend:

```typescript
import { VALIDATION_MESSAGES as M } from "../../shared/constants/validation.ts";

// Generate consistent messages
M.REQUIRED("Email")                    // "Email is required"
M.MAX_LENGTH("Name", 100)             // "Name must be 100 characters or less"
M.MIN_LENGTH("Password", 8)           // "Password must be at least 8 characters"
M.INVALID_EMAIL                        // "Invalid email address"
M.ALREADY_EXISTS("Email")             // "Email already exists"
```

### Helper Functions

```typescript
import { validateLength, validateEmail } from "../../shared/constants/validation.ts";

// Validate length with built-in error messages
const result = validateLength(name, V.CAMPAIGN.NAME_MIN, V.CAMPAIGN.NAME_MAX);
if (!result.valid) {
  errors.value.name = result.error;
}

// Validate email format
const emailResult = validateEmail(email);
if (!emailResult.valid) {
  errors.value.email = emailResult.error;
}
```

**Benefits**: Single source of truth, DRY principle, easier to update limits globally

---

````

---

## Common Guidelines

### API Client (Frontend)
```typescript
// ✅ Use centralized client
import { apiClient } from "../lib/api-client.ts";

// ❌ Never use fetch directly
const res = await fetch("/api/resource"); // DON'T DO THIS
```

### Storage (Frontend)
```typescript
// ✅ Use abstraction
import { TokenStorage } from "../lib/storage.ts";

// ❌ Never use localStorage directly
localStorage.setItem("token", token); // DON'T DO THIS
```

### Validation
```typescript
// ✅ Use utilities
import { validateEmail } from "../lib/validation.ts";

// ❌ Never duplicate validation logic
```

### Form Handling
- Never use `useState` for form data
- Use controlled inputs with Signals
- Validate on submit
- Show loading states

### List Rendering
```typescript
// ✅ Always use unique keys
{items.map(item => <div key={item.id}>...</div>)}

// ❌ Never use index as key
{items.map((item, i) => <div key={i}>...</div>)} // BAD
```

---

## Testing Strategy

### Test Layers (All Required)

**1. Unit Tests** (`tests/unit/`)
- Test business logic in isolation
- Use `:memory:` KV for repository/service tests
- Mock external dependencies

**2. Integration Tests** (`tests/integration/api/`)
- Test API routes end-to-end
- Validate request/response contracts
- Test authentication and authorization
- Verify Zod schema validation

**3. Manual Testing** (Before feature completion)
- Use checklist from `.claude/patterns/manual-testing-template.md`
- Copy template to feature directory: `features/proposed/{feature}/testing-checklist.md`
- Complete all sections before marking feature as done
- Test in browser/UI
- Verify accessibility (keyboard nav, screen reader)
- Mobile responsive testing (375px, 768px, 1920px)
- Cross-browser testing (Chrome, Firefox, Safari, Edge)

### API Route Testing Pattern

```typescript
// tests/integration/api/feature.api.test.ts
import { assertEquals } from "@std/assert";
import { STATUS_CODE } from "$fresh/server.ts";

const API_BASE = "http://localhost:3000/api/feature";

Deno.test("POST /api/feature - creates resource", async () => {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TEST_TOKEN}`,
    },
    body: JSON.stringify({ name: "Test" }),
  });

  assertEquals(response.status, STATUS_CODE.Created);
  const data = await response.json();
  assertExists(data.id);
});

Deno.test("POST /api/feature - validates input", async () => {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TEST_TOKEN}`,
    },
    body: JSON.stringify({}), // Invalid
  });

  assertEquals(response.status, STATUS_CODE.BadRequest);
});

Deno.test("POST /api/feature - requires auth", async () => {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // No Authorization header
    body: JSON.stringify({ name: "Test" }),
  });

  assertEquals(response.status, STATUS_CODE.Unauthorized);
});
```

**Note**: API tests require running server or mock auth tokens.

## Test Flags

**CRITICAL**: Always add `--unstable-kv` flag when tests use Deno KV

**Unit tests** (services/repositories using KV):
```bash
deno test --no-check tests/unit/services/feature.service.test.ts -A --unstable-kv
```

**All tests**:
```bash
deno test -A --unstable-kv
```

**Integration/API tests**:
```bash
deno test --no-check tests/integration/api/feature.api.test.ts -A --unstable-kv
```

**Why**: `Deno.openKv()` requires `--unstable-kv` flag or tests will fail with "Deno.openKv is not a function"

---

## Reference Usage

When creating documentation or agent instructions, reference this file:

```markdown
See `.claude/constants.md` for:
- Tech stack details
- Architecture patterns
- Standard file locations
- Common guidelines
```

This reduces duplication and ensures consistency across all documentation.

---

## Detailed Architecture Patterns

### Service Layer Pattern

**Location**: `shared/services/`

**Purpose**: Business logic and orchestration

**Pattern**:
```typescript
export class FeatureService {
  private repository: FeatureRepository;

  constructor(kv: Deno.Kv) {
    this.repository = new FeatureRepository(kv);
  }

  async create(data: CreateData, userId: string): Promise<Feature> {
    // 1. Validate business rules
    // 2. Create entity with generated ID
    // 3. Call repository
    // 4. Return result
  }

  async getById(id: string, userId: string): Promise<Feature | null> {
    // 1. Call repository
    // 2. Apply business logic filters
    // 3. Return result
  }
}
```

### Repository Pattern

**Location**: `shared/repositories/`

**Purpose**: Data access layer (Deno KV operations)

**Pattern**:
```typescript
export class FeatureRepository {
  constructor(private kv: Deno.Kv) {}

  async create(feature: Feature, userId: string): Promise<void> {
    const batch = this.kv.atomic()
      .set(["feature", feature.id], feature)
      .set(["feature_by_user", userId, feature.id], feature);
    await batch.commit();
  }

  async getById(id: string, userId: string): Promise<Feature | null> {
    const result = await this.kv.get<Feature>(["feature_by_user", userId, id]);
    return result.value;
  }
}
```

### Fresh API Route Pattern

**Location**: `frontend/routes/api/`

**Purpose**: HTTP request/response handling

**Pattern**:
```typescript
import { FreshContext } from "$fresh/server.ts";
import { z } from "zod";
import { FeatureService } from "/shared/services/feature.service.ts";
import { requireUser } from "/shared/lib/auth.ts";
import { getKv } from "/shared/lib/kv.ts";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  // Never accept userId from request body!
});

export async function POST(req: Request, ctx: FreshContext) {
  try {
    const user = await requireUser(ctx);  // From JWT
    const userId = user.sub;              // NOT user.id
    
    const body = await req.json();
    const data = createSchema.parse(body);
    
    const kv = await getKv();
    const service = new FeatureService(kv);
    const result = await service.create(data, userId);
    
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle errors
  }
}
```

### Frontend Island Pattern

**Location**: `frontend/islands/`

**Purpose**: Interactive client-side components

**Pattern**:
```typescript
import { useSignal } from "@preact/signals";
import { apiClient } from "../lib/api-client.ts";

export default function FeatureIsland() {
  const data = useSignal<Feature[]>([]);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  
  const fetchData = async () => {
    try {
      const result = await apiClient.get<Feature[]>("/api/features");
      data.value = result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed";
    } finally {
      loading.value = false;
    }
  };
  
  // Use useEffect or call in event handler
  
  return <div>...</div>;
}
```

---

## Common Anti-Patterns to Avoid

### Security Anti-Patterns ❌

```typescript
// ❌ NEVER: Accept userId from request body
const { userId } = await req.json();

// ❌ NEVER: Use user.id (doesn't exist in JWT)
const userId = user.id;

// ❌ NEVER: Skip authentication
export async function POST(req: Request) {
  // Missing: const user = await requireUser(ctx);
}

// ✅ CORRECT: Get userId from JWT
const user = await requireUser(ctx);
const userId = user.sub;
```

### Frontend Anti-Patterns ❌

```typescript
// ❌ NEVER: Direct fetch calls
const res = await fetch("/api/resource");

// ❌ NEVER: Direct localStorage
localStorage.setItem("token", token);

// ❌ NEVER: Index as key
items.map((item, i) => <div key={i}>...</div>)

// ❌ NEVER: Duplicate validation
if (!email.includes("@")) { ... }

// ✅ CORRECT: Use utilities
import { apiClient } from "../lib/api-client.ts";
import { TokenStorage } from "../lib/storage.ts";
import { validateEmail } from "../lib/validation.ts";

const res = await apiClient.get("/api/resource");
TokenStorage.set("token", token);
items.map(item => <div key={item.id}>...</div>)
if (!validateEmail(email)) { ... }
```

### Testing Anti-Patterns ❌

```typescript
// ❌ NEVER: Persistent KV in tests
const kv = await Deno.openKv();

// ❌ NEVER: Skip cleanup
Deno.test("test", async () => {
  const kv = await Deno.openKv(":memory:");
  // Missing: await kv.close();
});

// ✅ CORRECT: Memory KV with cleanup
Deno.test("test", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    // Test code
  } finally {
    await kv.close();
  }
});
```

## Reference Usage

