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
import { afterEach, beforeEach, describe, it } from 'jsr:@std/testing/bdd';
import { setupTestKv } from '../../helpers/kv-test.ts';

// TODO: Import your service
// import { [ServiceName] } from '../../../shared/services/[service].ts';

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

describe('[ServiceName]', () => {
  let kv: Deno.Kv;
  let cleanup: () => Promise<void>;
  let service: [ServiceName];

  beforeEach(async () => {
    const setup = await setupTestKv();
    kv = setup.kv;
    cleanup = setup.cleanup;
    service = new [ServiceName](kv);
  });

  afterEach(async () => {
    await cleanup();
  });

  // ============================================================================
  // CREATE Tests
  // ============================================================================

  describe('create', () => {
    it('should succeed with valid data', async () => {
      const result = await service.create(validData);

      // Standard assertions for created resource
      assertEquals(typeof result.id, 'string');
      assertEquals(result.name, validData.name); // TODO: Update field names
      assertEquals(typeof result.createdAt, 'string');
      assertEquals(typeof result.updatedAt, 'string');
    });

    it('should reject missing required fields', async () => {
      await assertRejects(
        () => service.create(invalidData.missingRequired),
        Error,
        'required', // TODO: Update expected error message
      );
    });

    it('should reject invalid format', async () => {
      await assertRejects(
        () => service.create(invalidData.invalidFormat),
        Error,
        'invalid', // TODO: Update expected error message
      );
    });

    // TODO: If resource has unique constraint (e.g., email), keep this test
    it('should prevent duplicates', async () => {
      await service.create(validData);

      await assertRejects(
        () => service.create(validData), // Same data
        Error,
        'already exists', // TODO: Update expected error message
      );
    });
  });

  // ============================================================================
  // LIST Tests
  // ============================================================================

  describe('list', () => {
    it('should return empty array when no items', async () => {
      const result = await service.list();

      assertEquals(result, []);
    });

    it('should return all items', async () => {
      // Create test items
      await service.create({ ...validData, name: 'Item 1' });
      await service.create({ ...validData, name: 'Item 2' });

      const result = await service.list();

      assertEquals(result.length, 2);
    });

    // TODO: If service supports pagination, keep this test
    it('should paginate correctly', async () => {
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
    });
  });

  // ============================================================================
  // GET Tests
  // ============================================================================

  describe('get', () => {
    it('should return item by id', async () => {
      const created = await service.create(validData);
      const result = await service.get(created.id);

      assertEquals(result.id, created.id);
      assertEquals(result.name, created.name);
    });

    it('should return null for non-existent id', async () => {
      const result = await service.get('non-existent-id');

      assertEquals(result, null);
    });
  });

  // ============================================================================
  // UPDATE Tests
  // ============================================================================

  describe('update', () => {
    it('should modify existing item', async () => {
      const created = await service.create(validData);
      const updated = await service.update(created.id, { name: 'Updated Name' });

      assertEquals(updated.id, created.id);
      assertEquals(updated.name, 'Updated Name');
      assertEquals(updated.updatedAt !== created.updatedAt, true); // Timestamp changed
    });

    it('should reject invalid data', async () => {
      const created = await service.create(validData);

      await assertRejects(
        () => service.update(created.id, invalidData.invalidFormat),
        Error,
        'invalid',
      );
    });

    it('should return null for non-existent id', async () => {
      const result = await service.update('non-existent-id', { name: 'Test' });

      assertEquals(result, null);
    });
  });

  // ============================================================================
  // DELETE Tests
  // ============================================================================

  describe('delete', () => {
    it('should remove existing item', async () => {
      const created = await service.create(validData);
      const deleted = await service.delete(created.id);

      assertEquals(deleted, true);

      // Verify it's gone
      const result = await service.get(created.id);
      assertEquals(result, null);
    });

    it('should be idempotent (returns false for non-existent)', async () => {
      const result = await service.delete('non-existent-id');

      assertEquals(result, false);
    });
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
  describe('business rule: [describe rule]', () => {
    it('should [expected behavior]', async () => {
      // Your custom test
    });
  });
  */
});
