#!/usr/bin/env -S deno run -A --watch=static/,routes/

import { load } from "$std/dotenv/mod.ts";

// Set default environment to development if not specified
if (!Deno.env.get("DENO_ENV")) {
  Deno.env.set("DENO_ENV", "development");
}

// Port cleanup utilities
const DEV_PORT = 3000;
const isWindows = Deno.build.os === "windows";

async function findProcessOnPort(port: number): Promise<string | null> {
  try {
    if (isWindows) {
      const cmd = new Deno.Command("cmd", {
        args: ["/c", `netstat -ano | findstr :${port}`],
        stdout: "piped",
        stderr: "piped",
      });
      const { stdout } = await cmd.output();
      const output = new TextDecoder().decode(stdout);
      const lines = output.split("\n").filter((line) => line.includes("LISTENING"));
      if (lines.length === 0) return null;
      const match = lines[0].match(/\s+(\d+)\s*$/);
      return match ? match[1] : null;
    } else {
      const cmd = new Deno.Command("lsof", {
        args: ["-ti", `:${port}`],
        stdout: "piped",
        stderr: "piped",
      });
      const { stdout } = await cmd.output();
      const output = new TextDecoder().decode(stdout).trim();
      return output || null;
    }
  } catch {
    return null;
  }
}

async function killProcess(pid: string): Promise<boolean> {
  try {
    if (isWindows) {
      const cmd = new Deno.Command("taskkill", {
        args: ["/F", "/PID", pid],
        stdout: "piped",
        stderr: "piped",
      });
      const { success } = await cmd.output();
      return success;
    } else {
      const cmd = new Deno.Command("kill", {
        args: ["-9", pid],
        stdout: "piped",
        stderr: "piped",
      });
      const { success } = await cmd.output();
      return success;
    }
  } catch {
    return false;
  }
}

async function ensurePortAvailable(port: number, maxRetries = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const pid = await findProcessOnPort(port);
    
    if (!pid) {
      if (attempt > 1) {
        console.log(`✅ Port ${port} is now available`);
      }
      return;
    }

    console.log(`⚠️  Port ${port} is in use by PID ${pid} (attempt ${attempt}/${maxRetries})`);
    console.log(`   Killing process to free the port...`);
    
    const killed = await killProcess(pid);
    if (killed) {
      console.log(`✅ Killed process ${pid}`);
      // Wait a moment for the port to be fully released
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.error(`❌ Failed to kill process ${pid}`);
      if (attempt === maxRetries) {
        throw new Error(`Port ${port} is in use and could not be freed. Try running with administrator privileges.`);
      }
    }
  }
}

// Load .env FIRST - before any other imports that might read env vars
// Try .env first (user's custom config), fall back to .env.example (zero-config defaults)
let envFileLoaded = false;
try {
  await load({ envPath: "../.env", export: true });
  console.log("📄 Loaded environment from .env");
  envFileLoaded = true;
} catch {
  console.log("📄 No .env found, using .env.example for zero-config setup");
}

// Always load .env.example as defaults for any missing values
// This ensures JWT_SECRET and other critical values are available even if .env is incomplete
try {
  await load({ envPath: "../.env.example", export: true, defaultsOnly: true });
  if (envFileLoaded) {
    console.log("📄 Loaded missing defaults from .env.example");
  }
} catch (error) {
  if (!envFileLoaded) {
    console.warn("⚠️  No .env.example found, using system defaults");
  }
}

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";

// Validate security configuration before proceeding
import { validateProductionSecurity } from "../shared/lib/security-validation.ts";
validateProductionSecurity(); // Blocks startup if production has insecure config

// Verify critical env vars are loaded
console.log("🔧 [Startup] JWT_SECRET loaded:", Deno.env.get("JWT_SECRET") ? "✅ Yes" : "❌ No");
console.log("🔧 [Startup] DENO_ENV:", Deno.env.get("DENO_ENV"));

// Ensure port is available before starting server
console.log(`🔍 Checking port ${DEV_PORT}...`);
try {
  await ensurePortAvailable(DEV_PORT);
} catch (error) {
  console.error("❌ Failed to free port:", error.message);
  Deno.exit(1);
}

// Initialize background services (job queue, scheduler, workers)
import { initializeBackgroundServices } from "../shared/startup.ts";
console.log('🔵 [dev.ts] About to call initializeBackgroundServices()...');
try {
  await initializeBackgroundServices();
  console.log('✅ [dev.ts] initializeBackgroundServices() completed successfully');
} catch (error) {
  console.error('❌ [dev.ts] initializeBackgroundServices() failed:', error);
  throw error; // Re-throw to prevent server from starting with broken services
}

await dev(import.meta.url, "./main.ts", config);
