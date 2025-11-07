/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { load } from "$std/dotenv/mod.ts";

// Load .env FIRST - before any other imports that might read env vars
await load({ envPath: "../.env", export: true });

// Initialize background services (job queue, scheduler, workers)
import { initializeBackgroundServices } from "../shared/startup.ts";
console.log('🔵 [main.ts] About to call initializeBackgroundServices()...');
try {
  await initializeBackgroundServices();
  console.log('✅ [main.ts] initializeBackgroundServices() completed successfully');
} catch (error) {
  console.error('❌ [main.ts] initializeBackgroundServices() failed:', error);
  throw error; // Re-throw to prevent server from starting with broken services
}

import { start } from "$fresh/server.ts";
import config from "./fresh.config.ts";
import manifest from "./fresh.gen.ts";

await start(manifest, config);
