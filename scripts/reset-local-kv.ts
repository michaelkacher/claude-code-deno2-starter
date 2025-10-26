#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Reset Local Deno KV Database
 *
 * This script deletes the local KV database file, allowing you to start fresh.
 * Useful during development when you want to clear all data.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/reset-local-kv.ts
 *   or
 *   deno task reset-kv (if added to deno.json tasks)
 */

const DB_PATHS = [
  './data/local.db',
  './data/dev.db',
  './.deno_kv_store',
];

console.log('🗑️  Resetting local Deno KV database...\n');

let deleted = false;

for (const path of DB_PATHS) {
  try {
    const stat = await Deno.stat(path);

    if (stat.isDirectory) {
      // Remove directory and contents
      await Deno.remove(path, { recursive: true });
      console.log(`✅ Removed directory: ${path}`);
      deleted = true;
    } else {
      // Remove file
      await Deno.remove(path);
      console.log(`✅ Removed file: ${path}`);
      deleted = true;
    }

    // Also try to remove SQLite journal files
    try {
      await Deno.remove(`${path}-shm`);
      await Deno.remove(`${path}-wal`);
    } catch {
      // Ignore if journal files don't exist
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // File/directory doesn't exist, skip
      continue;
    } else {
      console.error(`❌ Error removing ${path}:`, error);
    }
  }
}

if (deleted) {
  console.log('\n✅ Local KV database reset successfully!');
  console.log('   A new empty database will be created on next startup.\n');
} else {
  console.log('ℹ️  No database files found to reset.\n');
}
