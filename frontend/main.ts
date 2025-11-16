import { load } from "@std/dotenv";
import { App } from "fresh";
import "./static/styles.css";

// Load environment variables from .env file
await load({ export: true, envPath: "../.env" });

export const app = new App({ root: import.meta.url }).fsRoutes();

if (import.meta.main) {
  await app.listen();
}
