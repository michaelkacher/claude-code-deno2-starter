import { load } from "@std/dotenv";
import { App } from "fresh";
import { initializeBackgroundServices } from "./startup.ts";
import "./static/styles.css";

// Load environment variables from .env file
await load({ export: true });

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

