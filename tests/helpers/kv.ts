/**
 * KV Testing Harness
 * Provides utilities for opening and closing an in-memory KV instance
 * without repeating boilerplate in each test suite.
 */

export async function openTestKv(): Promise<Deno.Kv> {
  return await Deno.openKv(":memory:");
}

export async function withTestKv<T>(fn: (kv: Deno.Kv) => Promise<T>): Promise<T> {
  const kv = await openTestKv();
  try {
    return await fn(kv);
  } finally {
    await kv.close();
  }
}
