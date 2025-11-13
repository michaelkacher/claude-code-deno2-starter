/**
 * API Documentation Generator
 * Generates OpenAPI/Swagger specifications from API routes
 */

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/ensure_dir.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers: Array<{ url: string; description: string }>;
  paths: Record<string, Record<string, any>>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

export interface RouteInfo {
  path: string;
  method: string;
  handler: string;
  description?: string;
  auth?: boolean;
  parameters?: any[];
  requestBody?: any;
  responses?: Record<string, any>;
}

/**
 * Extracts route information from API files
 */
async function extractRouteInfo(filePath: string, routePath: string): Promise<RouteInfo[]> {
  const content = await Deno.readTextFile(filePath);
  const routes: RouteInfo[] = [];
  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  
  for (const method of methods) {
    // Check if handler exists
    const handlerPattern = new RegExp(`export\\s+const\\s+${method}\\s*[=:]`, "m");
    if (handlerPattern.test(content)) {
      // Extract JSDoc comment
      const commentPattern = new RegExp(`/\\*\\*([^*]|\\*[^/])*\\*/\\s*export\\s+const\\s+${method}`, "s");
      const commentMatch = content.match(commentPattern);
      
      let description = `${method} ${routePath}`;
      let auth = false;
      let parameters: any[] = [];
      let requestBody: any = undefined;
      let responses: Record<string, any> = {
        "200": {
          description: "Successful response",
        },
      };
      
      if (commentMatch) {
        const comment = commentMatch[0];
        
        // Extract description
        const descMatch = comment.match(/\*\s+(.+?)(?:\n|@)/);
        if (descMatch) {
          description = descMatch[1].trim();
        }
        
        // Check for auth
        auth = comment.includes("@auth") || comment.includes("@requireAuth");
        
        // Extract parameters
        const paramMatches = comment.matchAll(/@param\s+{([^}]+)}\s+(\w+)\s+(.+)/g);
        for (const match of paramMatches) {
          parameters.push({
            name: match[2],
            in: "query",
            required: !match[1].includes("?"),
            schema: { type: match[1].replace("?", "").trim() },
            description: match[3],
          });
        }
        
        // Extract response codes
        const responseMatches = comment.matchAll(/@returns?\s+{(\d+)}\s+(.+)/g);
        for (const match of responseMatches) {
          responses[match[1]] = {
            description: match[2].trim(),
          };
        }
      }
      
      // Detect request body for POST/PUT/PATCH
      if (["POST", "PUT", "PATCH"].includes(method)) {
        if (content.includes("await req.json()")) {
          requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                },
              },
            },
          };
        }
      }
      
      routes.push({
        path: routePath,
        method,
        handler: `${method} ${routePath}`,
        description,
        auth,
        parameters: parameters.length > 0 ? parameters : undefined,
        requestBody,
        responses,
      });
    }
  }
  
  return routes;
}

/**
 * Scans API directory and extracts all routes
 */
async function scanAPIRoutes(apiDir: string = "frontend/routes/api"): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];
  
  if (!(await exists(apiDir))) {
    return routes;
  }
  
  async function walk(currentDir: string, basePath: string): Promise<void> {
    for await (const entry of Deno.readDir(currentDir)) {
      const fullPath = `${currentDir}/${entry.name}`;
      
      if (entry.isDirectory) {
        await walk(fullPath, `${basePath}/${entry.name}`);
      } else if (entry.isFile && entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
        const fileName = entry.name.replace(".ts", "");
        const routePath = fileName === "index" ? basePath : `${basePath}/${fileName}`;
        const routeInfo = await extractRouteInfo(fullPath, routePath);
        routes.push(...routeInfo);
      }
    }
  }
  
  await walk(apiDir, "/api");
  return routes;
}

/**
 * Generates OpenAPI specification
 */
export async function generateOpenAPISpec(
  title: string = "API Documentation",
  version: string = "1.0.0"
): Promise<OpenAPISpec> {
  const routes = await scanAPIRoutes();
  
  const paths: OpenAPISpec["paths"] = {};
  
  for (const route of routes) {
    if (!paths[route.path]) {
      paths[route.path] = {};
    }
    
    const operation: any = {
      summary: route.description,
      operationId: route.handler.replace(/\s+/g, "_"),
    };
    
    if (route.auth) {
      operation.security = [{ bearerAuth: [] }];
    }
    
    if (route.parameters) {
      operation.parameters = route.parameters;
    }
    
    if (route.requestBody) {
      operation.requestBody = route.requestBody;
    }
    
    if (route.responses) {
      operation.responses = route.responses;
    }
    
    paths[route.path][route.method.toLowerCase()] = operation;
  }
  
  const spec: OpenAPISpec = {
    openapi: "3.0.0",
    info: {
      title,
      version,
      description: "Auto-generated API documentation",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  };
  
  return spec;
}

/**
 * Saves OpenAPI spec to file
 */
export async function saveOpenAPISpec(spec: OpenAPISpec, outputPath: string): Promise<void> {
  await ensureDir(outputPath.substring(0, outputPath.lastIndexOf("/")));
  await Deno.writeTextFile(outputPath, JSON.stringify(spec, null, 2));
}

/**
 * Generates Markdown documentation from OpenAPI spec
 */
export function generateMarkdownDocs(spec: OpenAPISpec): string {
  const lines: string[] = [];
  
  lines.push(`# ${spec.info.title}`);
  lines.push("");
  lines.push(`**Version**: ${spec.info.version}`);
  if (spec.info.description) {
    lines.push("");
    lines.push(spec.info.description);
  }
  lines.push("");
  
  // Table of contents
  lines.push("## Table of Contents");
  lines.push("");
  for (const path of Object.keys(spec.paths).sort()) {
    const methods = Object.keys(spec.paths[path]);
    for (const method of methods) {
      const operation = spec.paths[path][method];
      lines.push(`- [${method.toUpperCase()} ${path}](#${method}-${path.replace(/[/{}]/g, "")})`);
    }
  }
  lines.push("");
  
  // Endpoints
  lines.push("## Endpoints");
  lines.push("");
  
  for (const path of Object.keys(spec.paths).sort()) {
    for (const [method, operation] of Object.entries(spec.paths[path])) {
      lines.push(`### ${method.toUpperCase()} ${path}`);
      lines.push("");
      
      if (operation.summary) {
        lines.push(operation.summary);
        lines.push("");
      }
      
      if (operation.security) {
        lines.push("🔒 **Authentication Required**");
        lines.push("");
      }
      
      if (operation.parameters && operation.parameters.length > 0) {
        lines.push("**Parameters:**");
        lines.push("");
        lines.push("| Name | In | Type | Required | Description |");
        lines.push("|------|-------|------|----------|-------------|");
        for (const param of operation.parameters) {
          lines.push(`| ${param.name} | ${param.in} | ${param.schema?.type || "string"} | ${param.required ? "Yes" : "No"} | ${param.description || "-"} |`);
        }
        lines.push("");
      }
      
      if (operation.requestBody) {
        lines.push("**Request Body:**");
        lines.push("");
        lines.push("```json");
        lines.push(JSON.stringify(operation.requestBody, null, 2));
        lines.push("```");
        lines.push("");
      }
      
      if (operation.responses) {
        lines.push("**Responses:**");
        lines.push("");
        for (const [status, response] of Object.entries(operation.responses)) {
          lines.push(`- **${status}**: ${(response as any).description || "Response"}`);
        }
        lines.push("");
      }
      
      lines.push("---");
      lines.push("");
    }
  }
  
  return lines.join("\n");
}

// CLI interface
if (import.meta.main) {
  const args = parse(Deno.args, {
    string: ["output", "format", "title", "version"],
    boolean: ["help"],
    alias: { o: "output", f: "format", h: "help" },
    default: { format: "json", title: "API Documentation", version: "1.0.0" },
  });
  
  if (args.help) {
    console.log(`
API Documentation Generator

Usage:
  deno run --allow-read --allow-write scripts/generate-api-docs.ts [options]

Options:
  -o, --output <path>     Output file path (default: docs/api-spec.json)
  -f, --format <type>     Output format: json or markdown (default: json)
  --title <title>         API title (default: "API Documentation")
  --version <version>     API version (default: "1.0.0")
  -h, --help              Show this help

Examples:
  # Generate OpenAPI JSON spec
  deno run --allow-read --allow-write scripts/generate-api-docs.ts

  # Generate Markdown documentation
  deno run --allow-read --allow-write scripts/generate-api-docs.ts -f markdown -o docs/API.md

  # Custom title and version
  deno run --allow-read --allow-write scripts/generate-api-docs.ts --title "My API" --version "2.0.0"
`);
    Deno.exit(0);
  }
  
  console.log(`📚 Generating API documentation...`);
  
  try {
    const spec = await generateOpenAPISpec(args.title, args.version);
    
    const outputPath = args.output || (args.format === "markdown" ? "docs/API.md" : "docs/api-spec.json");
    
    if (args.format === "markdown") {
      const markdown = generateMarkdownDocs(spec);
      await Deno.writeTextFile(outputPath, markdown);
    } else {
      await saveOpenAPISpec(spec, outputPath);
    }
    
    console.log(`✅ Documentation generated: ${outputPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`  - Endpoints: ${Object.keys(spec.paths).length}`);
    console.log(`  - Format: ${args.format}`);
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}
