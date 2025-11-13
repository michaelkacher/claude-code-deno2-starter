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
  const camel = modelName.toLowerCase();

  return `import { ${modelName} } from "@/types/${featureName}.types.ts";
import { ${modelName}Repository } from "@/repositories/${modelName.toLowerCase()}.repository.ts";
// import { buildError } from "@/constants/errors.ts"; // Uncomment & add feature-specific error codes

/**
 * ${serviceName}Service
 * Business logic for ${featureName} feature.
 * Follows repository pattern (lazy KV, centralized CRUD) to avoid common missteps.
 */
export class ${serviceName}Service {
  private repository: ${modelName}Repository;

  constructor(kv: Deno.Kv) {
    // Pass kv via options for testability & lazy reuse in repository
    this.repository = new ${modelName}Repository({ kv });
  }

  /** Create a new ${camel} */
  async create(data: Omit<${modelName}, "id" | "createdAt" | "updatedAt">, userId: string): Promise<${modelName}> {
    return await this.repository.create(data, userId);
  }

  /** Get a ${camel} by id (scoped to user) */
  async getById(id: string, userId: string): Promise<${modelName} | null> {
    return await this.repository.findByIdForUser(id, userId);
  }

  /** Update an existing ${camel}. Returns updated entity or throws if not found. */
  async update(id: string, data: Partial<Omit<${modelName}, "id" | "createdAt">>, userId: string): Promise<${modelName}> {
    const updated = await this.repository.updateForUser(id, data, userId);
    if (!updated) {
      // Replace with buildError('YOUR_ERROR_CODE') when you add error constants
      throw new Error('${modelName} not found');
    }
    return updated;
  }

  /** Delete a ${camel}. Returns true if deleted. */
  async delete(id: string, userId: string): Promise<boolean> {
    return await this.repository.deleteForUser(id, userId);
  }

  /** List all ${camel}s for a user */
  async listByUser(userId: string): Promise<${modelName}[]> {
    return await this.repository.listByUser(userId);
  }
}
`;
}

function generateRepositoryTemplate(opts: ScaffoldOptions): string {
  const { modelName, featureName } = opts;
  const camel = modelName.toLowerCase();
  const pluralKey = `${camel}s`;

  return `import { BaseRepository } from "@/repositories/base-repository.ts";
import { ${modelName} } from "@/types/${featureName}.types.ts";

/**
 * ${modelName}Repository
 * Data access layer for ${modelName} entities.
 * Extends BaseRepository to leverage lazy KV init, logging & helpers.
 */
export class ${modelName}Repository extends BaseRepository<${modelName}> {
  constructor(options: { kv: Deno.Kv }) {
    super('${pluralKey}', options);
  }

  /** Create a new ${camel} (assigns id & timestamps) */
  async create(data: Omit<${modelName}, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<${modelName}> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const entity: ${modelName} = { id, ...data, createdAt: now, updatedAt: now };

    // Primary entity key
    await this.set(['${pluralKey}', id], entity);
    // User-scoped index key (pattern: plural_by_user)
    await this.set(['${pluralKey}_by_user', userId, id], entity);
    return entity;
  }

  /** Find by id (global) */
  async findById(id: string): Promise<${modelName} | null> {
    return await this.get(['${pluralKey}', id]);
  }

  /** Find by id scoped to a user */
  async findByIdForUser(id: string, userId: string): Promise<${modelName} | null> {
    return await this.get(['${pluralKey}_by_user', userId, id]);
  }

  /** Update entity (global) */
  async update(id: string, updates: Partial<Omit<${modelName}, 'id' | 'createdAt'>>): Promise<${modelName} | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: ${modelName} = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await this.set(['${pluralKey}', id], updated);
    return updated;
  }

  /** Update entity scoped to user (keeps user index in sync) */
  async updateForUser(id: string, updates: Partial<Omit<${modelName}, 'id' | 'createdAt'>>, userId: string): Promise<${modelName} | null> {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) return null;
    const updated: ${modelName} = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await this.set(['${pluralKey}', id], updated);
    await this.set(['${pluralKey}_by_user', userId, id], updated);
    return updated;
  }

  /** Delete entity scoped to user */
  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) return false;
    await this.delete(['${pluralKey}', id]);
    await this.delete(['${pluralKey}_by_user', userId, id]);
    return true;
  }

  /** List all entities for a user */
  async listByUser(userId: string): Promise<${modelName}[]> {
    const res = await this.list(['${pluralKey}_by_user', userId]);
    return res.items;
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
  const camel = modelName.toLowerCase();

  return `import { FreshContext } from "$fresh/server.ts";
import { z } from "zod";
import { ${serviceName}Service } from "@/services/${featureName}.service.ts";
import { getKv } from "@/lib/kv.ts";
import { requireUser } from "../../../lib/fresh-helpers.ts";

// Validation schemas
const create${modelName}Schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const update${modelName}Schema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

/** POST /api/${apiPath} - create new ${camel} */
export async function POST(req: Request, ctx: FreshContext) {
  try {
    const user = await requireUser(ctx);
    const body = await req.json();
    const data = create${modelName}Schema.parse(body);
    const service = new ${serviceName}Service(await getKv());
    const ${camel} = await service.create(data, user.sub);
    return new Response(JSON.stringify(${camel}), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: error.errors }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    console.error('Error creating ${camel}:', error);
    return new Response(JSON.stringify({ error: 'Failed to create ${camel}' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

/** GET /api/${apiPath} - list ${camel}s */
export async function GET(_req: Request, ctx: FreshContext) {
  try {
    const user = await requireUser(ctx);
    const service = new ${serviceName}Service(await getKv());
    const items = await service.listByUser(user.sub);
    return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error listing ${camel}s:', error);
    return new Response(JSON.stringify({ error: 'Failed to list ${camel}s' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
`;
}

function generateApiRouteIdTemplate(opts: ScaffoldOptions): string {
  const { featureName, modelName, resourceName } = opts;
  const serviceName = toPascalCase(featureName);
  const apiPath = resourceName || featureName;
  const camel = modelName.toLowerCase();

  return `import { FreshContext } from "$fresh/server.ts";
import { z } from "zod";
import { ${serviceName}Service } from "@/services/${featureName}.service.ts";
import { getKv } from "@/lib/kv.ts";
import { requireUser } from "../../../lib/fresh-helpers.ts";

const update${modelName}Schema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

/** GET /api/${apiPath}/:id - fetch ${camel} */
export async function GET(_req: Request, ctx: FreshContext) {
  try {
    const user = await requireUser(ctx);
    const id = ctx.params.id;
    const service = new ${serviceName}Service(await getKv());
    const ${camel} = await service.getById(id, user.sub);
    if (!${camel}) {
      return new Response(JSON.stringify({ error: '${modelName} not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(${camel}), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error getting ${camel}:', error);
    return new Response(JSON.stringify({ error: 'Failed to get ${camel}' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

/** PUT /api/${apiPath}/:id - update ${camel} */
export async function PUT(req: Request, ctx: FreshContext) {
  try {
    const user = await requireUser(ctx);
    const id = ctx.params.id;
    const body = await req.json();
    const data = update${modelName}Schema.parse(body);
    const service = new ${serviceName}Service(await getKv());
    try {
      const updated = await service.update(id, data, user.sub);
      return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
    } catch (_nf) {
      return new Response(JSON.stringify({ error: '${modelName} not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: error.errors }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    console.error('Error updating ${camel}:', error);
    return new Response(JSON.stringify({ error: 'Failed to update ${camel}' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

/** DELETE /api/${apiPath}/:id - delete ${camel} */
export async function DELETE(_req: Request, ctx: FreshContext) {
  try {
    const user = await requireUser(ctx);
    const id = ctx.params.id;
    const service = new ${serviceName}Service(await getKv());
    const deleted = await service.delete(id, user.sub);
    if (!deleted) {
      return new Response(JSON.stringify({ error: '${modelName} not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting ${camel}:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete ${camel}' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
`;
}

function generateTestTemplate(opts: ScaffoldOptions): string {
  const { featureName, modelName } = opts;
  const serviceName = toPascalCase(featureName);
  const camel = modelName.toLowerCase();

  return `import { assertEquals, assertExists } from "@std/assert";
import { ${serviceName}Service } from "@/services/${featureName}.service.ts";
import { withTestKv } from "../../helpers/kv.ts";

const TEST_USER_ID = 'test-user-123';

Deno.test('${serviceName}Service - create ${camel}', async () => {
  await withTestKv(async (kv) => {
    const service = new ${serviceName}Service(kv);
    const data = { name: 'Test ${modelName}', description: 'Test description' };
    const entity = await service.create(data, TEST_USER_ID);
    assertExists(entity.id);
    assertEquals(entity.name, 'Test ${modelName}');
    assertEquals(entity.description, 'Test description');
    assertExists(entity.createdAt);
    assertExists(entity.updatedAt);
  });
});

Deno.test('${serviceName}Service - getById', async () => {
  await withTestKv(async (kv) => {
    const service = new ${serviceName}Service(kv);
    const created = await service.create({ name: 'Test ${modelName}' }, TEST_USER_ID);
    const retrieved = await service.getById(created.id, TEST_USER_ID);
    assertExists(retrieved);
    assertEquals(retrieved!.id, created.id);
  });
});

Deno.test('${serviceName}Service - update', async () => {
  await withTestKv(async (kv) => {
    const service = new ${serviceName}Service(kv);
    const created = await service.create({ name: 'Original' }, TEST_USER_ID);
    const updated = await service.update(created.id, { name: 'Updated' }, TEST_USER_ID);
    assertEquals(updated.name, 'Updated');
    assertEquals(updated.id, created.id);
  });
});

Deno.test('${serviceName}Service - delete', async () => {
  await withTestKv(async (kv) => {
    const service = new ${serviceName}Service(kv);
    const created = await service.create({ name: 'Test' }, TEST_USER_ID);
    const deleted = await service.delete(created.id, TEST_USER_ID);
    assertEquals(deleted, true);
    const retrieved = await service.getById(created.id, TEST_USER_ID);
    assertEquals(retrieved, null);
  });
});

Deno.test('${serviceName}Service - listByUser', async () => {
  await withTestKv(async (kv) => {
    const service = new ${serviceName}Service(kv);
    await service.create({ name: '${modelName} 1' }, TEST_USER_ID);
    await service.create({ name: '${modelName} 2' }, TEST_USER_ID);
    const list = await service.listByUser(TEST_USER_ID);
    assertEquals(list.length, 2);
  });
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

