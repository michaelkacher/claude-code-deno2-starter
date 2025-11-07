# Repository Pattern: Recommendations for Claude Agents and Commands

## Overview

This document provides recommendations for updating Claude agents, workflows, and commands to effectively use the new repository pattern for Deno KV data access.

## Summary of Changes

### What Changed?

**Before:** Direct Deno KV access scattered throughout routes
```typescript
const kv = await getKv();
const userEntry = await kv.get(['users', userId]);
const user = userEntry.value;
```

**After:** Centralized repository pattern
```typescript
const userRepo = new UserRepository();
const user = await userRepo.findById(userId);
```

### Benefits

✅ **Type Safety** - Full TypeScript typing for all operations  
✅ **Testability** - Easy to mock for unit tests  
✅ **Consistency** - Standardized error handling and logging  
✅ **Maintainability** - Changes to data access logic in one location  
✅ **Developer Experience** - Clear API, better autocomplete

## Repositories Created

1. **BaseRepository** - Common CRUD operations (get, set, delete, list, count, exists)
2. **UserRepository** - User data access with 20+ specialized methods
3. **TokenRepository** - Token management (refresh, blacklist, password reset, email verification)
4. **NotificationRepository** - Notification CRUD and queries
5. **JobRepository** - Background job management

## Agents & Commands to Update

### 1. Backend Agent / Code Generation Agent

**Priority:** HIGH

**Current Behavior:** Generates routes with direct KV access like:
```typescript
const kv = await getKv();
const userEntry = await kv.get(['users', userId]);
```

**Recommended Changes:**

1. **Update Templates** - Change code generation templates to use repositories
2. **Import Statements** - Always import from `./repositories/index.ts`
3. **Method Selection** - Use specialized repository methods over generic operations

**Example Template:**
```typescript
// backend/routes/[entity].ts template
import { Hono } from 'hono';
import { [Entity]Repository } from '../repositories/index.ts';

const router = new Hono();

router.get('/:id', async (c) => {
  const repo = new [Entity]Repository();
  const id = c.req.param('id');
  
  const item = await repo.findById(id);
  if (!item) {
    return c.json({ error: 'Not found' }, 404);
  }
  
  return c.json({ data: item });
});

export default router;
```

**Training Prompts:**
- "Always use repository pattern for data access"
- "Import UserRepository for user operations"
- "Never use getKv() directly in routes"
- "Check repository methods before implementing custom logic"

---

### 2. Testing Agent

**Priority:** HIGH

**Current Behavior:** Creates tests with direct KV setup and teardown

**Recommended Changes:**

1. **Use RepositoryFactory** for dependency injection in tests
2. **Mock repositories** instead of mocking KV
3. **Test repository methods** independently

**Example Test Template:**
```typescript
import { assertEquals } from 'jsr:@std/assert';
import { UserRepository } from '../../../backend/repositories/index.ts';

Deno.test('[Entity] - [operation]', async () => {
  // Setup: Use in-memory KV for tests
  const kv = await Deno.openKv(':memory:');
  const repo = new UserRepository({ kv });
  
  // Test: Perform operation
  const result = await repo.create({
    // ... test data
  });
  
  // Assert: Verify result
  assertEquals(result.email, 'test@example.com');
  
  // Cleanup
  await kv.close();
});
```

**Integration Test Pattern:**
```typescript
Deno.test('Integration - User flow', async () => {
  const userRepo = new UserRepository();
  const tokenRepo = new TokenRepository();
  
  // Create user
  const user = await userRepo.create(userData);
  
  // Store token
  await tokenRepo.storeRefreshToken(user.id, tokenId, expiresAt);
  
  // Verify
  const isValid = await tokenRepo.verifyRefreshToken(user.id, tokenId);
  assertEquals(isValid, true);
  
  // Cleanup
  await userRepo.deleteUser(user.id);
});
```

---

### 3. Feature Development Workflow

**Priority:** HIGH

**Location:** `.github/copilot-workflows.md`

**Recommended Changes:**

1. **Update "Create New Feature" workflow** to mention repository pattern
2. **Add repository creation step** if new entity type is needed
3. **Include repository tests** in checklist

**Updated Workflow Steps:**

```markdown
### Step 2: Design Data Layer
- [ ] Determine if new entity type is needed
- [ ] If yes, create new repository extending BaseRepository
- [ ] Define entity type in `backend/types/`
- [ ] Implement specialized repository methods
- [ ] Add repository to exports in `backend/repositories/index.ts`

### Step 3: Implement Backend
- [ ] Create route handler in `backend/routes/`
- [ ] Import appropriate repositories (User, Token, Notification, Job)
- [ ] Use repository methods instead of direct KV access
- [ ] Add Zod validation schemas
- [ ] Implement error handling
```

**Example Feature Prompt:**
```
Create a "favorites" feature where users can favorite items.

Data Layer:
1. Create FavoriteRepository extending BaseRepository
2. Methods: addFavorite(userId, itemId), removeFavorite, listUserFavorites
3. KV key pattern: ['favorites', userId, itemId]

Backend Route:
1. POST /api/favorites - Add favorite (uses FavoriteRepository)
2. DELETE /api/favorites/:itemId - Remove favorite
3. GET /api/favorites - List user's favorites

Frontend Island:
1. FavoriteButton.tsx - Toggle favorite state
2. Use api.post('/favorites') from api-client.ts
```

---

### 4. Migration Agent / Refactoring Agent

**Priority:** MEDIUM

**Purpose:** Assist in migrating existing code from direct KV to repositories

**Recommended Approach:**

1. **Automated Detection** - Identify patterns like `await kv.get(['users',`
2. **Suggest Replacements** - Map KV operations to repository methods
3. **Batch Refactoring** - Process multiple files at once

**Migration Mapping:**

| Pattern | Repository Method |
|---------|------------------|
| `kv.get(['users', userId])` | `userRepo.findById(userId)` |
| `kv.get(['users_by_email', email])` + `kv.get(['users', userId])` | `userRepo.findByEmail(email)` |
| `kv.set(['users', userId], user)` | `userRepo.update(userId, updates)` |
| `kv.list({ prefix: ['users'] })` | `userRepo.listUsers()` |
| `kv.atomic().set(...).commit()` | `userRepo.create(...)` (handles atomic) |
| `kv.get(['refresh_tokens', userId, tokenId])` | `tokenRepo.getRefreshToken(userId, tokenId)` |
| `kv.set(['token_blacklist', tokenId], ...)` | `tokenRepo.blacklistToken(...)` |
| `kv.get(['notifications', userId, notifId])` | `notificationRepo.findById(userId, notifId)` |
| `kv.get(['jobs', jobId])` | `jobRepo.findById(jobId)` |

**Migration Script Template:**
```typescript
// scripts/migrate-to-repositories.ts

// Find all instances of direct KV access in routes
const routeFiles = [
  'backend/routes/auth.ts',
  'backend/routes/admin.ts',
  'backend/routes/two-factor.ts',
];

for (const file of routeFiles) {
  let content = await Deno.readTextFile(file);
  
  // Replace common patterns
  content = content.replace(
    /const kv = await getKv\(\);/g,
    'const userRepo = new UserRepository();'
  );
  
  content = content.replace(
    /await kv\.get\(\['users', (\w+)\]\)/g,
    'await userRepo.findById($1)'
  );
  
  // Write back
  await Deno.writeTextFile(file, content);
}
```

---

### 5. Documentation Generator Agent

**Priority:** LOW

**Recommended Changes:**

1. **Update API documentation generator** to mention repository usage
2. **Add repository method documentation** to generated docs
3. **Include data access examples** using repositories

**Example Generated Documentation:**

```markdown
## POST /api/auth/signup

### Implementation
Uses `UserRepository` for user creation and `TokenRepository` for email verification token.

### Data Access
- `userRepo.emailExists(email)` - Check if email is available
- `userRepo.create(userData)` - Create user with hashed password
- `tokenRepo.storeEmailVerificationToken(...)` - Store verification token

### Error Handling
- 409 Conflict - Email already exists (from repository)
- 500 Internal Server Error - Database operation failed
```

---

### 6. Code Review / Linting Agent

**Priority:** MEDIUM

**Recommended Rules:**

1. **Detect Direct KV Usage** - Flag `import { getKv }` in route files
2. **Suggest Repository Usage** - Recommend appropriate repository
3. **Check Error Handling** - Ensure null checks after repository calls

**Linting Rules:**

```typescript
// Rule: no-direct-kv-in-routes
// Severity: warning
// Message: "Use repository pattern instead of direct KV access"

// Bad
import { getKv } from '../lib/kv.ts';
const kv = await getKv();
const user = await kv.get(['users', userId]);

// Good
import { UserRepository } from '../repositories/index.ts';
const userRepo = new UserRepository();
const user = await userRepo.findById(userId);
```

**Review Checklist:**

- [ ] Routes import from `repositories/index.ts`
- [ ] No `getKv()` calls in route handlers
- [ ] Null checks after repository method calls
- [ ] Appropriate repository used (User, Token, Notification, Job)
- [ ] Error handling for repository operations

---

### 7. Starter Template Customization

**Priority:** MEDIUM

**Location:** `scripts/customize.ts`, `.github/copilot-workflows.md`

**Recommended Changes:**

1. **Update customization script** to explain repository pattern
2. **Provide examples** of creating new repositories
3. **Include repository in starter checklist**

**Customization Questions:**

```typescript
const questions = [
  {
    name: 'createNewEntity',
    message: 'Do you need to create a new entity type?',
    type: 'confirm',
  },
  {
    name: 'entityName',
    message: 'Entity name (e.g., Product, Order, Post):',
    when: (answers) => answers.createNewEntity,
  },
  {
    name: 'entityFields',
    message: 'Entity fields (comma-separated):',
    when: (answers) => answers.createNewEntity,
  },
];

// Generate repository template
if (answers.createNewEntity) {
  await generateRepository(answers.entityName, answers.entityFields);
  console.log(`✅ Created ${answers.entityName}Repository`);
  console.log(`   Location: backend/repositories/${answers.entityName.toLowerCase()}-repository.ts`);
}
```

---

### 8. Debugging / Troubleshooting Agent

**Priority:** LOW

**Recommended Knowledge:**

1. **Common Repository Errors** - How to debug null returns, TypeScript errors
2. **Performance Issues** - When to use pagination, batch operations
3. **Transaction Failures** - Atomic operation debugging

**Troubleshooting Guide:**

```markdown
## Common Issues

### "Cannot read property of null"
**Symptom:** Error when accessing repository result  
**Cause:** Repository returned null (entity not found)  
**Solution:** Add null check

```typescript
const user = await userRepo.findById(userId);
if (!user) {
  return c.json({ error: 'User not found' }, 404);
}
```

### "Email already exists" on create
**Symptom:** Error thrown by `userRepo.create()`  
**Cause:** Email already registered (atomic check failed)  
**Solution:** Check existence first or catch error

```typescript
const exists = await userRepo.emailExists(email);
if (exists) {
  return c.json({ error: 'Email taken' }, 409);
}
```

### Slow query performance
**Symptom:** Repository methods taking >1s  
**Cause:** Fetching too much data without pagination  
**Solution:** Use limit option

```typescript
// Bad - fetches all users
const all = await userRepo.listUsers();

// Good - paginated
const page = await userRepo.listUsers({ limit: 100 });
```
```

---

## Testing Strategy

### Unit Tests

Create comprehensive unit tests for all repositories:

```bash
tests/unit/repositories/
├── base-repository.test.ts
├── user-repository.test.ts
├── token-repository.test.ts
├── notification-repository.test.ts
└── job-repository.test.ts
```

**Test Coverage Goals:**
- ✅ All CRUD operations
- ✅ Edge cases (null returns, duplicates)
- ✅ Error handling
- ✅ Atomic operations
- ✅ Pagination

### Integration Tests

Test repository interactions in real scenarios:

```typescript
// tests/integration/repository-flows.test.ts
Deno.test('Complete user signup flow', async () => {
  const userRepo = new UserRepository();
  const tokenRepo = new TokenRepository();
  
  // 1. Create user
  const user = await userRepo.create({
    email: 'integration@test.com',
    password: 'password123',
    name: 'Integration Test',
    // ... other fields
  });
  
  // 2. Store email verification token
  const verificationToken = crypto.randomUUID();
  await tokenRepo.storeEmailVerificationToken(
    verificationToken,
    user.id,
    user.email,
    Math.floor(Date.now() / 1000) + 3600
  );
  
  // 3. Verify email
  const tokenData = await tokenRepo.getEmailVerificationToken(verificationToken);
  assertEquals(tokenData?.userId, user.id);
  
  await userRepo.verifyEmail(user.id);
  const updatedUser = await userRepo.findById(user.id);
  assertEquals(updatedUser?.emailVerified, true);
  
  // Cleanup
  await userRepo.deleteUser(user.id);
});
```

---

## Documentation Updates

### Files to Update

1. ✅ **docs/REPOSITORY_PATTERN.md** - Comprehensive guide (CREATED)
2. ✅ **.github/copilot-instructions.md** - Agent instructions (UPDATED)
3. **docs/QUICK_START_CUSTOMIZATION.md** - Add repository section
4. **docs/API_DOCUMENTATION.md** - Mention repository usage
5. **README.md** - Add link to repository pattern docs
6. **features/_templates/feature-template.md** - Include repository step

### Example Updates

**README.md:**
```markdown
## Architecture

- **Backend**: Hono framework with **repository pattern** for data access
- **Database**: Deno KV with centralized repositories
- **Auth**: JWT-based authentication
- **API**: RESTful with OpenAPI 3.1 documentation

### Data Access Layer

All database operations use the repository pattern for type safety and consistency:

```typescript
import { UserRepository, TokenRepository } from './backend/repositories/index.ts';

const userRepo = new UserRepository();
const user = await userRepo.findByEmail('user@example.com');
```

See [Repository Pattern Guide](docs/REPOSITORY_PATTERN.md) for details.
```

**docs/QUICK_START_CUSTOMIZATION.md:**
```markdown
### Adding New Entity Types

1. Create entity type in `backend/types/[entity].ts`
2. Create repository extending BaseRepository:
   ```typescript
   import { BaseRepository } from './base-repository.ts';
   
   export class MyEntityRepository extends BaseRepository<MyEntity> {
     constructor(options = {}) {
       super('MyEntity', options);
     }
     
     async findByField(value: string): Promise<MyEntity | null> {
       // Custom query logic
     }
   }
   ```
3. Export from `backend/repositories/index.ts`
4. Use in routes: `const repo = new MyEntityRepository();`
```

---

## Migration Priority

### Phase 1: High Priority (Week 1)
- [x] Create repository classes
- [x] Update Copilot instructions
- [x] Create documentation
- [ ] Migrate `backend/routes/auth.ts`
- [ ] Migrate `backend/routes/admin.ts`
- [ ] Update testing templates

### Phase 2: Medium Priority (Week 2)
- [ ] Migrate `backend/routes/two-factor.ts`
- [ ] Migrate `backend/routes/notifications.ts`
- [ ] Migrate `backend/routes/jobs.ts`
- [ ] Update all workflow documents
- [ ] Create migration script

### Phase 3: Low Priority (Week 3+)
- [ ] Migrate lib files using direct KV (if applicable)
- [ ] Add advanced repository features (caching, soft delete)
- [ ] Performance optimization
- [ ] Add monitoring/metrics

---

## Example Migration: auth.ts

### Before (Direct KV)

```typescript
auth.post('/login', async (c) => {
  const kv = await getKv();
  const { email, password } = c.get('validatedBody');
  
  // Get user by email
  const userKey = await kv.get(['users_by_email', email]);
  const userId = userKey.value as string;
  const userEntry = await kv.get(['users', userId]);
  const user = userEntry.value;
  
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
  
  // Verify password...
});
```

### After (Repository Pattern)

```typescript
auth.post('/login', async (c) => {
  const userRepo = new UserRepository();
  const tokenRepo = new TokenRepository();
  const { email, password } = c.get('validatedBody');
  
  // Get user by email
  const user = await userRepo.findByEmail(email);
  
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
  
  // Verify password...
});
```

**Benefits:**
- ✅ 3 lines → 1 line for user lookup
- ✅ Type-safe return value
- ✅ Built-in error handling and logging
- ✅ Easier to test (mock repository)

---

## Recommendations Summary

### For Backend Agent
✅ Use repositories in all generated routes  
✅ Import from `./repositories/index.ts`  
✅ Never use `getKv()` directly in routes  

### For Testing Agent
✅ Use `RepositoryFactory` for dependency injection  
✅ Test repository methods independently  
✅ Use in-memory KV for tests  

### For Feature Development
✅ Add "Create repository" step if new entity needed  
✅ Include repository in implementation checklist  
✅ Provide repository usage examples  

### For Migration
✅ Create mapping from KV operations to repository methods  
✅ Prioritize auth and admin routes first  
✅ Batch refactor similar patterns  

### For Documentation
✅ Update all docs to mention repository pattern  
✅ Add repository usage examples  
✅ Link to REPOSITORY_PATTERN.md  

---

## Questions & Support

For questions about implementing the repository pattern:

1. **Documentation**: See `docs/REPOSITORY_PATTERN.md`
2. **Examples**: Check `backend/repositories/user-repository.ts`
3. **Testing**: See `tests/unit/repositories/` (when created)
4. **Migration Help**: Use patterns in this document

**Key Principle**: Always use repositories for entity data access. Only use direct KV for non-entity operations (cache, temporary data, etc.)
