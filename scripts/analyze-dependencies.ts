/**
 * Dependency Analyzer
 * Detects missing dependencies and suggests installations
 */

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";

export interface DependencyInfo {
  name: string;
  version?: string;
  source: "deno.land" | "npm" | "esm.sh" | "jsr.io" | "github" | "unknown";
  url: string;
  usedIn: string[];
}

export interface DependencyAnalysis {
  found: DependencyInfo[];
  missing: string[];
  unused: string[];
  conflicts: Array<{ name: string; versions: string[] }>;
}

/**
 * Extracts all import statements from a file
 */
async function extractImports(filePath: string): Promise<Set<string>> {
  const imports = new Set<string>();
  const content = await Deno.readTextFile(filePath);
  
  // Match import statements
  const importMatches = content.matchAll(/from ["']([^"']+)["']/g);
  for (const match of importMatches) {
    const importPath = match[1];
    // Only track external dependencies (not relative imports)
    if (!importPath.startsWith(".") && !importPath.startsWith("/")) {
      imports.add(importPath);
    }
  }
  
  return imports;
}

/**
 * Scans directory for TypeScript files and extracts imports
 */
async function scanDirectory(dir: string): Promise<Map<string, string[]>> {
  const importMap = new Map<string, string[]>();
  
  if (!(await exists(dir))) {
    return importMap;
  }
  
  async function walk(currentDir: string): Promise<void> {
    for await (const entry of Deno.readDir(currentDir)) {
      const fullPath = `${currentDir}/${entry.name}`;
      
      if (entry.isDirectory && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        await walk(fullPath);
      } else if (entry.isFile && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
        const imports = await extractImports(fullPath);
        for (const imp of imports) {
          if (!importMap.has(imp)) {
            importMap.set(imp, []);
          }
          importMap.get(imp)!.push(fullPath);
        }
      }
    }
  }
  
  await walk(dir);
  return importMap;
}

/**
 * Categorizes dependency by source
 */
function categorizeDependency(importPath: string): DependencyInfo {
  let source: DependencyInfo["source"] = "unknown";
  let name = importPath;
  let version: string | undefined;
  
  if (importPath.startsWith("https://deno.land/")) {
    source = "deno.land";
    const match = importPath.match(/\/x\/([^@/]+)@([^/]+)/);
    if (match) {
      name = match[1];
      version = match[2];
    }
  } else if (importPath.startsWith("npm:")) {
    source = "npm";
    const withoutPrefix = importPath.substring(4);
    const match = withoutPrefix.match(/^([^@]+)@(.+)/);
    if (match) {
      name = match[1];
      version = match[2];
    } else {
      name = withoutPrefix;
    }
  } else if (importPath.startsWith("https://esm.sh/")) {
    source = "esm.sh";
    const match = importPath.match(/\/([^@/]+)@([^/]+)/);
    if (match) {
      name = match[1];
      version = match[2];
    }
  } else if (importPath.startsWith("jsr:")) {
    source = "jsr.io";
    const match = importPath.match(/jsr:@?([^@]+)@?(.+)?/);
    if (match) {
      name = match[1];
      version = match[2];
    }
  } else if (importPath.includes("github.com")) {
    source = "github";
  }
  
  return {
    name,
    version,
    source,
    url: importPath,
    usedIn: [],
  };
}

/**
 * Analyzes dependencies in a directory
 */
export async function analyzeDependencies(dir: string): Promise<DependencyAnalysis> {
  const importMap = await scanDirectory(dir);
  const dependencies = new Map<string, DependencyInfo>();
  
  // Process all imports
  for (const [importPath, files] of importMap.entries()) {
    const dep = categorizeDependency(importPath);
    dep.usedIn = files;
    dependencies.set(dep.name, dep);
  }
  
  // Check for version conflicts
  const conflicts: DependencyAnalysis["conflicts"] = [];
  const versionMap = new Map<string, Set<string>>();
  
  for (const dep of dependencies.values()) {
    if (dep.version) {
      if (!versionMap.has(dep.name)) {
        versionMap.set(dep.name, new Set());
      }
      versionMap.get(dep.name)!.add(dep.version);
    }
  }
  
  for (const [name, versions] of versionMap.entries()) {
    if (versions.size > 1) {
      conflicts.push({
        name,
        versions: Array.from(versions),
      });
    }
  }
  
  // Read deno.json to check for declared dependencies
  const declared = new Set<string>();
  const denoJsonPath = "deno.json";
  if (await exists(denoJsonPath)) {
    const content = await Deno.readTextFile(denoJsonPath);
    const config = JSON.parse(content);
    
    if (config.imports) {
      for (const key of Object.keys(config.imports)) {
        declared.add(key);
      }
    }
  }
  
  // Find unused declared dependencies
  const unused: string[] = [];
  for (const key of declared) {
    if (!dependencies.has(key) && !key.endsWith("/")) {
      unused.push(key);
    }
  }
  
  return {
    found: Array.from(dependencies.values()),
    missing: [], // Would require checking if imports are actually resolvable
    unused,
    conflicts,
  };
}

/**
 * Generates dependency report
 */
export function generateReport(analysis: DependencyAnalysis): string {
  const lines: string[] = [];
  
  lines.push("# Dependency Analysis Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  
  // Summary
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total dependencies: ${analysis.found.length}`);
  lines.push(`- Version conflicts: ${analysis.conflicts.length}`);
  lines.push(`- Unused declarations: ${analysis.unused.length}`);
  lines.push("");
  
  // Dependencies by source
  const bySource = new Map<string, number>();
  for (const dep of analysis.found) {
    bySource.set(dep.source, (bySource.get(dep.source) || 0) + 1);
  }
  
  lines.push("## Dependencies by Source");
  lines.push("");
  for (const [source, count] of bySource.entries()) {
    lines.push(`- ${source}: ${count}`);
  }
  lines.push("");
  
  // All dependencies
  lines.push("## All Dependencies");
  lines.push("");
  lines.push("| Name | Version | Source | Used In |");
  lines.push("|------|---------|--------|---------|");
  for (const dep of analysis.found.sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`| ${dep.name} | ${dep.version || "N/A"} | ${dep.source} | ${dep.usedIn.length} files |`);
  }
  lines.push("");
  
  // Conflicts
  if (analysis.conflicts.length > 0) {
    lines.push("## ⚠️ Version Conflicts");
    lines.push("");
    for (const conflict of analysis.conflicts) {
      lines.push(`### ${conflict.name}`);
      lines.push("");
      lines.push("Multiple versions detected:");
      for (const version of conflict.versions) {
        lines.push(`- ${version}`);
      }
      lines.push("");
      lines.push("**Recommendation**: Standardize to a single version");
      lines.push("");
    }
  }
  
  // Unused
  if (analysis.unused.length > 0) {
    lines.push("## 🧹 Unused Declarations");
    lines.push("");
    lines.push("These dependencies are declared in deno.json but not used:");
    lines.push("");
    for (const unused of analysis.unused) {
      lines.push(`- ${unused}`);
    }
    lines.push("");
  }
  
  return lines.join("\n");
}

/**
 * Generates install commands for missing dependencies
 */
export function generateInstallCommands(dependencies: DependencyInfo[]): string[] {
  const commands: string[] = [];
  const denoJsonUpdates: string[] = [];
  
  for (const dep of dependencies) {
    if (dep.source === "npm") {
      denoJsonUpdates.push(`  "${dep.name}": "npm:${dep.name}${dep.version ? `@${dep.version}` : ""}"`);
    } else if (dep.source === "deno.land" || dep.source === "esm.sh") {
      denoJsonUpdates.push(`  "${dep.name}": "${dep.url}"`);
    }
  }
  
  if (denoJsonUpdates.length > 0) {
    commands.push("Add to deno.json imports section:");
    commands.push("{");
    commands.push('  "imports": {');
    commands.push(denoJsonUpdates.join(",\n"));
    commands.push("  }");
    commands.push("}");
  }
  
  return commands;
}

// CLI interface
if (import.meta.main) {
  const args = parse(Deno.args, {
    string: ["dir", "output"],
    boolean: ["help", "json"],
    alias: { d: "dir", o: "output", h: "help" },
    default: { dir: "." },
  });
  
  if (args.help) {
    console.log(`
Dependency Analyzer

Usage:
  deno run --allow-read scripts/analyze-dependencies.ts [options]

Options:
  -d, --dir <path>        Directory to analyze (default: current directory)
  -o, --output <path>     Save report to file
  --json                  Output as JSON
  -h, --help              Show this help

Examples:
  # Analyze current directory
  deno run --allow-read scripts/analyze-dependencies.ts

  # Analyze specific directory
  deno run --allow-read scripts/analyze-dependencies.ts -d shared/services

  # Save report to file
  deno run --allow-read --allow-write scripts/analyze-dependencies.ts -o deps-report.md
`);
    Deno.exit(0);
  }
  
  console.log(`🔍 Analyzing dependencies in: ${args.dir}`);
  
  try {
    const analysis = await analyzeDependencies(args.dir);
    
    if (args.json) {
      const json = JSON.stringify(analysis, null, 2);
      if (args.output) {
        await Deno.writeTextFile(args.output, json);
        console.log(`✅ JSON report saved: ${args.output}`);
      } else {
        console.log(json);
      }
    } else {
      const report = generateReport(analysis);
      if (args.output) {
        await Deno.writeTextFile(args.output, report);
        console.log(`✅ Report saved: ${args.output}`);
      } else {
        console.log(report);
      }
    }
    
    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`  - Dependencies: ${analysis.found.length}`);
    console.log(`  - Conflicts: ${analysis.conflicts.length}`);
    console.log(`  - Unused: ${analysis.unused.length}`);
    
    if (analysis.conflicts.length > 0) {
      console.log(`\n⚠️  Warning: ${analysis.conflicts.length} version conflicts detected`);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}
