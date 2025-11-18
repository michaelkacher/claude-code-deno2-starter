import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// /**
//  * Auto-install npm dependencies if node_modules is missing
//  * This helps prevent "Cannot find module 'preact/debug'" errors on fresh clones
//  */
async function ensureDependenciesInstalled() {
  try {
    // Check if node_modules exists
    const nodeModulesExists = await Deno.stat("node_modules")
      .then(() => true)
      .catch(() => false);

    if (!nodeModulesExists) {
      console.log("📦 node_modules not found. Installing dependencies...");
      console.log("   Running: deno install --allow-scripts");
      
      const command = new Deno.Command("deno", {
        args: ["install", "--allow-scripts"],
        stdout: "inherit",
        stderr: "inherit",
      });

      const { code } = await command.output();
      
      if (code === 0) {
        console.log("✅ Dependencies installed successfully!\n");
      } else {
        console.error("❌ Failed to install dependencies. Please run manually:");
        console.error("   deno task install\n");
        Deno.exit(1);
      }
    }
  } catch (error) {
    console.error("Error checking dependencies:", error);
  }
}

// Run dependency check before starting Vite (dev mode only)
if (Deno.env.get("DENO_ENV") !== "production") {
  await ensureDependenciesInstalled();
}

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
  ssr: {
    // Let Deno handle these imports
    noExternal: false,
  },
  optimizeDeps: {
    // Include Preact dependencies for faster dev server start
    exclude: [
      "preact",
      "preact/debug",
      "preact/jsx-runtime",
      "preact/jsx-dev-runtime",
      "preact/hooks",
      "preact/signals",
      "preact/signals-core",
    ],
  },
  // Reduce filesystem overhead
  cacheDir: '.vite',
});
