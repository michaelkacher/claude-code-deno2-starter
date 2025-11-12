#!/usr/bin/env -S deno run -A
/**
 * Feature Scaffolding Generator
 * 
 * Generates boilerplate code for a new feature:
 * - Service layer (shared/services/)
 * - API routes (frontend/routes/api/)
 * - Repository (shared/repositories/)
 * - Tests (tests/unit/services/)
 * 
 * Usage:
 *   deno run -A scripts/scaffold-feature.ts campaign-creator Campaign
 * 
 * Args:
 *   featureName: kebab-case feature name (e.g., "campaign-creator")
 *   modelName: PascalCase model name (e.g., "Campaign")
 */

interface ScaffoldOptions {
  featureName: string;
  modelName: string;
  resourceName?: string;  // API route name (plural)
  operations?: ("create" | "update" | "delete" | "getById" | "list")[];
}

function toPascalCase(kebab: string): string {
  return kebab
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function toCamelCase(kebab: string): string {
  const pascal = toPascalCase(kebab);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function generateServiceTemplate(opts: ScaffoldOptions): string {
  const { featureName, modelName } = opts;
  const serviceName = toPascalCase(featureName);
  
  return `import { ${modelName} } from "../types/${featureName}.types.ts";
import { ${modelName}Repository } from "../repositories/${modelName.toLowerCase()}.repository.ts";

/**
 * ${serviceName}Service
 * 
 * Business logic for ${featureName} feature
 */
export class ${serviceName}Service {
  private repository: ${modelName}Repository;

  constructor(kv: Deno.Kv) {
    this.repository = new ${modelName}Repository(kv);
  }

  /**
   * Create a new ${modelName.toLowerCase()}
   */
  async create(data: Omit<${modelName}, "id" | "createdAt" | "updatedAt">, userId: string): Promise<${modelName}> {
    const ${modelName.toLowerCase()} = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.repository.create(${modelName.toLowerCase()}, userId);
    return ${modelName.toLowerCase()};
  }

  /**
   * Get ${modelName.toLowerCase()} by ID
   */
  async getById(id: string, userId: string): Promise<${modelName} | null> {
    return await this.repository.getById(id, userId);
  }

  /**
   * Update ${modelName.toLowerCase()}
   */
  async update(id: string, data: Partial<${modelName}>, userId: string): Promise<${modelName} | null> {
    const existing = await this.repository.getById(id, userId);
    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await this.repository.update(id, updated, userId);
    return updated;
  }

  /**
   * Delete ${modelName.toLowerCase()}
   */
  async delete(id: string, userId: string): Promise<boolean> {
    return await this.repository.delete(id, userId);
  }

  /**
   * List ${modelName.toLowerCase()}s for user
   */
  async listByUser(userId: string): Promise<${modelName}[]> {
    return await this.repository.listByUser(userId);
  }
}
`;
}

function generateRepositoryTemplate(opts: ScaffoldOptions): string {
  const { modelName } = opts;
  const resourceName = modelName.toLowerCase();
  
  return `import { ${modelName} } from "../types/${opts.featureName}.types.ts";

/**
 * ${modelName}Repository
 * 
 * Data access layer for ${modelName} resources
 */
export class ${modelName}Repository {
  constructor(private kv: Deno.Kv) {}

  /**
   * Create ${resourceName}
   */
  async create(${resourceName}: ${modelName}, userId: string): Promise<void> {
    const batch = this.kv.atomic()
      .set(["${resourceName}", ${resourceName}.id], ${resourceName})
      .set(["${resourceName}_by_user", userId, ${resourceName}.id], ${resourceName});
    
    await batch.commit();
  }

  /**
   * Get ${resourceName} by ID
   */
  async getById(id: string, userId: string): Promise<${modelName} | null> {
    const result = await this.kv.get<${modelName}>(["${resourceName}_by_user", userId, id]);
    return result.value;
  }

  /**
   * Update ${resourceName}
   */
  async update(id: string, ${resourceName}: ${modelName}, userId: string): Promise<void> {
    const batch = this.kv.atomic()
      .set(["${resourceName}", id], ${resourceName})
      .set(["${resourceName}_by_user", userId, id], ${resourceName});
    
    await batch.commit();
  }

  /**
   * Delete ${resourceName}
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const existing = await this.getById(id, userId);
    if (!existing) {
      return false;
    }

    const batch = this.kv.atomic()
      .delete(["${resourceName}", id])
      .delete(["${resourceName}_by_user", userId, id]);
    
    await batch.commit();
    return true;
  }

  /**
   * List ${resourceName}s for user
   */
  async listByUser(userId: string): Promise<${modelName}[]> {
    const items: ${modelName}[] = [];
    const iter = this.kv.list<${modelName}>({ prefix: ["${resourceName}_by_user", userId] });
    
    for await (const entry of iter) {
      items.push(entry.value);
    }
    
    return items;
  }
}
`;
}

function generateTypesTemplate(opts: ScaffoldOptions): string {
  const { modelName } = opts;
  
  return `/**
 * Types for ${opts.featureName} feature
 */

export interface ${modelName} {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Create${modelName}Request {
  name: string;
  description?: string;
}

export interface Update${modelName}Request {
  name?: string;
  description?: string;
}
`;
}

function generateApiRouteTemplate(opts: ScaffoldOptions): string {
  const { featureName, modelName, resourceName } = opts;
  const serviceName = toPascalCase(featureName);
  const apiPath = resourceName || featureName;
  
  return `import { FreshContext } from "$fresh/server.ts";
import { z } from "zod";
import { ${serviceName}Service } from "../../../../shared/services/${featureName}.service.ts";
import { requireUser } from "../../../lib/fresh-helpers.ts";
import { getKv } from "../../../../shared/lib/kv.ts";

// Validation schemas
const create${modelName}Schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const update${modelName}Schema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

/**
 * POST /api/${apiPath}
 * Create new ${modelName.toLowerCase()}
 */
export async function POST(req: Request, ctx: FreshContext) {
  try {
    // Authenticate
    const user = await requireUser(ctx);
    const userId = user.sub;

    // Validate input
    const body = await req.json();
    const data = create${modelName}Schema.parse(body);

    // Create ${modelName.toLowerCase()}
    const kv = await getKv();
    const service = new ${serviceName}Service(kv);
    const ${modelName.toLowerCase()} = await service.create(data, userId);

    return new Response(JSON.stringify(${modelName.toLowerCase()}), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Error creating ${modelName.toLowerCase()}:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create ${modelName.toLowerCase()}" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * GET /api/${apiPath}
 * List ${modelName.toLowerCase()}s for current user
 */
export async function GET(_req: Request, ctx: FreshContext) {
  try {
    // Authenticate
    const user = await requireUser(ctx);
    const userId = user.sub;

    // List ${modelName.toLowerCase()}s
    const kv = await getKv();
    const service = new ${serviceName}Service(kv);
    const items = await service.listByUser(userId);

    return new Response(JSON.stringify(items), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error listing ${modelName.toLowerCase()}s:", error);
    return new Response(
      JSON.stringify({ error: "Failed to list ${modelName.toLowerCase()}s" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
`;
}

function generateApiRouteIdTemplate(opts: ScaffoldOptions): string {
  const { featureName, modelName, resourceName } = opts;
  const serviceName = toPascalCase(featureName);
  const apiPath = resourceName || featureName;
  
  return `import { FreshContext } from "$fresh/server.ts";
import { z } from "zod";
import { ${serviceName}Service } from "../../../../shared/services/${featureName}.service.ts";
import { requireUser } from "../../../lib/fresh-helpers.ts";
import { getKv } from "../../../../shared/lib/kv.ts";

const update${modelName}Schema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

/**
 * GET /api/${apiPath}/:id
 * Get ${modelName.toLowerCase()} by ID
 */
export async function GET(_req: Request, ctx: FreshContext) {
  try {
    const user = await requireUser(ctx);
    const userId = user.sub;
    const id = ctx.params.id;

    const kv = await getKv();
    const service = new ${serviceName}Service(kv);
    const ${modelName.toLowerCase()} = await service.getById(id, userId);

    if (!${modelName.toLowerCase()}) {
      return new Response(
        JSON.stringify({ error: "${modelName} not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(${modelName.toLowerCase()}), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting ${modelName.toLowerCase()}:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get ${modelName.toLowerCase()}" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * PUT /api/${featureName}/:id
 * Update ${modelName.toLowerCase()}
 */
export async function PUT(req: Request, ctx: FreshContext) {
  try {
    const user = await requireUser(ctx);
    const userId = user.sub;
    const id = ctx.params.id;

    const body = await req.json();
    const data = update${modelName}Schema.parse(body);

    const kv = await getKv();
    const service = new ${serviceName}Service(kv);
    const ${modelName.toLowerCase()} = await service.update(id, data, userId);

    if (!${modelName.toLowerCase()}) {
      return new Response(
        JSON.stringify({ error: "${modelName} not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(${modelName.toLowerCase()}), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Error updating ${modelName.toLowerCase()}:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update ${modelName.toLowerCase()}" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * DELETE /api/${featureName}/:id
 * Delete ${modelName.toLowerCase()}
 */
export async function DELETE(_req: Request, ctx: FreshContext) {
  try {
    const user = await requireUser(ctx);
    const userId = user.sub;
    const id = ctx.params.id;

    const kv = await getKv();
    const service = new ${serviceName}Service(kv);
    const deleted = await service.delete(id, userId);

    if (!deleted) {
      return new Response(
        JSON.stringify({ error: "${modelName} not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting ${modelName.toLowerCase()}:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete ${modelName.toLowerCase()}" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
`;
}

function generateTestTemplate(opts: ScaffoldOptions): string {
  const { featureName, modelName } = opts;
  const serviceName = toPascalCase(featureName);
  
  return `import { assertEquals, assertExists } from "@std/assert";
import { ${serviceName}Service } from "../../../shared/services/${featureName}.service.ts";

const TEST_USER_ID = "test-user-123";

Deno.test("${serviceName}Service - create ${modelName.toLowerCase()}", async () => {
  const kv = await Deno.openKv(":memory:");
  const service = new ${serviceName}Service(kv);

  const data = {
    name: "Test ${modelName}",
    description: "Test description",
  };

  const ${modelName.toLowerCase()} = await service.create(data, TEST_USER_ID);

  assertExists(${modelName.toLowerCase()}.id);
  assertEquals(${modelName.toLowerCase()}.name, "Test ${modelName}");
  assertEquals(${modelName.toLowerCase()}.description, "Test description");
  assertExists(${modelName.toLowerCase()}.createdAt);
  assertExists(${modelName.toLowerCase()}.updatedAt);

  await kv.close();
});

Deno.test("${serviceName}Service - getById", async () => {
  const kv = await Deno.openKv(":memory:");
  const service = new ${serviceName}Service(kv);

  const created = await service.create({ name: "Test ${modelName}" }, TEST_USER_ID);
  const retrieved = await service.getById(created.id, TEST_USER_ID);

  assertExists(retrieved);
  assertEquals(retrieved.id, created.id);
  assertEquals(retrieved.name, "Test ${modelName}");

  await kv.close();
});

Deno.test("${serviceName}Service - update", async () => {
  const kv = await Deno.openKv(":memory:");
  const service = new ${serviceName}Service(kv);

  const created = await service.create({ name: "Original" }, TEST_USER_ID);
  const updated = await service.update(created.id, { name: "Updated" }, TEST_USER_ID);

  assertExists(updated);
  assertEquals(updated.name, "Updated");
  assertEquals(updated.id, created.id);

  await kv.close();
});

Deno.test("${serviceName}Service - delete", async () => {
  const kv = await Deno.openKv(":memory:");
  const service = new ${serviceName}Service(kv);

  const created = await service.create({ name: "Test" }, TEST_USER_ID);
  const deleted = await service.delete(created.id, TEST_USER_ID);

  assertEquals(deleted, true);

  const retrieved = await service.getById(created.id, TEST_USER_ID);
  assertEquals(retrieved, null);

  await kv.close();
});

Deno.test("${serviceName}Service - listByUser", async () => {
  const kv = await Deno.openKv(":memory:");
  const service = new ${serviceName}Service(kv);

  await service.create({ name: "${modelName} 1" }, TEST_USER_ID);
  await service.create({ name: "${modelName} 2" }, TEST_USER_ID);

  const list = await service.listByUser(TEST_USER_ID);

  assertEquals(list.length, 2);
  assertEquals(list[0].name, "${modelName} 1");
  assertEquals(list[1].name, "${modelName} 2");

  await kv.close();
});
`;
}

function generateApiRouteTestTemplate(opts: ScaffoldOptions): string {
  const { featureName, modelName, resourceName } = opts;
  const serviceName = toPascalCase(featureName);
  const apiPath = resourceName || featureName;
  
  return `import { assertEquals, assertExists } from "@std/assert";
import { STATUS_CODE } from "$fresh/server.ts";

const API_BASE = "http://localhost:3000/api/${apiPath}";
const TEST_USER_TOKEN = "test-jwt-token"; // Replace with actual test token generation

Deno.test("POST /api/${apiPath} - creates ${modelName.toLowerCase()}", async () => {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${TEST_USER_TOKEN}\`,
    },
    body: JSON.stringify({
      name: "Test ${modelName}",
      description: "Test description",
    }),
  });

  assertEquals(response.status, STATUS_CODE.Created);
  
  const data = await response.json();
  assertExists(data.id);
  assertEquals(data.name, "Test ${modelName}");
});

Deno.test("POST /api/${apiPath} - validates required fields", async () => {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${TEST_USER_TOKEN}\`,
    },
    body: JSON.stringify({
      // Missing required fields
    }),
  });

  assertEquals(response.status, STATUS_CODE.BadRequest);
  
  const data = await response.json();
  assertExists(data.error);
});

Deno.test("POST /api/${apiPath} - requires authentication", async () => {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Missing Authorization header
    },
    body: JSON.stringify({
      name: "Test ${modelName}",
    }),
  });

  assertEquals(response.status, STATUS_CODE.Unauthorized);
});

Deno.test("GET /api/${apiPath} - lists ${apiPath}", async () => {
  const response = await fetch(API_BASE, {
    headers: {
      "Authorization": \`Bearer \${TEST_USER_TOKEN}\`,
    },
  });

  assertEquals(response.status, STATUS_CODE.OK);
  
  const data = await response.json();
  assertEquals(Array.isArray(data), true);
});

Deno.test("GET /api/${apiPath}/:id - gets ${modelName.toLowerCase()} by ID", async () => {
  // First create a ${modelName.toLowerCase()}
  const createResponse = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${TEST_USER_TOKEN}\`,
    },
    body: JSON.stringify({
      name: "Test ${modelName}",
    }),
  });

  const created = await createResponse.json();
  
  // Then get it by ID
  const response = await fetch(\`\${API_BASE}/\${created.id}\`, {
    headers: {
      "Authorization": \`Bearer \${TEST_USER_TOKEN}\`,
    },
  });

  assertEquals(response.status, STATUS_CODE.OK);
  
  const data = await response.json();
  assertEquals(data.id, created.id);
  assertEquals(data.name, "Test ${modelName}");
});

Deno.test("GET /api/${apiPath}/:id - returns 404 for non-existent ID", async () => {
  const response = await fetch(\`\${API_BASE}/non-existent-id\`, {
    headers: {
      "Authorization": \`Bearer \${TEST_USER_TOKEN}\`,
    },
  });

  assertEquals(response.status, STATUS_CODE.NotFound);
});

Deno.test("PUT /api/${apiPath}/:id - updates ${modelName.toLowerCase()}", async () => {
  // First create a ${modelName.toLowerCase()}
  const createResponse = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${TEST_USER_TOKEN}\`,
    },
    body: JSON.stringify({
      name: "Original Name",
    }),
  });

  const created = await createResponse.json();
  
  // Then update it
  const response = await fetch(\`\${API_BASE}/\${created.id}\`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${TEST_USER_TOKEN}\`,
    },
    body: JSON.stringify({
      name: "Updated Name",
    }),
  });

  assertEquals(response.status, STATUS_CODE.OK);
  
  const data = await response.json();
  assertEquals(data.name, "Updated Name");
});

Deno.test("DELETE /api/${apiPath}/:id - deletes ${modelName.toLowerCase()}", async () => {
  // First create a ${modelName.toLowerCase()}
  const createResponse = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${TEST_USER_TOKEN}\`,
    },
    body: JSON.stringify({
      name: "To Delete",
    }),
  });

  const created = await createResponse.json();
  
  // Then delete it
  const response = await fetch(\`\${API_BASE}/\${created.id}\`, {
    method: "DELETE",
    headers: {
      "Authorization": \`Bearer \${TEST_USER_TOKEN}\`,
    },
  });

  assertEquals(response.status, STATUS_CODE.OK);
  
  // Verify it's deleted
  const getResponse = await fetch(\`\${API_BASE}/\${created.id}\`, {
    headers: {
      "Authorization": \`Bearer \${TEST_USER_TOKEN}\`,
    },
  });
  
  assertEquals(getResponse.status, STATUS_CODE.NotFound);
});
`;
}

async function scaffoldFeature(opts: ScaffoldOptions) {
  const { featureName, modelName, resourceName } = opts;
  const apiPath = resourceName || featureName;
  
  console.log(`\n🏗️  Scaffolding feature: ${featureName}`);
  console.log(`📦 Model: ${modelName}`);
  console.log(`🔗 API Routes: /api/${apiPath}\n`);

  // Create directories
  await Deno.mkdir(`shared/services`, { recursive: true });
  await Deno.mkdir(`shared/repositories`, { recursive: true });
  await Deno.mkdir(`shared/types`, { recursive: true });
  await Deno.mkdir(`frontend/routes/api/${apiPath}`, { recursive: true });
  await Deno.mkdir(`tests/unit/services`, { recursive: true });
  await Deno.mkdir(`tests/integration/api`, { recursive: true });

  // Generate files
  const files = [
    {
      path: `shared/types/${featureName}.types.ts`,
      content: generateTypesTemplate(opts),
      desc: "Type definitions",
    },
    {
      path: `shared/repositories/${modelName.toLowerCase()}.repository.ts`,
      content: generateRepositoryTemplate(opts),
      desc: "Repository (data access)",
    },
    {
      path: `shared/services/${featureName}.service.ts`,
      content: generateServiceTemplate(opts),
      desc: "Service (business logic)",
    },
    {
      path: `frontend/routes/api/${apiPath}/index.ts`,
      content: generateApiRouteTemplate(opts),
      desc: "API route (POST, GET)",
    },
    {
      path: `frontend/routes/api/${apiPath}/[id].ts`,
      content: generateApiRouteIdTemplate(opts),
      desc: "API route (GET, PUT, DELETE by ID)",
    },
    {
      path: `tests/unit/services/${featureName}.service.test.ts`,
      content: generateTestTemplate(opts),
      desc: "Unit tests (service layer)",
    },
    {
      path: `tests/integration/api/${apiPath}.api.test.ts`,
      content: generateApiRouteTestTemplate(opts),
      desc: "Integration tests (API routes)",
    },
  ];

  for (const file of files) {
    await Deno.writeTextFile(file.path, file.content);
    console.log(`✅ ${file.path}`);
    console.log(`   ${file.desc}`);
  }

  console.log(`\n✨ Scaffolding complete!\n`);
  console.log(`Next steps:`);
  console.log(`1. Review and customize the generated files`);
  console.log(`2. Run unit tests: deno test --no-check tests/unit/services/${featureName}.service.test.ts -A`);
  console.log(`3. Run API tests: deno test --no-check tests/integration/api/${apiPath}.api.test.ts -A --unstable-kv`);
  console.log(`4. Update types in shared/types/${featureName}.types.ts with actual fields`);
  console.log(`5. Add custom business logic to the service`);
  console.log(`6. Build frontend UI components\n`);
  console.log(`⚠️  Note: API tests require a running server or mock JWT tokens\n`);
}

// Main
if (import.meta.main) {
  const args = Deno.args;
  
  if (args.length < 2) {
    console.error("Usage: deno run -A scripts/scaffold-feature.ts <feature-name> <ModelName>");
    console.error("");
    console.error("Examples:");
    console.error("  deno run -A scripts/scaffold-feature.ts campaign-creator Campaign");
    console.error("  deno run -A scripts/scaffold-feature.ts user-profile UserProfile");
    Deno.exit(1);
  }

  const [featureName, modelName] = args;
  
  // Smart default: pluralize feature name for API routes
  const defaultResourceName = featureName.endsWith('s') 
    ? featureName 
    : `${featureName}s`;
  
  // Interactive prompt for API resource name
  console.log(`\n📝 API Route Configuration`);
  console.log(`Feature name: ${featureName}`);
  console.log(`Model name: ${modelName}`);
  console.log();
  
  const resourceNameInput = prompt(
    `API resource name (plural, press Enter for default):`,
    defaultResourceName
  );
  
  const resourceName = resourceNameInput?.trim() || defaultResourceName;

  await scaffoldFeature({
    featureName,
    modelName,
    resourceName,
  });
}

