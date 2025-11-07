#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";

import { load } from "$std/dotenv/mod.ts";

// Load .env from parent directory (project root)
await load({ envPath: "../.env", export: true });

// Verify critical env vars are loaded
console.log("🔧 [Startup] JWT_SECRET loaded:", Deno.env.get("JWT_SECRET") ? "✅ Yes" : "❌ No");
console.log("🔧 [Startup] DENO_ENV:", Deno.env.get("DENO_ENV"));

// Initialize background services (job queue, scheduler, workers)
import { initializeBackgroundServices } from "../backend/startup.ts";
console.log('🔵 [dev.ts] About to call initializeBackgroundServices()...');
try {
  await initializeBackgroundServices();
  console.log('✅ [dev.ts] initializeBackgroundServices() completed successfully');
} catch (error) {
  console.error('❌ [dev.ts] initializeBackgroundServices() failed:', error);
  throw error; // Re-throw to prevent server from starting with broken services
}

await dev(import.meta.url, "./main.ts", config);
