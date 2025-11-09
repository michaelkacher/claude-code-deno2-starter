import { load } from "$std/dotenv/mod.ts";

// Set default environment to development if not specified
if (!Deno.env.get("DENO_ENV")) {
  Deno.env.set("DENO_ENV", "development");
}

// Load .env (idempotent - safe to call multiple times)
// This ensures env vars are available even if this config is loaded before dev.ts
// Try .env first (user's custom config), then merge defaults from .env.example
try {
  await load({ envPath: "../.env", export: true, allowEmptyValues: true });
} catch {
  // .env doesn't exist, that's fine
}

// Always load .env.example as defaults for any missing values
try {
  await load({ envPath: "../.env.example", export: true, allowEmptyValues: true, defaultsOnly: true });
} catch {
  // No env files found, use system defaults
}

import tailwind from "$fresh/plugins/tailwind.ts";
import { defineConfig } from "$fresh/server.ts";

const isDevelopment = Deno.env.get("DENO_ENV") !== "production";

export default defineConfig({
  port: 3000,
  plugins: [tailwind()],

  // Exclude development-only routes in production
  router: {
    ignoreFilePattern: isDevelopment
      ? undefined
      : /\/(design-system|mockups)/,
  },
});
