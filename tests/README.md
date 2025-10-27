# Test Guide - Speed Optimizations

This guide helps you write tests **3-5x faster** using templates and helpers.

## Quick Start

### For Unit Tests

```bash
# Copy the template
cp tests/templates/unit.test.template.ts tests/unit/my-feature.test.ts

# Customize:
# 1. Replace [FeatureName] with your feature name
# 2. Import the function to test
# 3. Update test data
# Done!
```

### For API Integration Tests

```bash
# Copy the template
cp tests/templates/integration-api.test.template.ts tests/integration/api/my-endpoint.test.ts

# Customize:
# 1. Replace [ENDPOINT] with your endpoint name
# 2. Update test data
# Done!
```

## Available Helpers

### 1. Test Client (`helpers/test-client.ts`)

**Purpose:** HTTP client for API tests

**Usage:**
```typescript
import { createTestClient } from '../helpers/test-client.ts';

const client = createTestClient();

// Make requests (handles JSON, auth, errors automatically)
const response = await client.post('/api/users', userData);
const response = await client.get('/api/users/123');
const response = await client.put('/api/users/123', updates);
const response = await client.delete('/api/users/123');

// Skip authentication
const response = await client.post('/api/users', data, { skipAuth: true });
```

**Benefits:**
- ✅ Automatic JSON serialization/parsing
- ✅ Built-in authentication
- ✅ Consistent error handling
- ✅ Type-safe responses

### 2. Deno KV Helpers (`helpers/kv-test.ts`)

**Purpose:** Utilities for testing with Deno KV

**Usage:**
```typescript
import { setupTestKv, seedKv, countKvEntries } from '../helpers/kv-test.ts';

// Setup KV with automatic cleanup
const { kv, cleanup } = await setupTestKv();
try {
  // Your test code
} finally {
  await cleanup(); // Automatic cleanup
}

// Seed test data quickly
await seedKv(kv, [
  { key: ['users', 'user-1'], value: userData1 },
  { key: ['users', 'user-2'], value: userData2 },
]);

// Count entries
const userCount = await countKvEntries(kv, ['users']);

// List all entries
const users = await listKvEntries(kv, ['users']);

// Clear a prefix
await clearKvPrefix(kv, ['users']);
```

**Benefits:**
- ✅ Always uses `:memory:` (fast, isolated)
- ✅ Automatic cleanup (no resource leaks)
- ✅ Quick data seeding
- ✅ Utility functions for common operations

### 3. Data Builders (`helpers/builders.ts`)

**Purpose:** Create consistent test data

**Usage:**
```typescript
import { buildUser, buildUsers } from '../helpers/builders.ts';

// Single user with defaults
const user = buildUser();

// Override specific fields
const admin = buildUser({ role: 'admin', email: 'admin@example.com' });

// Multiple users
const users = buildUsers(5); // Creates 5 users
```

**Benefits:**
- ✅ Consistent test data
- ✅ Easy to customize
- ✅ DRY - no repeated test data
- ✅ Add more builders as needed

## Test Templates

### Unit Test Template

**Location:** `tests/templates/unit.test.template.ts`

**Best for:**
- Business logic functions
- Utility functions
- Service classes
- Pure logic testing

### Integration API Test Template

**Location:** `tests/templates/integration-api.test.template.ts`

**Best for:**
- REST API endpoints
- Full request/response testing
- Authentication testing
- Validation testing

## Writing Tests Fast - Workflow

### Step 1: Copy Template
```bash
cp tests/templates/[template-name].ts tests/[location]/[your-test].ts
```

### Step 2: Find and Replace
- `[FeatureName]` → Your feature name
- `[ENDPOINT]` → Your endpoint path
- `[functionName]` → Your function name

### Step 3: Update Test Data
- Replace placeholder data with your actual data models
- Add feature-specific test cases

### Step 4: Run Tests
```bash
deno test tests/[your-test].ts --allow-all
```

## Best Practices

### ✅ DO:
- **Use templates** - 3-5x faster than writing from scratch
- **Use test helpers** - Reduces boilerplate by 60%
- **Use data builders** - Consistent test data
- **Use `:memory:` for KV** - Fast, isolated tests
- **Clean up resources** - Close KV connections, servers
- **Test happy path first** - Then edge cases

### ❌ DON'T:
- Write tests from scratch (use templates!)
- Repeat boilerplate code (use helpers!)
- Share KV instances between tests
- Forget to close KV connections
- Test framework internals
- Over-test trivial code

## Examples

### Example 1: Unit Test (Fast Way)

```typescript
import { assertEquals } from 'jsr:@std/assert';
import { validateEmail } from '../../backend/lib/validation.ts';

Deno.test('validateEmail - accepts valid email', () => {
  assertEquals(validateEmail('test@example.com'), true);
});

Deno.test('validateEmail - rejects invalid email', () => {
  assertEquals(validateEmail('invalid'), false);
});
```

**Time:** ~30 seconds to write

### Example 2: API Integration Test (Fast Way)

```typescript
import { assertEquals } from 'jsr:@std/assert';
import { createTestClient } from '../helpers/test-client.ts';

const client = createTestClient();

Deno.test('POST /api/tasks - creates task', async () => {
  const response = await client.post('/api/tasks', {
    title: 'Test Task',
    status: 'pending',
  });

  assertEquals(response.status, 201);
  assertEquals(response.data?.title, 'Test Task');
});
```

**Time:** ~1 minute to write

### Example 3: Deno KV Service Test (Fast Way)

```typescript
import { assertEquals } from 'jsr:@std/assert';
import { setupTestKv, seedKv } from '../helpers/kv-test.ts';
import { TaskService } from '../../backend/services/tasks.ts';

Deno.test('TaskService - lists all tasks', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    await seedKv(kv, [
      { key: ['tasks', 'task-1'], value: { id: 'task-1', title: 'Task 1' } },
      { key: ['tasks', 'task-2'], value: { id: 'task-2', title: 'Task 2' } },
    ]);

    const service = new TaskService(kv);
    const tasks = await service.findAll();

    assertEquals(tasks.length, 2);
  } finally {
    await cleanup();
  }
});
```

**Time:** ~2 minutes to write

## Speed Comparison

| Approach | Time per Test | Code Volume | Maintenance |
|----------|---------------|-------------|-------------|
| **Without templates/helpers** | 5-10 min | 100% | High |
| **With templates/helpers** ⭐ | 1-2 min | 40% | Low |

**Result:** **3-5x faster test creation!**

## Adding New Helpers

When you notice repeated patterns, create a helper:

```typescript
// tests/helpers/my-helper.ts
export function myHelper() {
  // Reusable logic
}
```

Update this README with the new helper!

## Running Tests

```bash
# All tests
deno test --allow-all

# Specific test
deno test tests/unit/my-feature.test.ts --allow-all

# Watch mode
deno test --allow-all --watch

# Coverage
deno test --allow-all --coverage=coverage
deno coverage coverage --lcov --output=coverage.lcov
```

## Need Help?

- Check templates in `tests/templates/`
- Check helpers in `tests/helpers/`
- Read the test-writer-agent guide in `.claude/agents/test-writer-agent.md`
- Look at existing tests for examples

---

**Remember:** Use templates + helpers = 3-5x faster test creation! 🚀
