/**
 * CRUD Service Test Template (Shorthand)
 *
 * Use this template for services with standard CRUD operations.
 * This tests ALL standard CRUD functionality with minimal code.
 *
 * Pattern: CRUD_SERVICE_TESTS (see TEST_PATTERNS.md)
 *
 * Token savings: ~400-600 tokens vs writing tests from scratch
 *
 * Instructions:
 * 1. Replace [ServiceName] with your service name (e.g., UserService)
 * 2. Replace [resourceName] with resource name (e.g., user)
 * 3. Replace [resourcesKey] with KV key (e.g., 'users')
 * 4. Fill in validData and invalidData
 * 5. Update uniqueField if your resource has unique constraints
 * 6. Delete tests that don't apply (e.g., if no unique field, delete duplicate test)
 */

import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { setupTestKv, seedKv } from '../helpers/kv-test.ts';

// TODO: Import your service
// import { [ServiceName] } from '../../shared/services/[service].ts';

// TODO: Define test data
const validData = {
  // Add required fields with valid values
  // Example: name: 'Test Item', status: 'active'
};

const invalidData = {
  missingRequired: {
    // Missing required field
  },
  invalidFormat: {
    // Invalid field format (e.g., bad email, negative number)
  },
  tooLong: {
    // Field exceeding max length
  },
};

// ============================================================================
// CREATE Tests
// ============================================================================

Deno.test('[ServiceName] - create: succeeds with valid data', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new [ServiceName](kv);

    const result = await service.create(validData);

    // Standard assertions for created resource
    assertEquals(typeof result.id, 'string');
    assertEquals(result.name, validData.name); // TODO: Update field names
    assertEquals(typeof result.createdAt, 'string');
    assertEquals(typeof result.updatedAt, 'string');
  } finally {
    await cleanup();
  }
});

Deno.test('[ServiceName] - create: rejects missing required fields', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new [ServiceName](kv);

    await assertRejects(
      () => service.create(invalidData.missingRequired),
      Error,
      'required', // TODO: Update expected error message
    );
  } finally {
    await cleanup();
  }
});

Deno.test('[ServiceName] - create: rejects invalid format', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new [ServiceName](kv);

    await assertRejects(
      () => service.create(invalidData.invalidFormat),
      Error,
      'invalid', // TODO: Update expected error message
    );
  } finally {
    await cleanup();
  }
});

// TODO: If resource has unique constraint (e.g., email), keep this test
Deno.test('[ServiceName] - create: prevents duplicates', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new [ServiceName](kv);

    await service.create(validData);

    await assertRejects(
      () => service.create(validData), // Same data
      Error,
      'already exists', // TODO: Update expected error message
    );
  } finally {
    await cleanup();
  }
});

// ============================================================================
// LIST Tests
// ============================================================================

Deno.test('[ServiceName] - list: returns empty array when no items', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new [ServiceName](kv);

    const result = await service.list();

    assertEquals(result, []);
  } finally {
    await cleanup();
  }
});

Deno.test('[ServiceName] - list: returns all items', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new [ServiceName](kv);

    // Create test items
    await service.create({ ...validData, name: 'Item 1' });
    await service.create({ ...validData, name: 'Item 2' });

    const result = await service.list();

    assertEquals(result.length, 2);
  } finally {
    await cleanup();
  }
});

// TODO: If service supports pagination, keep this test
Deno.test('[ServiceName] - list: pagination works', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new [ServiceName](kv);

    // Create 15 items
    for (let i = 0; i < 15; i++) {
      await service.create({ ...validData, name: `Item ${i}` });
    }

    // First page
    const page1 = await service.list({ limit: 10 });
    assertEquals(page1.data.length, 10);
    assertEquals(typeof page1.cursor, 'string');

    // Second page
    const page2 = await service.list({ limit: 10, cursor: page1.cursor });
    assertEquals(page2.data.length, 5);
    assertEquals(page2.cursor, null); // No more pages
  } finally {
    await cleanup();
  }
});

// ============================================================================
// GET Tests
// ============================================================================

Deno.test('[ServiceName] - get: returns item by id', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new [ServiceName](kv);

    const created = await service.create(validData);
    const result = await service.get(created.id);

    assertEquals(result.id, created.id);
    assertEquals(result.name, created.name);
  } finally {
    await cleanup();
  }
});

Deno.test('[ServiceName] - get: returns null for non-existent id', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new [ServiceName](kv);

    const result = await service.get('non-existent-id');

    assertEquals(result, null);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// UPDATE Tests
// ============================================================================

Deno.test('[ServiceName] - update: modifies existing item', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new [ServiceName](kv);

    const created = await service.create(validData);
    const updated = await service.update(created.id, { name: 'Updated Name' });

    assertEquals(updated.id, created.id);
    assertEquals(updated.name, 'Updated Name');
    assertEquals(updated.updatedAt !== created.updatedAt, true); // Timestamp changed
  } finally {
    await cleanup();
  }
});

Deno.test('[ServiceName] - update: rejects invalid data', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new [ServiceName](kv);

    const created = await service.create(validData);

    await assertRejects(
      () => service.update(created.id, invalidData.invalidFormat),
      Error,
      'invalid',
    );
  } finally {
    await cleanup();
  }
});

Deno.test('[ServiceName] - update: returns null for non-existent id', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new [ServiceName](kv);

    const result = await service.update('non-existent-id', { name: 'Test' });

    assertEquals(result, null);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// DELETE Tests
// ============================================================================

Deno.test('[ServiceName] - delete: removes existing item', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new [ServiceName](kv);

    const created = await service.create(validData);
    const deleted = await service.delete(created.id);

    assertEquals(deleted, true);

    // Verify it's gone
    const result = await service.get(created.id);
    assertEquals(result, null);
  } finally {
    await cleanup();
  }
});

Deno.test('[ServiceName] - delete: is idempotent (returns false for non-existent)', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new [ServiceName](kv);

    const result = await service.delete('non-existent-id');

    assertEquals(result, false);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// CUSTOM BUSINESS LOGIC Tests (Add below)
// ============================================================================

// TODO: Add tests for custom business logic specific to your service
// Examples:
// - Status transitions
// - Calculations
// - Custom validations
// - Relationships
// - Side effects

/*
Deno.test('[ServiceName] - business rule: [describe rule]', async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new [ServiceName](kv);

    // Your custom test
  } finally {
    await cleanup();
  }
});
*/
