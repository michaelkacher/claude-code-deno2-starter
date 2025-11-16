import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    fresh(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "preact/debug": "preact/debug",
      "preact/jsx-runtime": "preact/jsx-runtime",
      "preact/jsx-dev-runtime": "preact/jsx-dev-runtime",
      "preact/hooks": "preact/hooks",
      "preact": "preact",
    },
  },
  ssr: {
    noExternal: ["preact", "@preact/signals", "@preact/signals-core"],
  },
});
