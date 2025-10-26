#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

/**
 * Inspect Local Deno KV Database
 *
 * This script lists all entries in your local KV database.
 * Useful for debugging and understanding what data is stored.
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-env scripts/inspect-local-kv.ts
 *   or
 *   deno task inspect-kv (if added to deno.json tasks)
 *
 * Options:
 *   --prefix=users     List only keys starting with 'users'
 *   --limit=10         Limit results to 10 entries
 */

// Parse command line arguments
const args = Deno.args;
let prefix: string[] = [];
let limit: number | undefined;

for (const arg of args) {
  if (arg.startsWith('--prefix=')) {
    const prefixValue = arg.split('=')[1];
    prefix = [prefixValue];
  } else if (arg.startsWith('--limit=')) {
    limit = parseInt(arg.split('=')[1], 10);
  }
}

// Set environment to development
Deno.env.set('DENO_ENV', 'development');

// Open local KV database
const kv = await Deno.openKv('./data/local.db');

console.log('🔍 Inspecting local Deno KV database...\n');

if (prefix.length > 0) {
  console.log(`   Prefix: ${prefix.join('/')}`);
}
if (limit) {
  console.log(`   Limit: ${limit}`);
}
console.log();

try {
  const entries: Array<{ key: Deno.KvKey; value: unknown }> = [];

  // List all entries
  const iterator = kv.list({ prefix }, { limit });

  for await (const entry of iterator) {
    entries.push({
      key: entry.key,
      value: entry.value,
    });
  }

  if (entries.length === 0) {
    console.log('📭 No entries found in database.\n');
    console.log('   Run `deno task seed-kv` to add sample data.\n');
  } else {
    console.log(`📦 Found ${entries.length} entries:\n`);

    for (const entry of entries) {
      const keyStr = entry.key.map((k) => String(k)).join(' → ');
      console.log(`Key:   ${keyStr}`);
      console.log(`Value: ${JSON.stringify(entry.value, null, 2)}`);
      console.log('---');
    }

    console.log(`\n✅ Total entries: ${entries.length}\n`);
  }
} catch (error) {
  console.error('❌ Error inspecting database:', error);
} finally {
  await kv.close();
}
