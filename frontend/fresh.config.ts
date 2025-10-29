import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";

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
