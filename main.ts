import { load } from "@std/dotenv";
import { App } from "fresh";
import { getKv } from "./lib/kv.ts";
import { getHmacKey } from "./lib/jwt.ts";
import { initializeBackgroundServices } from "./startup.ts";
import "./static/styles.css";

// Load environment variables from .env file
await load({ export: true });

// Pre-initialize KV connection to avoid delay on first request
// This warms up the database connection before the server starts accepting requests
await getKv();
console.log("✓ KV connection pre-initialized");

// Pre-initialize JWT HMAC key to avoid crypto overhead on first auth request
// This caches the CryptoKey object used for token verification
await getHmacKey();
console.log("✓ JWT HMAC key pre-initialized");

export const app = new App({ root: import.meta.url }).fsRoutes();

if (import.meta.main) {
  // Start background services asynchronously (non-blocking)
  // The server will start immediately while background services initialize
  initializeBackgroundServices().catch((error) => {
    console.error("⚠️  Background services failed to initialize:", error);
    console.error("   The server is running, but background jobs may not work correctly.");
  });

  await app.listen();
}

