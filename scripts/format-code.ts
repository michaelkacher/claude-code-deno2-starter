/**
 * Code Formatter Integration
 * Auto-formats generated code according to project standards
 */

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";

export interface FormatOptions {
  /** Use tabs instead of spaces */
  useTabs?: boolean;
  /** Number of spaces per indentation level */
  indentWidth?: number;
  /** Maximum line width */
  lineWidth?: number;
  /** Use single quotes instead of double quotes */
  singleQuote?: boolean;
  /** Use semicolons */
  semiColons?: boolean;
  /** Prose wrap setting */
  proseWrap?: "always" | "never" | "preserve";
}

export interface FormatResult {
  filePath: string;
  formatted: boolean;
  changes?: number;
  error?: string;
}

/**
 * Loads format options from deno.json
 */
export async function loadFormatOptions(): Promise<FormatOptions> {
  const defaultOptions: FormatOptions = {
    useTabs: false,
    indentWidth: 2,
    lineWidth: 100,
    singleQuote: false,
    semiColons: true,
    proseWrap: "preserve",
  };
  
  const denoJsonPath = "deno.json";
  if (await exists(denoJsonPath)) {
    try {
      const content = await Deno.readTextFile(denoJsonPath);
      const config = JSON.parse(content);
      
      if (config.fmt) {
        return {
          useTabs: config.fmt.useTabs ?? defaultOptions.useTabs,
          indentWidth: config.fmt.indentWidth ?? defaultOptions.indentWidth,
          lineWidth: config.fmt.lineWidth ?? defaultOptions.lineWidth,
          singleQuote: config.fmt.singleQuote ?? defaultOptions.singleQuote,
          semiColons: config.fmt.semiColons ?? defaultOptions.semiColons,
          proseWrap: config.fmt.proseWrap ?? defaultOptions.proseWrap,
        };
      }
    } catch {
      // Fall through to default options
    }
  }
  
  return defaultOptions;
}

/**
 * Formats a file using Deno's built-in formatter
 */
export async function formatFile(filePath: string, options?: FormatOptions): Promise<FormatResult> {
  try {
    // Check if file exists
    if (!(await exists(filePath))) {
      return {
        filePath,
        formatted: false,
        error: "File not found",
      };
    }
    
    // Read original content
    const originalContent = await Deno.readTextFile(filePath);
    
    // Build format command
    const args = ["fmt"];
    
    if (options?.useTabs) {
      args.push("--use-tabs");
    }
    if (options?.indentWidth) {
      args.push(`--indent-width=${options.indentWidth}`);
    }
    if (options?.lineWidth) {
      args.push(`--line-width=${options.lineWidth}`);
    }
    if (options?.singleQuote) {
      args.push("--single-quote");
    }
    if (options?.semiColons === false) {
      args.push("--no-semicolons");
    }
    if (options?.proseWrap) {
      args.push(`--prose-wrap=${options.proseWrap}`);
    }
    
    args.push(filePath);
    
    // Run formatter
    const command = new Deno.Command("deno", {
      args,
      stdout: "piped",
      stderr: "piped",
    });
    
    const { success, stdout, stderr } = await command.output();
    
    if (!success) {
      const errorMsg = new TextDecoder().decode(stderr);
      return {
        filePath,
        formatted: false,
        error: errorMsg,
      };
    }
    
    // Read formatted content
    const formattedContent = await Deno.readTextFile(filePath);
    
    // Count changes (rough estimate)
    const changes = originalContent === formattedContent ? 0 : 1;
    
    return {
      filePath,
      formatted: true,
      changes,
    };
  } catch (error) {
    return {
      filePath,
      formatted: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Formats multiple files
 */
export async function formatFiles(filePaths: string[], options?: FormatOptions): Promise<FormatResult[]> {
  const results = await Promise.all(
    filePaths.map((path) => formatFile(path, options))
  );
  return results;
}

/**
 * Formats all TypeScript files in a directory
 */
export async function formatDirectory(dir: string, options?: FormatOptions): Promise<FormatResult[]> {
  const files: string[] = [];
  
  async function walk(currentDir: string): Promise<void> {
    if (!(await exists(currentDir))) return;
    
    for await (const entry of Deno.readDir(currentDir)) {
      const fullPath = `${currentDir}/${entry.name}`;
      
      if (entry.isDirectory && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        await walk(fullPath);
      } else if (entry.isFile && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return formatFiles(files, options);
}

/**
 * Formats all files in a feature
 */
export async function formatFeature(featureName: string): Promise<FormatResult[]> {
  const results: FormatResult[] = [];
  const options = await loadFormatOptions();
  
  // Format repositories
  const repoDir = "shared/repositories";
  if (await exists(repoDir)) {
    for await (const entry of Deno.readDir(repoDir)) {
      if (entry.name.includes(featureName) && entry.name.endsWith(".ts")) {
        const result = await formatFile(`${repoDir}/${entry.name}`, options);
        results.push(result);
      }
    }
  }
  
  // Format services
  const serviceDir = "shared/services";
  if (await exists(serviceDir)) {
    for await (const entry of Deno.readDir(serviceDir)) {
      if (entry.name.includes(featureName) && entry.name.endsWith(".ts")) {
        const result = await formatFile(`${serviceDir}/${entry.name}`, options);
        results.push(result);
      }
    }
  }
  
  // Format API routes
  const apiDir = "frontend/routes/api";
  if (await exists(apiDir)) {
    for await (const entry of Deno.readDir(apiDir)) {
      if (entry.isDirectory && entry.name.includes(featureName)) {
        const dirResults = await formatDirectory(`${apiDir}/${entry.name}`, options);
        results.push(...dirResults);
      }
    }
  }
  
  // Format tests
  const testDirs = ["tests/unit/services", "tests/unit/repositories", "tests/unit/api"];
  for (const testDir of testDirs) {
    if (await exists(testDir)) {
      for await (const entry of Deno.readDir(testDir)) {
        if (entry.name.includes(featureName) && entry.name.endsWith(".test.ts")) {
          const result = await formatFile(`${testDir}/${entry.name}`, options);
          results.push(result);
        }
      }
    }
  }
  
  return results;
}

/**
 * Prints format results
 */
export function printResults(results: FormatResult[]): void {
  let formatted = 0;
  let errors = 0;
  
  for (const result of results) {
    if (result.formatted) {
      formatted++;
      console.log(`✅ ${result.filePath}`);
    } else {
      errors++;
      console.log(`❌ ${result.filePath}: ${result.error}`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  - Formatted: ${formatted}`);
  console.log(`  - Errors: ${errors}`);
  console.log(`  - Total: ${results.length}`);
}

// CLI interface
if (import.meta.main) {
  const args = parse(Deno.args, {
    string: ["file", "dir", "feature"],
    boolean: ["help", "check"],
    alias: { f: "file", d: "dir", F: "feature", h: "help" },
  });
  
  if (args.help) {
    console.log(`
Code Formatter Integration

Usage:
  deno run --allow-read --allow-write --allow-run scripts/format-code.ts [options]

Options:
  -f, --file <path>       Format a single file
  -d, --dir <path>        Format all files in directory
  -F, --feature <name>    Format all files in a feature
  --check                 Check formatting without writing changes
  -h, --help              Show this help

Examples:
  # Format a single file
  deno run --allow-read --allow-write --allow-run scripts/format-code.ts -f shared/services/my-service.ts

  # Format a directory
  deno run --allow-read --allow-write --allow-run scripts/format-code.ts -d shared/services

  # Format a feature
  deno run --allow-read --allow-write --allow-run scripts/format-code.ts -F ai-task-dashboard

  # Check formatting (dry run)
  deno run --allow-read --allow-run scripts/format-code.ts -d shared --check
`);
    Deno.exit(0);
  }
  
  try {
    const options = await loadFormatOptions();
    let results: FormatResult[] = [];
    
    if (args.file) {
      console.log(`🎨 Formatting file: ${args.file}`);
      const result = await formatFile(args.file, options);
      results = [result];
    } else if (args.dir) {
      console.log(`🎨 Formatting directory: ${args.dir}`);
      results = await formatDirectory(args.dir, options);
    } else if (args.feature) {
      console.log(`🎨 Formatting feature: ${args.feature}`);
      results = await formatFeature(args.feature);
    } else {
      console.error("❌ Error: Specify --file, --dir, or --feature");
      Deno.exit(1);
    }
    
    printResults(results);
    
    const hasErrors = results.some((r) => !r.formatted);
    Deno.exit(hasErrors ? 1 : 0);
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}
