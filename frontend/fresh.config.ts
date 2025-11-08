import { load } from "$std/dotenv/mod.ts";

// Load .env (idempotent - safe to call multiple times)
// This ensures env vars are available even if this config is loaded before dev.ts
await load({ envPath: "../.env", export: true, allowEmptyValues: true });

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
