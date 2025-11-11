/**
 * Validate Import Paths Script
 * 
 * Checks that all import paths in frontend/routes/ resolve correctly.
 * Run with: deno run --allow-read scripts/validate-import-paths.ts
 */

import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { dirname, join, relative } from "https://deno.land/std@0.208.0/path/mod.ts";

interface ImportIssue {
  file: string;
  line: number;
  import: string;
  issue: string;
}

const issues: ImportIssue[] = [];

// Walk through all TypeScript files in frontend/routes
for await (const entry of walk("frontend/routes", {
  exts: [".ts", ".tsx"],
  includeDirs: false,
})) {
  const content = await Deno.readTextFile(entry.path);
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    // Match import statements with relative paths
    const importMatch = line.match(/import.*from\s+["'](\..*)["']/);
    if (!importMatch) return;

    const importPath = importMatch[1];
    
    // Skip non-relative imports
    if (!importPath.startsWith(".")) return;

    // Resolve the import path
    const fileDir = dirname(entry.path);
    const resolvedPath = join(fileDir, importPath);

    // Check if file exists
    try {
      Deno.statSync(resolvedPath);
    } catch {
      issues.push({
        file: entry.path,
        line: index + 1,
        import: importPath,
        issue: `Cannot resolve: ${importPath}`,
      });
      return;
    }

    // Additional validation: check for common mistakes
    // 1. Check if importing from shared/ but using wrong depth
    if (importPath.includes("shared/")) {
      const relativeFromFrontend = relative("frontend", entry.path);
      const depth = relativeFromFrontend.split(/[\/\\]/).length - 1; // -1 for filename
      const expectedLevels = depth + 1; // +1 to get out of frontend/ to workspace root
      const actualLevels = (importPath.match(/\.\.\//g) || []).length;

      if (actualLevels !== expectedLevels) {
        issues.push({
          file: entry.path,
          line: index + 1,
          import: importPath,
          issue: `Wrong depth for shared/ import. Expected ${expectedLevels} "../" but found ${actualLevels}`,
        });
      }
    }

    // 2. Check if importing from frontend/lib/ but using wrong depth
    if (importPath.includes("lib/") && !importPath.includes("shared/lib/")) {
      const relativeFromFrontend = relative("frontend", entry.path);
      const depth = relativeFromFrontend.split(/[\/\\]/).length - 1;
      const expectedLevels = depth; // Same depth to reach frontend/lib
      const actualLevels = (importPath.match(/\.\.\//g) || []).length;

      if (actualLevels !== expectedLevels) {
        issues.push({
          file: entry.path,
          line: index + 1,
          import: importPath,
          issue: `Wrong depth for lib/ import. Expected ${expectedLevels} "../" but found ${actualLevels}`,
        });
      }
    }

    // 3. Check for non-existent common modules
    const nonExistentModules = [
      { pattern: /lib\/types\.ts/, correct: "lib/fresh-helpers.ts" },
      { pattern: /lib\/auth\.ts/, correct: "lib/fresh-helpers.ts" },
      { pattern: /lib\/error-handler\.ts/, correct: "lib/fresh-helpers.ts" },
      { pattern: /shared\/lib\/db\.ts/, correct: "shared/lib/kv.ts" },
    ];

    for (const { pattern, correct } of nonExistentModules) {
      if (pattern.test(importPath)) {
        issues.push({
          file: entry.path,
          line: index + 1,
          import: importPath,
          issue: `Module does not exist. Use "${correct}" instead`,
        });
      }
    }
  });
}

// Report results
if (issues.length === 0) {
  console.log("✅ All import paths are valid!");
} else {
  console.log(`❌ Found ${issues.length} import path issue(s):\n`);
  issues.forEach((issue) => {
    console.log(`File: ${issue.file}:${issue.line}`);
    console.log(`  Import: ${issue.import}`);
    console.log(`  Issue: ${issue.issue}\n`);
  });
  Deno.exit(1);
}
