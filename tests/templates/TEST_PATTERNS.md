# Test Patterns Reference

This file contains standard test patterns to reference when writing tests. **Use these patterns to save tokens and ensure consistency.**

## Pattern Selection Guide

| Pattern | Use When | Token Savings | Template File |
|---------|----------|---------------|---------------|
| `CRUD_SERVICE_TESTS` | Simple CRUD operations | ~400-600 | `service-crud.test.template.ts` |
| `BUSINESS_LOGIC_TESTS` | Complex business rules | ~200-300 | `service.test.template.ts` |
| `UNIT_TESTS` | Pure functions | ~100-200 | `unit.test.template.ts` |
| `INTEGRATION_TESTS` | API endpoints (minimal) | N/A | `integration-api.test.template.ts` |

## Test Structure

All tests use **BDD-style patterns** with `describe()` and `it()` from `jsr:@std/testing/bdd`:

```typescript
import { assertEquals } from 'jsr:@std/assert';
import { afterEach, beforeEach, describe, it } from 'jsr:@std/testing/bdd';

describe('ServiceName', () => {
  let kv: Deno.Kv;
  let cleanup: () => Promise<void>;
  let service: ServiceName;

  beforeEach(async () => {
    const setup = await setupTestKv();
    kv = setup.kv;
    cleanup = setup.cleanup;
    service = new ServiceName(kv);
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('featureName', () => {
    it('should handle happy path', async () => {
      // Test implementation
    });
  });
});
```

## Standard Test Patterns

### Pattern: `CRUD_SERVICE_TESTS`

For services with standard CRUD operations (Create, Read, Update, Delete, List).

**Test Coverage**:
- ✅ Create with valid data
- ✅ Create rejects invalid data
- ✅ Create prevents duplicates (if applicable)
- ✅ List returns all items
- ✅ List pagination works
- ✅ Get by ID succeeds
- ✅ Get by ID returns null for non-existent
- ✅ Update modifies existing
- ✅ Update rejects invalid data
- ✅ Delete removes item
- ✅ Delete is idempotent

**Usage**:
```typescript
// Copy service-crud.test.template.ts and fill in:
// - Service name
// - Valid data example
// - Invalid data example
// - Unique field (if any)
```

**Token savings**: ~400-600 tokens vs writing 11 tests from scratch

---

### Pattern: `VALIDATION_TESTS`

For testing input validation rules.

**Standard validations to test**:
- Required fields
- String length limits (min/max)
- Numeric ranges (min/max)
- Email format
- Enum values
- Date formats
- UUID format

**Template**:
```typescript
describe('validation', () => {
  it('should require field [fieldName]', async () => {
    await assertRejects(
      () => service.create({ /* missing required field */ }),
      Error,
      'required',
    );
  });

  it('should enforce [field] length limit', async () => {
    await assertRejects(
      () => service.create({ field: 'x'.repeat(101) }), // exceeds 100 char limit
      Error,
      'too long',
    );
  });
});
```

---

### Pattern: `BUSINESS_RULE_TESTS`

For testing domain-specific business logic.

**Common business rules**:
- Duplicate prevention
- Status transitions
- Permission checks
- Calculations
- Data transformations
- Aggregations
- Side effects

**Template**:
```typescript
describe('business rule: [description]', () => {
  it('should apply rule correctly', async () => {
    // Arrange: Setup that triggers the rule
    // Act: Execute business operation
    // Assert: Verify rule was applied
  });
});
```

---

### Pattern: `EDGE_CASE_TESTS`

For testing boundary conditions.

**Common edge cases**:
- Empty collections
- Null/undefined values
- Maximum/minimum values
- Zero values
- Very large inputs
- Special characters
- Concurrent operations

**Template**:
```typescript
describe('edge cases', () => {
  it('should handle empty [collection]', async () => {
    const result = await service.list();
    assertEquals(result, []);
  });

  it('should handle max length [field]', async () => {
    const maxLengthValue = 'x'.repeat(100); // max allowed
    const result = await service.create({ field: maxLengthValue });
    assertEquals(result.field, maxLengthValue);
  });
});
```

---

### Pattern: `KV_INTEGRATION_TESTS`

For testing Deno KV persistence and indexes.

**Test scenarios**:
- Data is persisted correctly
- Indexes are created
- Indexes are used for queries
- Atomic operations work
- Pagination works

**Template**:
```typescript
describe('KV integration', () => {
  it('should persist data correctly', async () => {
    const created = await service.create({ name: 'test' });

    // Verify in KV
    const stored = await kv.get(['resources', created.id]);
    assertEquals(stored.value, created);
  });

  it('should create secondary index', async () => {
    const created = await service.create({ name: 'test' });

    // Verify index exists
    const index = await kv.get(['resources_by_name', 'test']);
    assertEquals(index.value, created.id);
  });
});
```

---

## Test Data Patterns

### Pattern: `VALID_DATA`

Minimal valid data for creating resources.

```typescript
// tests/helpers/test-data.ts
export const validUserData = {
  email: 'test@example.com',
  name: 'Test User',
  // Only required fields
};

export const validTaskData = {
  name: 'Test Task',
  status: 'active',
};
```

### Pattern: `INVALID_DATA`

Common invalid data scenarios.

```typescript
export const invalidUserData = {
  missingEmail: { name: 'Test' }, // missing required field
  invalidEmail: { email: 'not-an-email', name: 'Test' },
  tooLongName: { email: 'test@example.com', name: 'x'.repeat(101) },
  emptyName: { email: 'test@example.com', name: '' },
};
```

### Pattern: `DATA_BUILDERS`

Functions that generate test data.

```typescript
// tests/helpers/builders.ts
export function buildUser(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Usage:
const user1 = buildUser({ email: 'user1@example.com' });
const user2 = buildUser({ email: 'user2@example.com' });
```

---

## Assertion Patterns

### Pattern: `ASSERT_CREATED`

Standard assertions for created resources.

```typescript
// Assert created successfully
assertEquals(result.id, expect.any(String)); // has ID
assertEquals(result.name, inputData.name); // matches input
assertEquals(result.createdAt, expect.any(String)); // has timestamp
assertEquals(result.updatedAt, expect.any(String)); // has timestamp
```

### Pattern: `ASSERT_ERROR`

Standard assertions for error responses.

```typescript
await assertRejects(
  () => service.operation(),
  Error,
  'expected error message',
);

// OR for more specific:
try {
  await service.operation();
  throw new Error('Should have thrown');
} catch (error) {
  assertEquals(error.message, 'expected error message');
  assertEquals(error.code, 'ERROR_CODE');
}
```

---

## Token Savings Summary

| Optimization | Saves per Feature | How |
|--------------|-------------------|-----|
| Use CRUD pattern | ~500 tokens | Reference pattern instead of 11 tests |
| Use test data builders | ~100 tokens | Import instead of defining data in each test |
| Reference validation patterns | ~50 tokens/test | Copy template, don't write from scratch |
| Use standard assertions | ~20 tokens/test | Use patterns instead of custom logic |
| **Total potential** | **~700-1000 tokens** | **Per service** |

---

## When NOT to Use Patterns

Don't use patterns when:
- ❌ Business logic is highly custom
- ❌ Complex multi-step workflows
- ❌ Domain-specific calculations
- ❌ Unique edge cases

For these, write custom tests from scratch.

---

## Best Practices

1. **Start with pattern** - Use CRUD pattern for simple services, customize as needed
2. **Test business logic** - Focus on YOUR code, not framework code
3. **One assertion per test** - Makes failures clear
4. **Descriptive test names** - Should read like documentation
5. **Use helpers** - KV setup, data builders, test client

---

## Usage in Test Writer Agent

When the agent analyzes API specs:

1. **Identify CRUD operations** → Use `CRUD_SERVICE_TESTS` pattern
2. **Identify business rules** → Use `BUSINESS_RULE_TESTS` pattern
3. **Identify validations** → Use `VALIDATION_TESTS` pattern
4. **Generate test file** → Reference patterns, don't repeat

This approach saves 40-60% tokens in test writing phase.
