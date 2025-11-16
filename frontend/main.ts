import { App } from "fresh";
import "./static/styles.css";

export const app = new App({ root: import.meta.url }).fsRoutes();

if (import.meta.main) {
  await app.listen();
}
