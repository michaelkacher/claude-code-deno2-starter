# Test Optimization Guide

This guide documents token efficiency optimizations for writing backend tests following TDD principles.

## Overview

The template now includes **test pattern optimizations** that can save **700-1200 tokens per service** (50-60% reduction in test writing phase).

## Optimization Layers

### Layer 1: CRUD Test Template (NEW)
**Token Savings**: ~400-600 tokens per simple service

For services with standard CRUD operations, use a pre-built template with all 11 standard tests.

**Files**:
- `tests/templates/service-crud.test.template.ts` - Complete CRUD test suite template

**Benefits**:
- ✅ 11 tests (Create, Read, Update, Delete, List + validations) ready to customize
- ✅ Only fill in placeholders: service name, valid data, invalid data
- ✅ Comprehensive coverage with minimal effort

### Layer 2: Test Data Patterns (NEW)
**Token Savings**: ~100-150 tokens per test file

Reusable test data builders and validation cases.

**Files**:
- `tests/helpers/test-data-patterns.ts` - Reusable data builders and common cases

**Benefits**:
- ✅ Import valid/invalid data instead of defining in each test
- ✅ Common validation cases (email, string length, numeric ranges)
- ✅ Edge case generators
- ✅ KV seed data helpers

### Layer 3: Test Pattern Reference (NEW)
**Token Savings**: ~200-400 tokens per complex service

Standard patterns for common testing scenarios.

**Files**:
- `tests/templates/TEST_PATTERNS.md` - Reference guide for common test patterns

**Benefits**:
- ✅ Validation test patterns
- ✅ Business rule test patterns
- ✅ Edge case patterns
- ✅ KV integration patterns
- ✅ Standard assertion patterns

### Layer 4: Smart Agent Instructions (NEW)
**Token Savings**: Automatic application of above optimizations

The test-writer agent now:
- ✅ Analyzes service complexity
- ✅ Chooses CRUD template vs custom template automatically
- ✅ Imports test data patterns
- ✅ References TEST_PATTERNS.md for common scenarios

## Token Savings Breakdown

| Optimization | Per Service | Per Test | When Applied |
|--------------|-------------|----------|--------------|
| CRUD template | 400-600 | N/A | Simple CRUD (Layer 1) |
| Test data patterns | 100-150 | N/A | All tests (Layer 2) |
| Pattern references | 200-400 | 50 | Complex services (Layer 3) |
| Smart agent | Varies | Varies | Always (Layer 4) |
| **Total possible** | **700-1200** | **50** | **All layers** |

## Usage Examples

### Example 1: Simple CRUD Service (Recommended Approach)

**Service**: User management with standard CRUD operations

**Agent will use**:
1. CRUD template (Layer 1)
2. Test data patterns (Layer 2)
3. Standard assertions (Layer 3)

**Result**: ~600 tokens (vs ~1400 with old approach)

**Test file** (`tests/unit/services/users.test.ts`):
```typescript
// Copied from service-crud.test.template.ts and customized

import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { setupTestKv } from '../helpers/kv-test.ts';
import { validUserData, invalidUserData, buildUser } from '../helpers/test-data-patterns.ts';
import { UserService } from '../../backend/services/users.ts';

// ============================================================================
// CREATE Tests (5 tests - all from template)
// ============================================================================

Deno.test('UserService - create: succeeds with valid data', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new UserService(kv);
    const result = await service.create(validUserData);

    assertEquals(typeof result.id, 'string');
    assertEquals(result.email, validUserData.email);
    assertEquals(typeof result.createdAt, 'string');
  } finally {
    await cleanup();
  }
});

Deno.test('UserService - create: rejects missing required fields', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new UserService(kv);

    await assertRejects(
      () => service.create(invalidUserData.missingEmail),
      Error,
      'email is required',
    );
  } finally {
    await cleanup();
  }
});

// ... 9 more CRUD tests from template ...

// ============================================================================
// CUSTOM BUSINESS LOGIC Tests
// ============================================================================

Deno.test('UserService - business rule: assigns default role', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new UserService(kv);
    const result = await service.create(validUserData);

    assertEquals(result.role, 'user'); // Default role
  } finally {
    await cleanup();
  }
});
```

**Token breakdown**:
- CRUD template: 500 tokens (vs 1000 writing from scratch) → **50% savings**
- Test data imports: 50 tokens (vs 150 defining data) → **67% savings**
- Total: ~600 tokens (vs ~1400) → **57% savings**

### Example 2: Complex Service with Business Logic

**Service**: Workout builder with calculations and validations

**Agent will use**:
1. Custom template (not CRUD, due to complexity)
2. Test data patterns (Layer 2)
3. Pattern references for validations (Layer 3)

**Result**: ~900 tokens (vs ~1600 with old approach)

**Why not CRUD template?**
- Custom calculation logic (duration, intensity)
- Complex validation (exercise compatibility)
- Non-standard operations (clone workout, reorder exercises)

**Test file** (`tests/unit/services/workouts.test.ts`):
```typescript
import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { setupTestKv } from '../helpers/kv-test.ts';
import { buildWorkout, validWorkoutData } from '../helpers/test-data-patterns.ts';
import { WorkoutService } from '../../backend/services/workouts.ts';

Deno.test('WorkoutService - business rule: calculates total duration', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutService(kv);

    const workout = await service.create({
      name: 'Test Workout',
      exercises: [
        { id: 'ex1', duration: 10 },
        { id: 'ex2', duration: 15 },
      ],
    });

    assertEquals(workout.totalDuration, 25); // 10 + 15
  } finally {
    await cleanup();
  }
});

// Pattern: VALIDATION_TESTS (see TEST_PATTERNS.md)
Deno.test('WorkoutService - validation: requires at least 1 exercise', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutService(kv);

    await assertRejects(
      () => service.create({ name: 'Test', exercises: [] }),
      Error,
      'at least one exercise',
    );
  } finally {
    await cleanup();
  }
});

// Pattern: BUSINESS_RULE_TESTS (see TEST_PATTERNS.md)
Deno.test('WorkoutService - business rule: validates exercise compatibility', async () => {
  // Custom business logic test
});
```

**Token breakdown**:
- Custom tests: 700 tokens (vs 1200 from scratch) → **42% savings** (using patterns)
- Test data imports: 50 tokens (vs 150 defining data) → **67% savings**
- Pattern references: 150 tokens (vs 250 writing docs) → **40% savings**
- Total: ~900 tokens (vs ~1600) → **44% savings**

## Comparison: Old vs New Approach

### Old Approach (No Optimization)

**User Service Tests** (~1400 tokens):
```typescript
// Define test data in file (~150 tokens)
const validUser = { email: 'test@example.com', name: 'Test User' };
const invalidUser = { email: 'bad', name: 'Test' };

// Write 11 CRUD tests from scratch (~1000 tokens)
Deno.test('create with valid data', async () => { /* ~90 tokens */ });
Deno.test('create rejects missing email', async () => { /* ~90 tokens */ });
Deno.test('create rejects invalid email', async () => { /* ~90 tokens */ });
// ... 8 more tests (~720 tokens)

// Write custom business logic tests (~250 tokens)
Deno.test('assigns default role', async () => { /* ~80 tokens */ });
```

**Total: ~1400 tokens**

### New Approach (All Optimizations)

**User Service Tests** (~600 tokens):
```typescript
// Import test data (~50 tokens)
import { validUserData, invalidUserData } from '../helpers/test-data-patterns.ts';

// Copy CRUD template and customize (~500 tokens)
// Template has all 11 tests, just fill in service name and data

// Add custom business logic tests (~50 tokens)
// Use pattern references for standard assertions
```

**Total: ~600 tokens (57% savings)**

## How to Use

### For Developers

When using `/new-feature` command, the test-writer agent will automatically:
1. Analyze service complexity from API spec
2. Choose CRUD template for simple services
3. Import test data patterns
4. Reference TEST_PATTERNS.md for common scenarios

**You don't need to do anything special** - it's automatic!

### For Manual Test Writing

1. **Determine service type**:
   - Simple CRUD? → Copy `service-crud.test.template.ts`
   - Complex logic? → Copy `service.test.template.ts`

2. **Import test data patterns**:
   ```typescript
   import {
     buildUser,
     validUserData,
     invalidUserData,
     emailCases,
     stringLengthCases,
   } from '../helpers/test-data-patterns.ts';
   ```

3. **Reference patterns** from `TEST_PATTERNS.md` for common scenarios

4. **Customize** for business-specific logic

## Migration

### Existing Tests

Tests already written don't need to change. The optimizations apply to **new tests** going forward.

If you want to migrate existing tests:
1. Identify CRUD services
2. Copy CRUD template
3. Replace custom tests with template
4. Add imports for test data patterns
5. Estimated savings: ~400-600 tokens per service

## Reference Files

| File | Purpose | When to Read |
|------|---------|--------------|
| `tests/templates/TEST_PATTERNS.md` | Common test patterns reference | When writing complex tests |
| `tests/templates/service-crud.test.template.ts` | CRUD test template | When testing simple CRUD service |
| `tests/templates/service.test.template.ts` | Business logic test template | When testing complex service |
| `tests/helpers/test-data-patterns.ts` | Reusable test data | When writing any test |

## Best Practices

### DO ✅

1. **Default to CRUD template** - Use CRUD template unless service has complex custom logic
2. **Import test data** - Use test-data-patterns.ts instead of defining data in each file
3. **Reference patterns** - Use TEST_PATTERNS.md for validation, edge cases, assertions
4. **Test business logic** - Focus on YOUR code, not framework code
5. **Use KV helpers** - setupTestKv() for automatic cleanup

### DON'T ❌

1. **Don't write CRUD tests from scratch** - Use template
2. **Don't define test data in each file** - Import from test-data-patterns.ts
3. **Don't test framework code** - No HTTP status codes, routing, JSON serialization
4. **Don't duplicate validation tests** - Reference patterns for common validations
5. **Don't skip cleanup** - Always use try/finally with setupTestKv()

## Measuring Success

Track token usage in your tests:

**Old approach** (no templates, no patterns):
- Simple CRUD service: ~1400 tokens
- Complex service: ~1600 tokens
- 5 services total: ~7500 tokens

**New approach** (all optimizations):
- Simple CRUD service (3): ~600 tokens each = 1800 tokens
- Complex service (2): ~900 tokens each = 1800 tokens
- 5 services total: ~3600 tokens

**Savings: 52% (3900 tokens)**

## Future Optimizations

Potential additional optimizations:

1. **API endpoint test generator** - Auto-generate integration tests from API spec
2. **Snapshot testing** - Compare outputs with snapshots for complex data structures
3. **Test coverage analyzer** - Identify missing test cases automatically
4. **Mock generators** - Auto-generate mocks from interfaces

## Integration with API Optimization

When combined with API design optimizations:

**Feature Development Token Usage**:

| Phase | Old | New | Savings |
|-------|-----|-----|---------|
| API Design | 20,000 | 8-12,000 | 50-60% |
| Test Writing | 7,500 | 3,600 | 52% |
| **Total** | **27,500** | **11,600-15,600** | **43-58%** |

**Combined optimizations save 12,000-16,000 tokens per feature!**

## Questions?

- See `tests/templates/TEST_PATTERNS.md` for pattern reference
- See `tests/templates/service-crud.test.template.ts` for CRUD template
- See `tests/helpers/test-data-patterns.ts` for test data examples
- Use `/new-feature` command to write tests with all optimizations automatically
