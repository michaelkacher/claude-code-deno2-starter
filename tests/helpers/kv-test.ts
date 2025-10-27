/**
 * Deno KV Test Helpers
 * Utilities for testing with in-memory Deno KV
 */

// deno-lint-ignore-file no-explicit-any

/**
 * Create an in-memory Deno KV instance for testing
 * Always use :memory: to ensure test isolation
 */
export async function createTestKv(): Promise<any> {
  return await (Deno as any).openKv(':memory:');
}

/**
 * Setup and teardown helper for Deno KV tests
 * Usage:
 *   const { kv, cleanup } = await setupTestKv();
 *   try {
 *     // your test code
 *   } finally {
 *     await cleanup();
 *   }
 */
export async function setupTestKv(): Promise<{
  kv: any;
  cleanup: () => Promise<void>;
}> {
  const kv = await createTestKv();

  return {
    kv,
    cleanup: async () => {
      await kv.close();
    },
  };
}

/**
 * Seed test data into KV
 * Usage:
 *   await seedKv(kv, [
 *     { key: ['users', 'user-1'], value: userData },
 *     { key: ['users', 'user-2'], value: userData2 },
 *   ]);
 */
export async function seedKv(
  kv: any,
  entries: Array<{ key: any[]; value: unknown }>,
): Promise<void> {
  for (const entry of entries) {
    await kv.set(entry.key, entry.value);
  }
}

/**
 * Count entries matching a prefix
 */
export async function countKvEntries(
  kv: any,
  prefix: any[],
): Promise<number> {
  let count = 0;
  const entries = kv.list({ prefix });
  for await (const _entry of entries) {
    count++;
  }
  return count;
}

/**
 * Get all entries matching a prefix
 */
export async function listKvEntries<T>(
  kv: any,
  prefix: any[],
): Promise<Array<{ key: any[]; value: T }>> {
  const results: Array<{ key: any[]; value: T }> = [];
  const entries = kv.list({ prefix });
  for await (const entry of entries) {
    results.push({ key: entry.key, value: entry.value });
  }
  return results;
}

/**
 * Clear all entries matching a prefix
 */
export async function clearKvPrefix(
  kv: any,
  prefix: any[],
): Promise<void> {
  const entries = kv.list({ prefix });
  const keys: any[] = [];

  for await (const entry of entries) {
    keys.push(entry.key);
  }

  for (const key of keys) {
    await kv.delete(key);
  }
}
