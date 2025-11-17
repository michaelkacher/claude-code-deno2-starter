import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    fresh({
      // Fresh plugin should handle WebSocket routes during dev
      dev: true,
    }),
    tailwindcss(),
  ],
  server: {
    hmr: {
      clientPort: 5173,
    },
  },
});
