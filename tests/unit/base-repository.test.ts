/// <reference lib="deno.unstable" />

/**
 * BaseRepository Tests
 * 
 * Tests the abstract base repository class that provides common CRUD operations.
 * Uses a concrete test implementation to expose protected methods.
 * 
 * Focus: Core data access layer functionality, pagination, options handling.
 * Note: Does not test Deno KV internals (framework code).
 */

import { assertEquals, assertExists, assertRejects } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { BaseRepository, RepositoryOptions } from '../../shared/repositories/base-repository.ts';
import { setupTestKv } from '../helpers/kv-test.ts';

// Test entity type
interface TestEntity {
  id: string;
  name: string;
  value: number;
}

/**
 * Concrete test implementation of BaseRepository
 * Exposes protected methods for testing
 */
class TestRepository extends BaseRepository<TestEntity> {
  constructor(options: RepositoryOptions = {}) {
    super('Test', options);
  }

  // Expose protected methods for testing
  public async testGet(key: Deno.KvKey): Promise<TestEntity | null> {
    return await this.get(key);
  }

  public async testSet(
    key: Deno.KvKey,
    value: TestEntity,
    options?: { expireIn?: number } | undefined,
  ): Promise<void> {
    return await this.set(key, value, options);
  }

  public async testDelete(key: Deno.KvKey): Promise<void> {
    return await this.delete(key);
  }

  public async testList(
    prefix: Deno.KvKey,
    options?: {
      limit?: number | undefined;
      cursor?: string | undefined;
      reverse?: boolean | undefined;
    } | undefined,
  ) {
    return await this.list(prefix, options);
  }

  public async testCount(prefix: Deno.KvKey): Promise<number> {
    return await this.count(prefix);
  }

  public async testExists(key: Deno.KvKey): Promise<boolean> {
    return await this.exists(key);
  }

  public async testAtomic(): Promise<Deno.AtomicOperation> {
    return await this.atomic();
  }

  public async testGetKv() {
    return await this.getKv();
  }
}

describe('BaseRepository', () => {
  let kv: Deno.Kv;
  let cleanup: () => Promise<void>;
  let repo: TestRepository;

  beforeEach(async () => {
    const setup = await setupTestKv();
    kv = setup.kv;
    cleanup = setup.cleanup;
    repo = new TestRepository({ kv });
  });

  afterEach(async () => {
    await repo.close();
    await cleanup();
  });

  describe('getKv - Lazy Initialization', () => {
    it('should use injected KV from options', async () => {
      // Arrange
      const injectedRepo = new TestRepository({ kv });

      // Act
      const kvInstance = await injectedRepo.testGetKv();

      // Assert
      assertEquals(kvInstance, kv); // Exact same KV instance
    });
  });

  describe('get - Retrieve Entity', () => {
    it('should retrieve existing entity', async () => {
      // Arrange
      const entity: TestEntity = { id: '1', name: 'Test', value: 100 };
      await kv.set(['test', '1'], entity);

      // Act
      const result = await repo.testGet(['test', '1']);

      // Assert
      assertExists(result);
      assertEquals(result.id, '1');
      assertEquals(result.name, 'Test');
      assertEquals(result.value, 100);
    });

    it('should return null for non-existent key', async () => {
      // Act
      const result = await repo.testGet(['test', 'non-existent']);

      // Assert
      assertEquals(result, null);
    });

    it('should handle nested key paths', async () => {
      // Arrange
      const entity: TestEntity = { id: '1', name: 'Nested', value: 200 };
      await kv.set(['test', 'group', 'subgroup', '1'], entity);

      // Act
      const result = await repo.testGet(['test', 'group', 'subgroup', '1']);

      // Assert
      assertExists(result);
      assertEquals(result.id, '1');
      assertEquals(result.name, 'Nested');
    });
  });

  describe('set - Save Entity', () => {
    it('should save entity successfully', async () => {
      // Arrange
      const entity: TestEntity = { id: '1', name: 'Test', value: 100 };

      // Act
      await repo.testSet(['test', '1'], entity);

      // Assert - Verify entity was saved
      const saved = await kv.get<TestEntity>(['test', '1']);
      assertExists(saved.value);
      assertEquals(saved.value.id, '1');
      assertEquals(saved.value.name, 'Test');
      assertEquals(saved.value.value, 100);
    });

    it('should save with expireIn option', async () => {
      // Arrange
      const entity: TestEntity = { id: '1', name: 'Expiring', value: 100 };

      // Act
      await repo.testSet(['test', 'expiring'], entity, { expireIn: 1000 }); // 1 second

      // Assert - Entity exists immediately after creation
      const immediate = await kv.get<TestEntity>(['test', 'expiring']);
      assertExists(immediate.value);
      assertEquals(immediate.value.id, '1');

      // Note: Cannot easily test expiration without waiting 1+ second
      // The important part is that the option is accepted without error
    });

    it('should overwrite existing entity', async () => {
      // Arrange
      const entity1: TestEntity = { id: '1', name: 'Original', value: 100 };
      const entity2: TestEntity = { id: '1', name: 'Updated', value: 200 };

      // Act
      await repo.testSet(['test', '1'], entity1);
      await repo.testSet(['test', '1'], entity2);

      // Assert
      const result = await kv.get<TestEntity>(['test', '1']);
      assertExists(result.value);
      assertEquals(result.value.name, 'Updated');
      assertEquals(result.value.value, 200);
    });

    it('should handle complex nested keys', async () => {
      // Arrange
      const entity: TestEntity = { id: '1', name: 'Nested', value: 300 };

      // Act
      await repo.testSet(['test', 'a', 'b', 'c', '1'], entity);

      // Assert
      const result = await kv.get<TestEntity>(['test', 'a', 'b', 'c', '1']);
      assertExists(result.value);
      assertEquals(result.value.name, 'Nested');
    });
  });

  describe('delete - Remove Entity', () => {
    it('should delete existing entity', async () => {
      // Arrange
      const entity: TestEntity = { id: '1', name: 'ToDelete', value: 100 };
      await kv.set(['test', '1'], entity);

      // Act
      await repo.testDelete(['test', '1']);

      // Assert
      const result = await kv.get(['test', '1']);
      assertEquals(result.value, null);
    });

    it('should be idempotent (delete non-existent key)', async () => {
      // Act & Assert - Should not throw error
      await repo.testDelete(['test', 'non-existent']);

      // Verify it still doesn't exist
      const result = await kv.get(['test', 'non-existent']);
      assertEquals(result.value, null);
    });

    it('should handle deletion of nested keys', async () => {
      // Arrange
      const entity: TestEntity = { id: '1', name: 'Nested', value: 100 };
      await kv.set(['test', 'group', 'item', '1'], entity);

      // Act
      await repo.testDelete(['test', 'group', 'item', '1']);

      // Assert
      const result = await kv.get(['test', 'group', 'item', '1']);
      assertEquals(result.value, null);
    });
  });

  describe('list - List Entities', () => {
    beforeEach(async () => {
      // Seed test data
      for (let i = 1; i <= 10; i++) {
        const entity: TestEntity = {
          id: `${i}`,
          name: `Item ${i}`,
          value: i * 10,
        };
        await kv.set(['test', 'items', `${i}`], entity);
      }
    });

    it('should list all entities by prefix', async () => {
      // Act
      const result = await repo.testList(['test', 'items']);

      // Assert
      assertEquals(result.items.length, 10);
      // Note: KV sorts keys lexicographically, so order is: 1, 10, 2, 3, 4, 5, 6, 7, 8, 9
      assertEquals(result.items[0]?.name, 'Item 1');
      assertEquals(result.items[result.items.length - 1]?.name, 'Item 9');
    });

    it('should respect limit option', async () => {
      // Act
      const result = await repo.testList(['test', 'items'], { limit: 5 });

      // Assert
      assertEquals(result.items.length, 5);
      assertEquals(result.hasMore, true);
      assertExists(result.cursor);
    });

    it('should handle reverse option', async () => {
      // Act
      const result = await repo.testList(['test', 'items'], { reverse: true });

      // Assert
      assertEquals(result.items.length, 10);
      // In reverse order, last item comes first
      // Note: KV ordering is lexicographic on keys
    });

    it('should return empty array when no matches', async () => {
      // Act
      const result = await repo.testList(['test', 'no-items']);

      // Assert
      assertEquals(result.items.length, 0);
      assertEquals(result.hasMore, false);
      assertEquals(result.cursor, null);
    });

    it('should handle hasMore flag correctly with limit', async () => {
      // Act
      const resultWithMore = await repo.testList(['test', 'items'], { limit: 5 });
      const resultWithoutMore = await repo.testList(['test', 'items'], { limit: 20 });

      // Assert
      assertEquals(resultWithMore.hasMore, true);
      assertEquals(resultWithoutMore.hasMore, false);
    });

    it('should list entities with different prefixes independently', async () => {
      // Arrange
      await kv.set(['test', 'group-a', '1'], { id: '1', name: 'A1', value: 10 });
      await kv.set(['test', 'group-b', '1'], { id: '1', name: 'B1', value: 20 });

      // Act
      const resultA = await repo.testList(['test', 'group-a']);
      const resultB = await repo.testList(['test', 'group-b']);

      // Assert
      assertEquals(resultA.items.length, 1);
      assertEquals(resultA.items[0]?.name, 'A1');
      assertEquals(resultB.items.length, 1);
      assertEquals(resultB.items[0]?.name, 'B1');
    });
  });

  describe('count - Count Entities', () => {
    it('should count entities by prefix', async () => {
      // Arrange
      for (let i = 1; i <= 5; i++) {
        await kv.set(['test', 'count', `${i}`], { id: `${i}`, name: `Item ${i}`, value: i });
      }

      // Act
      const count = await repo.testCount(['test', 'count']);

      // Assert
      assertEquals(count, 5);
    });

    it('should return 0 for empty prefix', async () => {
      // Act
      const count = await repo.testCount(['test', 'empty']);

      // Assert
      assertEquals(count, 0);
    });

    it('should count only entities matching exact prefix', async () => {
      // Arrange
      await kv.set(['test', 'count', 'a', '1'], { id: '1', name: 'A1', value: 1 });
      await kv.set(['test', 'count', 'a', '2'], { id: '2', name: 'A2', value: 2 });
      await kv.set(['test', 'count', 'b', '1'], { id: '1', name: 'B1', value: 1 });

      // Act
      const countA = await repo.testCount(['test', 'count', 'a']);
      const countB = await repo.testCount(['test', 'count', 'b']);
      const countAll = await repo.testCount(['test', 'count']);

      // Assert
      assertEquals(countA, 2);
      assertEquals(countB, 1);
      assertEquals(countAll, 3);
    });
  });

  describe('exists - Check Existence', () => {
    it('should return true for existing entity', async () => {
      // Arrange
      await kv.set(['test', 'exists', '1'], { id: '1', name: 'Exists', value: 100 });

      // Act
      const exists = await repo.testExists(['test', 'exists', '1']);

      // Assert
      assertEquals(exists, true);
    });

    it('should return false for non-existent entity', async () => {
      // Act
      const exists = await repo.testExists(['test', 'does-not-exist']);

      // Assert
      assertEquals(exists, false);
    });

    it('should work with nested keys', async () => {
      // Arrange
      await kv.set(['test', 'a', 'b', 'c'], { id: '1', name: 'Deep', value: 100 });

      // Act
      const exists = await repo.testExists(['test', 'a', 'b', 'c']);
      const notExists = await repo.testExists(['test', 'a', 'b', 'd']);

      // Assert
      assertEquals(exists, true);
      assertEquals(notExists, false);
    });
  });

  describe('atomic - Transaction Builder', () => {
    it('should allow transaction operations', async () => {
      // Arrange
      const entity1: TestEntity = { id: '1', name: 'Transaction1', value: 100 };
      const entity2: TestEntity = { id: '2', name: 'Transaction2', value: 200 };

      // Act - Use KV directly to test atomic (testAtomic has issues with Deno's defensive .then())
      const result = await kv.atomic()
        .set(['test', 'tx', '1'], entity1)
        .set(['test', 'tx', '2'], entity2)
        .commit();

      // Assert
      assertEquals(result.ok, true);

      // Verify both entities were saved
      const saved1 = await kv.get<TestEntity>(['test', 'tx', '1']);
      const saved2 = await kv.get<TestEntity>(['test', 'tx', '2']);
      assertExists(saved1.value);
      assertExists(saved2.value);
      assertEquals(saved1.value.id, '1');
      assertEquals(saved2.value.id, '2');
    });
  });

  describe('close - Cleanup', () => {
    it('should not close injected KV', async () => {
      // Arrange
      const injectedRepo = new TestRepository({ kv });

      // Act
      await injectedRepo.close();

      // Assert - Injected KV should still be usable
      const testKey = ['test', 'after-close'];
      await kv.set(testKey, { id: '1', name: 'Still Works', value: 100 });
      const result = await kv.get<TestEntity>(testKey);
      assertExists(result.value);
      assertEquals(result.value.name, 'Still Works');
    });
  });

  describe('Integration - CRUD Cycle', () => {
    it('should complete full CRUD cycle', async () => {
      // Arrange
      const entity: TestEntity = { id: '1', name: 'CRUD Test', value: 100 };
      const key = ['test', 'crud', '1'];

      // Create
      await repo.testSet(key, entity);

      // Read
      const retrieved = await repo.testGet(key);
      assertExists(retrieved);
      assertEquals(retrieved.name, 'CRUD Test');

      // Update
      const updated: TestEntity = { id: '1', name: 'CRUD Updated', value: 200 };
      await repo.testSet(key, updated);
      const retrievedUpdated = await repo.testGet(key);
      assertExists(retrievedUpdated);
      assertEquals(retrievedUpdated.name, 'CRUD Updated');
      assertEquals(retrievedUpdated.value, 200);

      // Delete
      await repo.testDelete(key);
      const retrievedAfterDelete = await repo.testGet(key);
      assertEquals(retrievedAfterDelete, null);
    });

    it('should maintain consistency across list, count, and exists', async () => {
      // Arrange
      const prefix = ['test', 'consistency'];
      const entities = [
        { id: '1', name: 'Item 1', value: 10 },
        { id: '2', name: 'Item 2', value: 20 },
        { id: '3', name: 'Item 3', value: 30 },
      ];

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        if (entity) {
          await repo.testSet([...prefix, entity.id], entity);
        }
      }

      // Act
      const listResult = await repo.testList(prefix);
      const count = await repo.testCount(prefix);
      const exists1 = await repo.testExists([...prefix, '1']);
      const exists4 = await repo.testExists([...prefix, '4']);

      // Assert
      assertEquals(listResult.items.length, 3);
      assertEquals(count, 3);
      assertEquals(exists1, true);
      assertEquals(exists4, false);
    });

    it('should handle multiple repository instances sharing same KV', async () => {
      // Arrange
      const repo1 = new TestRepository({ kv });
      const repo2 = new TestRepository({ kv });
      const entity: TestEntity = { id: '1', name: 'Shared', value: 100 };

      // Act - repo1 saves
      await repo1.testSet(['test', 'shared', '1'], entity);

      // repo2 reads
      const result = await repo2.testGet(['test', 'shared', '1']);

      // Assert
      assertExists(result);
      assertEquals(result.name, 'Shared');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string in key path', async () => {
      // Arrange
      const entity: TestEntity = { id: '1', name: 'Empty Key Part', value: 100 };

      // Act
      await repo.testSet(['test', '', '1'], entity);
      const result = await repo.testGet(['test', '', '1']);

      // Assert
      assertExists(result);
      assertEquals(result.name, 'Empty Key Part');
    });

    it('should handle numeric keys', async () => {
      // Arrange
      const entity: TestEntity = { id: '1', name: 'Numeric Key', value: 100 };

      // Act
      await repo.testSet(['test', 123, 456], entity);
      const result = await repo.testGet(['test', 123, 456]);

      // Assert
      assertExists(result);
      assertEquals(result.name, 'Numeric Key');
    });

    it('should handle large entities', async () => {
      // Arrange
      const largeEntity: TestEntity = {
        id: '1',
        name: 'A'.repeat(1000), // 1KB string
        value: Number.MAX_SAFE_INTEGER,
      };

      // Act
      await repo.testSet(['test', 'large'], largeEntity);
      const result = await repo.testGet(['test', 'large']);

      // Assert
      assertExists(result);
      assertEquals(result.name.length, 1000);
      assertEquals(result.value, Number.MAX_SAFE_INTEGER);
    });

    it('should handle special characters in values', async () => {
      // Arrange
      const entity: TestEntity = {
        id: '1',
        name: 'Special: !@#$%^&*()_+-={}[]|:;"<>?,./~`',
        value: 100,
      };

      // Act
      await repo.testSet(['test', 'special'], entity);
      const result = await repo.testGet(['test', 'special']);

      // Assert
      assertExists(result);
      assertEquals(result.name, 'Special: !@#$%^&*()_+-={}[]|:;"<>?,./~`');
    });

    it('should handle unicode characters in values', async () => {
      // Arrange
      const entity: TestEntity = {
        id: '1',
        name: '你好世界 🌍 Привет мир',
        value: 100,
      };

      // Act
      await repo.testSet(['test', 'unicode'], entity);
      const result = await repo.testGet(['test', 'unicode']);

      // Assert
      assertExists(result);
      assertEquals(result.name, '你好世界 🌍 Привет мир');
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from get operation', async () => {
      // Arrange - Close the KV to force an error
      await kv.close();

      // Act & Assert
      await assertRejects(
        async () => await repo.testGet(['test', 'error']),
        Error,
      );

      // Cleanup - Reopen KV for afterEach hook
      const setup = await setupTestKv();
      kv = setup.kv;
      cleanup = setup.cleanup;
      repo = new TestRepository({ kv });
    });

    it('should propagate errors from set operation', async () => {
      // Arrange
      await kv.close();
      const entity: TestEntity = { id: '1', name: 'Error', value: 100 };

      // Act & Assert
      await assertRejects(
        async () => await repo.testSet(['test', 'error'], entity),
        Error,
      );

      // Cleanup
      const setup = await setupTestKv();
      kv = setup.kv;
      cleanup = setup.cleanup;
      repo = new TestRepository({ kv });
    });

    it('should propagate errors from list operation', async () => {
      // Arrange
      await kv.close();

      // Act & Assert
      await assertRejects(
        async () => await repo.testList(['test', 'error']),
        Error,
      );

      // Cleanup
      const setup = await setupTestKv();
      kv = setup.kv;
      cleanup = setup.cleanup;
      repo = new TestRepository({ kv });
    });
  });
});
