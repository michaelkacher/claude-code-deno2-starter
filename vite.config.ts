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
    // Pre-transform frequently used dependencies
    warmup: {
      clientFiles: [],
    },
    // File system watcher optimization
    watch: {
      // Ignore large directories for better performance
      ignored: ['**/node_modules/**', '**/.git/**', '**/data/**', '**/coverage/**'],
    },
  },
  ssr: {
    // Let Deno handle these imports
    noExternal: false,
  },
  optimizeDeps: {
    // Preact should be excluded to avoid double-bundling
    exclude: [
      "preact",
      "preact/debug",
      "preact/jsx-runtime",
      "preact/jsx-dev-runtime",
      "preact/hooks",
      "preact/signals",
      "preact/signals-core",
    ],
    // Force dependency pre-bundling for faster subsequent loads
    force: false, // Only rebuild when dependencies change
  },
  build: {
    // Enable module preload for faster navigation
    modulePreload: {
      polyfill: true,
    },
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'preact-vendor': ['preact', '@preact/signals'],
        },
      },
    },
  },
  // Cache configuration - maximize persistence
  cacheDir: '.vite',
});
