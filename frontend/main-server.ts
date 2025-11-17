import { load } from "@std/dotenv";
import { App } from "fresh";

// Load environment variables from .env file  
await load({ export: true, envPath: "../.env" });

// Create the app using the same root as main.ts would use
// In Fresh 2.0, the root should be the directory containing routes/
export const app = new App({ root: import.meta.url }).fsRoutes();

if (import.meta.main) {
  console.log("🚀 Starting Fresh server for WebSocket support on port 8000...");
  console.log("📂 Routes directory:", new URL("./routes", import.meta.url).pathname);
  await app.listen({ port: 8000 });
}
