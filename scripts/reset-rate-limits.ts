/**
 * Reset Rate Limits
 * Clears all rate limiter data from Deno KV
 * Useful during development when you hit rate limits
 */

import { getKv } from '../backend/lib/kv.ts';

console.log('🧹 Clearing rate limiter data from Deno KV...');

const kv = await getKv();

// List all entries with rate limiter prefix
const rateLimitPrefix = 'ratelimit';

let deletedCount = 0;

console.log(`\n🔍 Looking for entries with prefix: ${rateLimitPrefix}`);

// List all entries that start with the rate limit prefix
const entries = kv.list({ prefix: [rateLimitPrefix] });

for await (const entry of entries) {
  await kv.delete(entry.key);
  deletedCount++;
  console.log(`   ✓ Deleted: ${entry.key.join('/')}`);
}

console.log(`\n✅ Rate limiter reset complete! Deleted ${deletedCount} entries.`);
console.log('You can now make requests without hitting rate limits.\n');

kv.close();
