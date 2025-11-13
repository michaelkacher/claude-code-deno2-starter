/**
 * Template Validation Utility
 * Validates generated code against project standards and patterns
 */

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";

export interface ValidationRule {
  name: string;
  description: string;
  check: (content: string, filePath: string) => Promise<ValidationResult>;
}

export interface ValidationResult {
  passed: boolean;
  message?: string;
  suggestions?: string[];
}

export interface ValidationReport {
  filePath: string;
  passed: boolean;
  errors: Array<{ rule: string; message: string }>;
  warnings: Array<{ rule: string; message: string }>;
  suggestions: Array<{ rule: string; suggestions: string[] }>;
}

/**
 * Standard validation rules for generated code
 */
export const VALIDATION_RULES: ValidationRule[] = [
  {
    name: "typescript-strict",
    description: "Ensures TypeScript strict mode compliance",
    check: async (content: string) => {
      const issues: string[] = [];
      
      // Check for any type usage
      if (content.includes(": any")) {
        issues.push("Found 'any' type usage - use specific types");
      }
      
      // Check for non-null assertions
      if (content.includes("!.")) {
        issues.push("Found non-null assertion operator - add proper null checks");
      }
      
      return {
        passed: issues.length === 0,
        message: issues.join("; "),
        suggestions: issues.length > 0 ? [
          "Use specific types instead of 'any'",
          "Add proper null/undefined checks",
        ] : [],
      };
    },
  },
  {
    name: "import-paths",
    description: "Validates import path conventions",
    check: async (content: string, filePath: string) => {
      const issues: string[] = [];
      const suggestions: string[] = [];
      
      // Check for absolute imports in relative context
      if (content.includes('from "shared/') && filePath.includes("frontend/")) {
        issues.push("Use relative imports from frontend to shared");
        suggestions.push("Replace 'shared/' with '../../../shared/' or similar");
      }
      
      // Check for .ts extension in imports
      const importMatches = content.matchAll(/from ["']([^"']+)["']/g);
      for (const match of importMatches) {
        const importPath = match[1];
        if (importPath.startsWith(".") && !importPath.endsWith(".ts") && !importPath.endsWith(".tsx")) {
          issues.push(`Import missing .ts extension: ${importPath}`);
          suggestions.push("Add .ts or .tsx extension to relative imports");
        }
      }
      
      return {
        passed: issues.length === 0,
        message: issues.join("; "),
        suggestions,
      };
    },
  },
  {
    name: "repository-pattern",
    description: "Validates repository implementation pattern",
    check: async (content: string, filePath: string) => {
      if (!filePath.includes("repository")) {
        return { passed: true };
      }
      
      const issues: string[] = [];
      const suggestions: string[] = [];
      
      // Check for BaseRepository extension
      if (!content.includes("extends BaseRepository")) {
        issues.push("Repository should extend BaseRepository");
        suggestions.push("Add 'extends BaseRepository<YourEntity>'");
      }
      
      // Check for proper constructor
      if (content.includes("extends BaseRepository")) {
        if (!content.includes("constructor(options?: { kv?: Deno.Kv })")) {
          issues.push("Repository constructor should use options pattern");
          suggestions.push('Use: constructor(options?: { kv?: Deno.Kv }) { super("entity_name", options); }');
        }
      }
      
      return {
        passed: issues.length === 0,
        message: issues.join("; "),
        suggestions,
      };
    },
  },
  {
    name: "error-handling",
    description: "Validates proper error handling",
    check: async (content: string) => {
      const issues: string[] = [];
      const suggestions: string[] = [];
      
      // Check for try-catch in async functions
      const asyncFunctions = content.match(/async\s+\w+\([^)]*\)\s*{[^}]+}/g) || [];
      for (const func of asyncFunctions) {
        if (!func.includes("try") && !func.includes("catch")) {
          issues.push("Async function missing try-catch block");
          suggestions.push("Add try-catch for error handling in async functions");
          break;
        }
      }
      
      // Check for custom error types
      if (content.includes("throw new Error(")) {
        suggestions.push("Consider using custom error types (e.g., ValidationError, NotFoundError)");
      }
      
      return {
        passed: issues.length === 0,
        message: issues.join("; "),
        suggestions,
      };
    },
  },
  {
    name: "test-coverage",
    description: "Checks for corresponding test file",
    check: async (content: string, filePath: string) => {
      if (filePath.includes(".test.ts") || filePath.includes("test-setup")) {
        return { passed: true };
      }
      
      // Determine expected test path
      let testPath = "";
      if (filePath.includes("shared/services/")) {
        testPath = filePath.replace("shared/services/", "tests/unit/services/").replace(".ts", ".test.ts");
      } else if (filePath.includes("shared/repositories/")) {
        testPath = filePath.replace("shared/repositories/", "tests/unit/repositories/").replace(".ts", ".test.ts");
      } else if (filePath.includes("frontend/routes/api/")) {
        testPath = filePath.replace("frontend/routes/api/", "tests/unit/api/").replace(".ts", ".test.ts");
      }
      
      if (testPath) {
        const testExists = await exists(testPath);
        return {
          passed: testExists,
          message: testExists ? "" : `Missing test file: ${testPath}`,
          suggestions: testExists ? [] : [
            `Create test file at ${testPath}`,
            "Use test templates from tests/templates/",
          ],
        };
      }
      
      return { passed: true };
    },
  },
  {
    name: "documentation",
    description: "Validates JSDoc and inline documentation",
    check: async (content: string) => {
      const issues: string[] = [];
      const suggestions: string[] = [];
      
      // Check for exported functions/classes without JSDoc
      const exports = content.matchAll(/export\s+(class|function|interface|type)\s+(\w+)/g);
      for (const match of exports) {
        const name = match[2];
        const position = match.index || 0;
        
        // Look for JSDoc comment before export
        const beforeExport = content.substring(Math.max(0, position - 200), position);
        if (!beforeExport.includes("/**")) {
          issues.push(`Missing JSDoc for exported ${match[1]}: ${name}`);
          suggestions.push(`Add JSDoc comment for ${name}`);
        }
      }
      
      return {
        passed: issues.length === 0,
        message: issues.join("; "),
        suggestions,
      };
    },
  },
];

/**
 * Validates a file against all rules
 */
export async function validateFile(filePath: string, rules: ValidationRule[] = VALIDATION_RULES): Promise<ValidationReport> {
  const content = await Deno.readTextFile(filePath);
  const errors: ValidationReport["errors"] = [];
  const warnings: ValidationReport["warnings"] = [];
  const suggestions: ValidationReport["suggestions"] = [];
  
  for (const rule of rules) {
    const result = await rule.check(content, filePath);
    
    if (!result.passed) {
      if (result.message) {
        errors.push({ rule: rule.name, message: result.message });
      }
    }
    
    if (result.suggestions && result.suggestions.length > 0) {
      suggestions.push({ rule: rule.name, suggestions: result.suggestions });
    }
  }
  
  return {
    filePath,
    passed: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

/**
 * Validates multiple files
 */
export async function validateFiles(filePaths: string[], rules?: ValidationRule[]): Promise<ValidationReport[]> {
  const reports = await Promise.all(
    filePaths.map((path) => validateFile(path, rules))
  );
  return reports;
}

/**
 * Validates all files in a feature directory
 */
export async function validateFeature(featureName: string): Promise<ValidationReport[]> {
  const reports: ValidationReport[] = [];
  const featureDir = `features/proposed/${featureName}`;
  
  // Check if feature exists
  if (!(await exists(featureDir))) {
    throw new Error(`Feature not found: ${featureName}`);
  }
  
  // Collect all TypeScript files
  const filesToValidate: string[] = [];
  
  // Check repositories
  const repoDir = "shared/repositories";
  for await (const entry of Deno.readDir(repoDir)) {
    if (entry.name.includes(featureName) && entry.name.endsWith(".ts")) {
      filesToValidate.push(`${repoDir}/${entry.name}`);
    }
  }
  
  // Check services
  const serviceDir = "shared/services";
  for await (const entry of Deno.readDir(serviceDir)) {
    if (entry.name.includes(featureName) && entry.name.endsWith(".ts")) {
      filesToValidate.push(`${serviceDir}/${entry.name}`);
    }
  }
  
  // Check API routes
  const apiDir = "frontend/routes/api";
  if (await exists(apiDir)) {
    for await (const entry of Deno.readDir(apiDir)) {
      if (entry.isDirectory && entry.name.includes(featureName)) {
        const subDir = `${apiDir}/${entry.name}`;
        for await (const file of Deno.readDir(subDir)) {
          if (file.name.endsWith(".ts")) {
            filesToValidate.push(`${subDir}/${file.name}`);
          }
        }
      }
    }
  }
  
  // Validate all files
  for (const file of filesToValidate) {
    const report = await validateFile(file);
    reports.push(report);
  }
  
  return reports;
}

/**
 * Prints validation report to console
 */
export function printReport(report: ValidationReport): void {
  console.log(`\n📄 ${report.filePath}`);
  
  if (report.passed) {
    console.log("  ✅ All checks passed");
  } else {
    console.log("  ❌ Validation failed");
  }
  
  if (report.errors.length > 0) {
    console.log("\n  Errors:");
    for (const error of report.errors) {
      console.log(`    ❌ [${error.rule}] ${error.message}`);
    }
  }
  
  if (report.warnings.length > 0) {
    console.log("\n  Warnings:");
    for (const warning of report.warnings) {
      console.log(`    ⚠️  [${warning.rule}] ${warning.message}`);
    }
  }
  
  if (report.suggestions.length > 0) {
    console.log("\n  Suggestions:");
    for (const suggestion of report.suggestions) {
      console.log(`    💡 [${suggestion.rule}]`);
      for (const s of suggestion.suggestions) {
        console.log(`       - ${s}`);
      }
    }
  }
}

// CLI interface
if (import.meta.main) {
  const args = parse(Deno.args, {
    string: ["file", "feature"],
    boolean: ["help"],
    alias: { f: "file", F: "feature", h: "help" },
  });
  
  if (args.help) {
    console.log(`
Template Validation Utility

Usage:
  deno run --allow-read scripts/validate-templates.ts [options]

Options:
  -f, --file <path>       Validate a single file
  -F, --feature <name>    Validate all files in a feature
  -h, --help              Show this help

Examples:
  # Validate a single file
  deno run --allow-read scripts/validate-templates.ts -f shared/services/my-service.ts

  # Validate all files in a feature
  deno run --allow-read scripts/validate-templates.ts -F ai-task-dashboard
`);
    Deno.exit(0);
  }
  
  if (args.file) {
    console.log(`🔍 Validating file: ${args.file}`);
    const report = await validateFile(args.file);
    printReport(report);
    Deno.exit(report.passed ? 0 : 1);
  } else if (args.feature) {
    console.log(`🔍 Validating feature: ${args.feature}`);
    const reports = await validateFeature(args.feature);
    
    let allPassed = true;
    for (const report of reports) {
      printReport(report);
      if (!report.passed) {
        allPassed = false;
      }
    }
    
    console.log(`\n📊 Summary: ${reports.filter(r => r.passed).length}/${reports.length} files passed`);
    Deno.exit(allPassed ? 0 : 1);
  } else {
    console.error("❌ Error: Either --file or --feature is required");
    console.error("Run with --help for usage information");
    Deno.exit(1);
  }
}
