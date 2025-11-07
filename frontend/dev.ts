#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";

import { load } from "$std/dotenv/mod.ts";

// Load .env from parent directory (project root)
await load({ envPath: "../.env", export: true });

// Verify critical env vars are loaded
console.log("🔧 [Startup] JWT_SECRET loaded:", Deno.env.get("JWT_SECRET") ? "✅ Yes" : "❌ No");
console.log("🔧 [Startup] DENO_ENV:", Deno.env.get("DENO_ENV"));

await dev(import.meta.url, "./main.ts", config);
