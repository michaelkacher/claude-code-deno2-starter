#!/usr/bin/env -S deno run -A

/**
 * Development Environment Checker
 * 
 * Validates the development environment before starting the server.
 * Checks for common issues and provides helpful error messages.
 * 
 * Usage:
 *   deno run -A scripts/dev-clean.ts
 *   deno task dev (runs automatically)
 *   deno task dev:skip-check (bypass checks)
 */

console.log("🧹 Checking development environment...\n");

let hasErrors = false;
const warnings: string[] = [];

// 1. Check for processes on common ports
console.log("📡 Checking ports...");
const ports = [3000, 8000];

for (const port of ports) {
  try {
    const listener = Deno.listen({ port });
    listener.close();
    console.log(`  ✅ Port ${port} is available`);
  } catch {
    console.log(`  ⚠️  Port ${port} is in use`);
    warnings.push(`Port ${port} is already in use. Run: deno run -A scripts/kill-ports.ts`);
  }
}

// 2. Check for absolute import paths in API routes
console.log("\n📦 Checking for absolute import paths...");

try {
  const apiRoutesPath = "frontend/routes/api";
  
  async function checkDirectoryImports(dirPath: string) {
    for await (const entry of Deno.readDir(dirPath)) {
      const fullPath = `${dirPath}/${entry.name}`;
      
      if (entry.isDirectory) {
        await checkDirectoryImports(fullPath);
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        const content = await Deno.readTextFile(fullPath);
        
        // Check for absolute imports
        const absoluteImports = [
          /from ["']\/shared\//g,
          /from ["']\/frontend\//g,
        ];
        
        for (const pattern of absoluteImports) {
          if (pattern.test(content)) {
            console.log(`  ❌ ${fullPath}`);
            console.log(`     Contains absolute imports (use relative paths)`);
            hasErrors = true;
          }
        }
        
        // Check for wrong auth import
        if (content.includes('from "/shared/lib/auth.ts"') || 
            content.includes("from '/shared/lib/auth.ts'")) {
          console.log(`  ❌ ${fullPath}`);
          console.log(`     Imports from non-existent /shared/lib/auth.ts`);
          console.log(`     Use: ../../../lib/fresh-helpers.ts`);
          hasErrors = true;
        }
        
        // Check for deprecated test imports
        if (content.includes('$std/assert')) {
          console.log(`  ❌ ${fullPath}`);
          console.log(`     Uses deprecated $std/assert (use @std/assert)`);
          hasErrors = true;
        }
      }
    }
  }
  
  await checkDirectoryImports(apiRoutesPath);
  
  if (!hasErrors) {
    console.log(`  ✅ All imports use correct relative paths`);
  }
} catch (error) {
  if (error instanceof Deno.errors.NotFound) {
    console.log(`  ⚠️  No API routes found (this is OK for new projects)`);
  } else {
    console.log(`  ⚠️  Could not check imports: ${error.message}`);
  }
}

// 3. Check for common file issues
console.log("\n📁 Checking file structure...");

const requiredFiles = [
  "deno.json",
  "frontend/routes/_app.tsx",
  "shared/lib/kv.ts",
];

for (const file of requiredFiles) {
  try {
    await Deno.stat(file);
    console.log(`  ✅ ${file} exists`);
  } catch {
    console.log(`  ❌ ${file} missing`);
    hasErrors = true;
  }
}

// 4. Check for Deno KV database lock
console.log("\n🔒 Checking database...");

try {
  const kvPath = "./daggerheart.db";
  
  try {
    const stat = await Deno.stat(kvPath);
    console.log(`  ✅ Database file exists (${(stat.size / 1024).toFixed(2)} KB)`);
  } catch {
    console.log(`  ℹ️  Database file will be created on first run`);
  }
  
  // Try to open KV to check for locks
  try {
    const kv = await Deno.openKv(kvPath);
    await kv.close();
    console.log(`  ✅ Database is accessible`);
  } catch (error) {
    if (error.message.includes("locked")) {
      console.log(`  ⚠️  Database is locked (another process may be using it)`);
      warnings.push("Database is locked. Stop other dev servers.");
    } else {
      throw error;
    }
  }
} catch (error) {
  console.log(`  ⚠️  Could not check database: ${error.message}`);
}

// 5. Check environment variables
console.log("\n🔐 Checking environment...");

const requiredEnvVars = ["JWT_SECRET"];
const optionalEnvVars = ["DATABASE_PATH", "PORT"];

for (const envVar of requiredEnvVars) {
  const value = Deno.env.get(envVar);
  if (value) {
    console.log(`  ✅ ${envVar} is set`);
  } else {
    console.log(`  ⚠️  ${envVar} not set (will use default)`);
    warnings.push(`Set ${envVar} in .env file for production`);
  }
}

for (const envVar of optionalEnvVars) {
  const value = Deno.env.get(envVar);
  if (value) {
    console.log(`  ℹ️  ${envVar} = ${value}`);
  }
}

// Summary
console.log("\n" + "=".repeat(50));

if (hasErrors) {
  console.log("\n❌ ERRORS FOUND - Fix these before starting server:\n");
  console.log("Common fixes:");
  console.log("  • Replace absolute imports with relative paths");
  console.log("  • Use @std/assert instead of $std/assert");
  console.log("  • Import auth helpers from fresh-helpers.ts\n");
  Deno.exit(1);
}

if (warnings.length > 0) {
  console.log("\n⚠️  WARNINGS (non-blocking):\n");
  warnings.forEach((warning, i) => {
    console.log(`  ${i + 1}. ${warning}`);
  });
  console.log();
}

if (!hasErrors && warnings.length === 0) {
  console.log("\n✅ Environment is clean - ready to start server!");
} else if (!hasErrors) {
  console.log("\n✅ Environment is OK - starting with warnings");
}

console.log("=".repeat(50) + "\n");

Deno.exit(0);
