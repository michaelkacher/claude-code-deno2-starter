import { load } from "@std/dotenv";
import { App } from "fresh";
import { getHmacKey } from "./lib/jwt.ts";
import { getKv } from "./lib/kv.ts";
import { initializeBackgroundServices } from "./startup.ts";

console.time("⏱️  Total startup time");
console.time("  - Load .env");
// Load environment variables from .env file
await load({ export: true });
console.timeEnd("  - Load .env");

console.time("  - Pre-initialize resources");
// Pre-initialize critical resources in parallel for faster startup
await Promise.all([
  // Pre-initialize KV connection to avoid delay on first request
  getKv().then(() => console.log("    ✓ KV connection pre-initialized")),
  
  // Pre-initialize JWT HMAC key to avoid crypto overhead on first auth request
  getHmacKey().then(() => console.log("    ✓ JWT HMAC key pre-initialized")),
]);
console.timeEnd("  - Pre-initialize resources");

console.time("  - Create Fresh app");
export const app = new App().fsRoutes();
console.timeEnd("  - Create Fresh app");

if (import.meta.main) {
  // Start background services asynchronously (non-blocking)
  // The server will start immediately while background services initialize
  initializeBackgroundServices().catch((error) => {
    console.error("⚠️  Background services failed to initialize:", error);
    console.error("   The server is running, but background jobs may not work correctly.");
  });

  console.time("  - Start listening");
  await app.listen();
  console.timeEnd("  - Start listening");
  console.timeEnd("⏱️  Total startup time");
}

