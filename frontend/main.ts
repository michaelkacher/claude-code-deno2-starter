/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { load } from "$std/dotenv/mod.ts";

// Load .env from parent directory (project root)
await load({ envPath: "../.env", export: true });

// Initialize background services (job queue, scheduler, workers)
import { initializeBackgroundServices } from "../backend/startup.ts";
await initializeBackgroundServices();

import { start } from "$fresh/server.ts";
import config from "./fresh.config.ts";
import manifest from "./fresh.gen.ts";

await start(manifest, config);
