/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { load } from "$std/dotenv/mod.ts";

// Set default environment to development if not specified
if (!Deno.env.get("DENO_ENV")) {
  Deno.env.set("DENO_ENV", "development");
}

// Load .env FIRST - before any other imports that might read env vars
// Try .env first (user's custom config), fall back to .env.example (zero-config defaults)
let envFileLoaded = false;
try {
  await load({ envPath: "../.env", export: true });
  console.log("📄 Loaded environment from .env");
  envFileLoaded = true;
} catch {
  console.log("📄 No .env found, using .env.example for zero-config setup");
}

// Always load .env.example as defaults for any missing values
// This ensures JWT_SECRET and other critical values are available even if .env is incomplete
try {
  await load({ envPath: "../.env.example", export: true, defaultsOnly: true });
  if (envFileLoaded) {
    console.log("📄 Loaded missing defaults from .env.example");
  }
} catch (error) {
  if (!envFileLoaded) {
    console.warn("⚠️  No .env.example found, using system defaults");
  }
}

// Validate security configuration before proceeding
import { validateProductionSecurity } from "../shared/lib/security-validation.ts";
validateProductionSecurity(); // Blocks startup if production has insecure config

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
