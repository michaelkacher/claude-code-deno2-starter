/**
 * Feature Documentation Generator
 * Auto-generates comprehensive documentation for features
 */

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/ensure_dir.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";

export interface FeatureMetadata {
  name: string;
  displayName: string;
  description: string;
  version: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  parameters?: Array<{ name: string; type: string; required: boolean; description: string }>;
  responses?: Array<{ status: number; description: string }>;
}

export interface DataModel {
  name: string;
  fields: Array<{ name: string; type: string; required: boolean; description: string }>;
  relationships?: string[];
}

export interface FeatureDocumentation {
  metadata: FeatureMetadata;
  overview: string;
  apiEndpoints: APIEndpoint[];
  dataModels: DataModel[];
  dependencies: string[];
  setup: string[];
  usage: string[];
  testing: string;
}

/**
 * Extracts API endpoints from route files
 */
async function extractAPIEndpoints(featureName: string): Promise<APIEndpoint[]> {
  const endpoints: APIEndpoint[] = [];
  const apiDir = `frontend/routes/api`;
  
  if (!(await exists(apiDir))) {
    return endpoints;
  }
  
  // Find feature-related API directories
  for await (const entry of Deno.readDir(apiDir)) {
    if (entry.isDirectory) {
      const dirPath = `${apiDir}/${entry.name}`;
      
      // Check if directory contains feature files
      for await (const file of Deno.readDir(dirPath)) {
        if (file.name.endsWith(".ts") && !file.name.endsWith(".test.ts")) {
          const filePath = `${dirPath}/${file.name}`;
          const content = await Deno.readTextFile(filePath);
          
          // Extract handler methods
          const handlers = ["GET", "POST", "PUT", "PATCH", "DELETE"];
          for (const method of handlers) {
            if (content.includes(`export const ${method}`)) {
              const endpoint = file.name.replace(".ts", "");
              const path = `/api/${entry.name}${endpoint !== "index" ? `/${endpoint}` : ""}`;
              
              // Extract description from comments
              const commentMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
              const description = commentMatch ? commentMatch[1] : `${method} endpoint`;
              
              // Check for auth requirement
              const auth = content.includes("requireAuth") || content.includes("validateSession");
              
              endpoints.push({
                method,
                path,
                description,
                auth,
              });
            }
          }
        }
      }
    }
  }
  
  return endpoints;
}

/**
 * Extracts data models from repository files
 */
async function extractDataModels(featureName: string): Promise<DataModel[]> {
  const models: DataModel[] = [];
  const typesDir = "shared/types";
  
  if (!(await exists(typesDir))) {
    return models;
  }
  
  // Look for type definition files
  for await (const entry of Deno.readDir(typesDir)) {
    if (entry.name.includes(featureName) && entry.name.endsWith(".ts")) {
      const content = await Deno.readTextFile(`${typesDir}/${entry.name}`);
      
      // Extract interface definitions
      const interfaceMatches = content.matchAll(/export interface (\w+)\s*{([^}]+)}/g);
      for (const match of interfaceMatches) {
        const name = match[1];
        const body = match[2];
        
        // Parse fields
        const fields: DataModel["fields"] = [];
        const fieldMatches = body.matchAll(/(\w+)(\?)?:\s*([^;]+);/g);
        for (const fieldMatch of fieldMatches) {
          fields.push({
            name: fieldMatch[1],
            type: fieldMatch[3].trim(),
            required: !fieldMatch[2],
            description: "",
          });
        }
        
        models.push({ name, fields });
      }
    }
  }
  
  return models;
}

/**
 * Extracts dependencies from import statements
 */
async function extractDependencies(featureName: string): Promise<string[]> {
  const dependencies = new Set<string>();
  const dirs = ["shared/services", "shared/repositories", "frontend/routes/api"];
  
  for (const dir of dirs) {
    if (!(await exists(dir))) continue;
    
    for await (const entry of Deno.readDir(dir)) {
      if (entry.name.includes(featureName) && entry.name.endsWith(".ts")) {
        const content = await Deno.readTextFile(`${dir}/${entry.name}`);
        
        // Extract external imports (non-relative)
        const importMatches = content.matchAll(/from ["']([^."'][^"']+)["']/g);
        for (const match of importMatches) {
          const importPath = match[1];
          if (importPath.startsWith("https://") || importPath.startsWith("npm:")) {
            dependencies.add(importPath);
          }
        }
      }
    }
  }
  
  return Array.from(dependencies);
}

/**
 * Generates feature documentation
 */
export async function generateFeatureDocumentation(featureName: string): Promise<FeatureDocumentation> {
  const featureDir = `features/proposed/${featureName}`;
  
  if (!(await exists(featureDir))) {
    throw new Error(`Feature not found: ${featureName}`);
  }
  
  // Read requirements if available
  let overview = "";
  const reqFile = `${featureDir}/requirements.md`;
  if (await exists(reqFile)) {
    const content = await Deno.readTextFile(reqFile);
    const overviewMatch = content.match(/## Overview\s+([\s\S]+?)(?=##|$)/);
    overview = overviewMatch ? overviewMatch[1].trim() : "No overview available.";
  }
  
  // Extract metadata
  const metadata: FeatureMetadata = {
    name: featureName,
    displayName: featureName.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    description: overview.split("\n")[0] || "Feature description",
    version: "1.0.0",
    createdAt: new Date().toISOString().split("T")[0],
    updatedAt: new Date().toISOString().split("T")[0],
  };
  
  // Extract components
  const apiEndpoints = await extractAPIEndpoints(featureName);
  const dataModels = await extractDataModels(featureName);
  const dependencies = await extractDependencies(featureName);
  
  return {
    metadata,
    overview,
    apiEndpoints,
    dataModels,
    dependencies,
    setup: [
      "Run database migrations if needed",
      "Seed initial data using scripts/seed-local-kv.ts",
      "Start development server: deno task dev",
    ],
    usage: [
      `Navigate to the feature route`,
      `Use API endpoints for data operations`,
      `Check tests for usage examples`,
    ],
    testing: `Run tests with: deno test tests/unit/**/${featureName}*.test.ts`,
  };
}

/**
 * Formats documentation as Markdown
 */
export function formatAsMarkdown(doc: FeatureDocumentation): string {
  const md: string[] = [];
  
  // Header
  md.push(`# ${doc.metadata.displayName}`);
  md.push("");
  md.push(`**Version**: ${doc.metadata.version}`);
  md.push(`**Created**: ${doc.metadata.createdAt}`);
  md.push(`**Updated**: ${doc.metadata.updatedAt}`);
  md.push("");
  
  // Overview
  md.push("## Overview");
  md.push("");
  md.push(doc.overview);
  md.push("");
  
  // API Endpoints
  if (doc.apiEndpoints.length > 0) {
    md.push("## API Endpoints");
    md.push("");
    for (const endpoint of doc.apiEndpoints) {
      md.push(`### ${endpoint.method} ${endpoint.path}`);
      md.push("");
      md.push(endpoint.description);
      md.push("");
      md.push(`- **Authentication**: ${endpoint.auth ? "Required" : "Not required"}`);
      md.push("");
      if (endpoint.parameters && endpoint.parameters.length > 0) {
        md.push("**Parameters:**");
        md.push("");
        md.push("| Name | Type | Required | Description |");
        md.push("|------|------|----------|-------------|");
        for (const param of endpoint.parameters) {
          md.push(`| ${param.name} | ${param.type} | ${param.required ? "Yes" : "No"} | ${param.description} |`);
        }
        md.push("");
      }
      if (endpoint.responses && endpoint.responses.length > 0) {
        md.push("**Responses:**");
        md.push("");
        for (const response of endpoint.responses) {
          md.push(`- **${response.status}**: ${response.description}`);
        }
        md.push("");
      }
    }
  }
  
  // Data Models
  if (doc.dataModels.length > 0) {
    md.push("## Data Models");
    md.push("");
    for (const model of doc.dataModels) {
      md.push(`### ${model.name}`);
      md.push("");
      md.push("| Field | Type | Required | Description |");
      md.push("|-------|------|----------|-------------|");
      for (const field of model.fields) {
        md.push(`| ${field.name} | ${field.type} | ${field.required ? "Yes" : "No"} | ${field.description || "-"} |`);
      }
      md.push("");
      if (model.relationships && model.relationships.length > 0) {
        md.push("**Relationships:**");
        md.push("");
        for (const rel of model.relationships) {
          md.push(`- ${rel}`);
        }
        md.push("");
      }
    }
  }
  
  // Dependencies
  if (doc.dependencies.length > 0) {
    md.push("## Dependencies");
    md.push("");
    for (const dep of doc.dependencies) {
      md.push(`- ${dep}`);
    }
    md.push("");
  }
  
  // Setup
  md.push("## Setup");
  md.push("");
  for (const step of doc.setup) {
    md.push(`1. ${step}`);
  }
  md.push("");
  
  // Usage
  md.push("## Usage");
  md.push("");
  for (const step of doc.usage) {
    md.push(`- ${step}`);
  }
  md.push("");
  
  // Testing
  md.push("## Testing");
  md.push("");
  md.push("```bash");
  md.push(doc.testing);
  md.push("```");
  md.push("");
  
  return md.join("\n");
}

/**
 * Saves documentation to file
 */
export async function saveDocumentation(featureName: string, markdown: string): Promise<string> {
  const featureDir = `features/proposed/${featureName}`;
  await ensureDir(featureDir);
  
  const docPath = `${featureDir}/DOCUMENTATION.md`;
  await Deno.writeTextFile(docPath, markdown);
  
  return docPath;
}

// CLI interface
if (import.meta.main) {
  const args = parse(Deno.args, {
    string: ["feature", "output"],
    boolean: ["help"],
    alias: { f: "feature", o: "output", h: "help" },
  });
  
  if (args.help) {
    console.log(`
Feature Documentation Generator

Usage:
  deno run --allow-read --allow-write scripts/generate-feature-docs.ts [options]

Options:
  -f, --feature <name>    Feature name (required)
  -o, --output <path>     Output file path (default: features/proposed/<name>/DOCUMENTATION.md)
  -h, --help              Show this help

Examples:
  # Generate documentation for a feature
  deno run --allow-read --allow-write scripts/generate-feature-docs.ts -f ai-task-dashboard

  # Generate with custom output path
  deno run --allow-read --allow-write scripts/generate-feature-docs.ts -f my-feature -o docs/my-feature.md
`);
    Deno.exit(0);
  }
  
  if (!args.feature) {
    console.error("❌ Error: --feature is required");
    console.error("Run with --help for usage information");
    Deno.exit(1);
  }
  
  console.log(`📚 Generating documentation for: ${args.feature}`);
  
  try {
    const doc = await generateFeatureDocumentation(args.feature);
    const markdown = formatAsMarkdown(doc);
    
    const outputPath = args.output || `features/proposed/${args.feature}/DOCUMENTATION.md`;
    await Deno.writeTextFile(outputPath, markdown);
    
    console.log(`✅ Documentation generated: ${outputPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`  - API Endpoints: ${doc.apiEndpoints.length}`);
    console.log(`  - Data Models: ${doc.dataModels.length}`);
    console.log(`  - Dependencies: ${doc.dependencies.length}`);
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}
