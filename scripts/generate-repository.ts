#!/usr/bin/env -S deno run -A
/**
 * Repository Template Generator
 *
 * Creates a repository file extending BaseRepository with standard CRUD helpers
 * and user-scoped indexing pattern (<plural>_by_user).
 *
 * Usage:
 *   deno run -A scripts/generate-repository.ts FeatureName EntityName
 *
 * Example:
 *   deno run -A scripts/generate-repository.ts campaign Campaign
 *
 * This will produce: shared/repositories/campaign.repository.ts
 */

import { dirname, fromFileUrl, join } from "@std/path";

interface Args {
  feature: string; // kebab or lower-case (used for types file path segment)
  entity: string;  // PascalCase entity name
}

function toCamelCase(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

function toPlural(base: string): string {
  if (base.endsWith("s")) return base; // naive plural guard
  return base + "s";
}

function buildRepositorySource(feature: string, entity: string): string {
  const camel = toCamelCase(entity);
  const plural = toPlural(camel);
  return `import { BaseRepository } from '@/repositories/base-repository.ts';
import { ${entity} } from '@/types/${feature}.types.ts';

/**
 * ${entity}Repository
 * Auto-generated repository. You may safely customize domain-specific queries below.
 * DO NOT remove BaseRepository inheritance; tooling relies on this pattern.
 */
export class ${entity}Repository extends BaseRepository<${entity}> {
  constructor(options: { kv: Deno.Kv }) {
    super('${plural}', options);
  }

  /** Create new ${camel} assigning id & timestamps */
  async create(data: Omit<${entity}, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<${entity}> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const entity: ${entity} = { id, ...data, createdAt: now, updatedAt: now };
    await this.set(['${plural}', id], entity);
    await this.set(['${plural}_by_user', userId, id], entity);
    return entity;
  }

  /** Global lookup */
  async findById(id: string): Promise<${entity} | null> {
    return await this.get(['${plural}', id]);
  }

  /** User-scoped lookup */
  async findByIdForUser(id: string, userId: string): Promise<${entity} | null> {
    return await this.get(['${plural}_by_user', userId, id]);
  }

  /** Update (global) */
  async update(id: string, updates: Partial<Omit<${entity}, 'id' | 'createdAt'>>): Promise<${entity} | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: ${entity} = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await this.set(['${plural}', id], updated);
    return updated;
  }

  /** Update (user-scoped mirror) */
  async updateForUser(id: string, updates: Partial<Omit<${entity}, 'id' | 'createdAt'>>, userId: string): Promise<${entity} | null> {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) return null;
    const updated: ${entity} = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await this.set(['${plural}', id], updated);
    await this.set(['${plural}_by_user', userId, id], updated);
    return updated;
  }

  /** Delete user-scoped & primary */
  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) return false;
    await this.delete(['${plural}', id]);
    await this.delete(['${plural}_by_user', userId, id]);
    return true;
  }

  /** List entities for a user */
  async listByUser(userId: string): Promise<${entity}[]> {
    const res = await this.list(['${plural}_by_user', userId]);
    return res.items;
  }

  // --- Custom domain queries go below ---
}
`;
}

function parseArgs(): Args | null {
  const [feature, entity] = Deno.args;
  if (!feature || !entity) return null;
  return { feature, entity };
}

if (import.meta.main) {
  const parsed = parseArgs();
  if (!parsed) {
    console.error("Usage: deno run -A scripts/generate-repository.ts <feature> <EntityName>");
    Deno.exit(1);
  }

  const repoDir = join(dirname(fromFileUrl(import.meta.url)), '../shared/repositories');
  await Deno.mkdir(repoDir, { recursive: true });
  const target = join(repoDir, `${toCamelCase(parsed.entity)}.repository.ts`);

  // Safety: don't overwrite unless explicitly forced
  const force = Deno.env.get('FORCE_OVERWRITE') === 'true';
  try {
    const stat = await Deno.stat(target);
    if (stat.isFile && !force) {
      console.error(`File already exists: ${target}\nSet FORCE_OVERWRITE=true to override.`);
      Deno.exit(2);
    }
  } catch (_) {
    // doesn't exist; continue
  }

  const source = buildRepositorySource(parsed.feature, parsed.entity);
  await Deno.writeTextFile(target, source);
  console.log(`✅ Repository created: ${target}`);
  console.log("Next steps:\n  1. Add domain-specific query methods.\n  2. Update service layer to use new repository.\n  3. Write unit tests asserting CRUD & user-scoped behavior.");
}
