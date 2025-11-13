/**
 * Repository Pattern Detection Utility
 * 
 * Analyzes the existing codebase to determine:
 * - Which base repository class is used (BaseRepository, KVRepository, etc.)
 * - Standard import paths for repositories
 * - Constructor signature patterns
 * - Common method patterns
 * 
 * Usage:
 *   deno run -A scripts/detect-repository-pattern.ts
 */

export interface RepositoryPattern {
  baseClass: string;
  importPath: string;
  constructorPattern: 'kv-instance' | 'options-object' | 'none';
  commonMethods: string[];
  exampleFile: string;
  kvAccessPattern: 'this.kv' | 'this.getKv()' | 'await this.getKv()';
}

export async function detectRepositoryPattern(): Promise<RepositoryPattern> {
  const repositoryFiles: string[] = [];
  
  // Find all repository files
  try {
    for await (const entry of Deno.readDir('shared/repositories')) {
      if (entry.isFile && entry.name.endsWith('-repository.ts') && !entry.name.includes('base-repository')) {
        repositoryFiles.push(`shared/repositories/${entry.name}`);
      }
    }
  } catch (error) {
    throw new Error(`Failed to read repositories directory: ${error.message}`);
  }
  
  if (repositoryFiles.length === 0) {
    throw new Error('No repository files found in shared/repositories');
  }
  
  // Analyze first repository file as example
  const exampleFile = repositoryFiles[0];
  const content = await Deno.readTextFile(exampleFile);
  
  // Detect base class
  const baseClassMatch = content.match(/extends\s+(\w+Repository|\w+)</) || content.match(/extends\s+(\w+)</);
  const baseClass = baseClassMatch ? baseClassMatch[1] : 'BaseRepository';
  
  // Detect import path
  const importMatch = content.match(/import\s+{[^}]*(?:BaseRepository|KVRepository)[^}]*}\s+from\s+["']([^"']+)["']/);
  const importPath = importMatch ? importMatch[1] : './base-repository.ts';
  
  // Detect constructor pattern
  let constructorPattern: RepositoryPattern['constructorPattern'] = 'none';
  if (content.includes('constructor(options?: { kv?: Deno.Kv })') || content.includes('constructor(options?:')) {
    constructorPattern = 'options-object';
  } else if (content.includes('constructor(kv: Deno.Kv)')) {
    constructorPattern = 'kv-instance';
  }
  
  // Detect KV access pattern
  let kvAccessPattern: RepositoryPattern['kvAccessPattern'] = 'await this.getKv()';
  if (content.includes('await this.getKv()')) {
    kvAccessPattern = 'await this.getKv()';
  } else if (content.includes('this.getKv()')) {
    kvAccessPattern = 'this.getKv()';
  } else if (content.includes('this.kv')) {
    kvAccessPattern = 'this.kv';
  }
  
  // Detect common methods
  const methodMatches = content.matchAll(/(?:async\s+)?(\w+)\s*\([^)]*\)\s*:/g);
  const allMethods = Array.from(methodMatches).map(m => m[1]);
  const commonMethods = [...new Set(allMethods)].filter(m => 
    !['constructor', 'getKv', 'get', 'set', 'delete', 'list'].includes(m)
  );
  
  return {
    baseClass,
    importPath,
    constructorPattern,
    commonMethods: commonMethods.slice(0, 10), // Top 10 methods
    exampleFile,
    kvAccessPattern
  };
}

export function generateRepositoryTemplate(
  pattern: RepositoryPattern,
  entityName: string,
  interfaceName: string
): string {
  const className = `${entityName}Repository`;
  const keyPrefix = entityName.toLowerCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '');
  
  let constructorCode: string;
  let superCall: string;
  
  if (pattern.constructorPattern === 'options-object') {
    constructorCode = `  constructor(options?: { kv?: Deno.Kv }) {
    super("${keyPrefix}", options);
  }`;
  } else if (pattern.constructorPattern === 'kv-instance') {
    constructorCode = `  constructor(kv: Deno.Kv) {
    super(kv, "${keyPrefix}s");
  }`;
  } else {
    constructorCode = `  constructor() {
    super("${keyPrefix}");
  }`;
  }
  
  return `/**
 * ${entityName} Repository
 * 
 * Handles data access for ${entityName.toLowerCase()} entities.
 */

import { ${pattern.baseClass} } from "${pattern.importPath}";

export interface ${interfaceName} {
  id: string;
  // Add your entity properties here
  createdAt: Date;
  updatedAt: Date;
}

export class ${className} extends ${pattern.baseClass}<${interfaceName}> {
${constructorCode}

  async findById(id: string): Promise<${interfaceName} | null> {
    return await this.get(["${keyPrefix}s", id]);
  }

  async create(data: Omit<${interfaceName}, "id" | "createdAt" | "updatedAt">): Promise<${interfaceName}> {
    const id = crypto.randomUUID();
    const now = new Date();
    
    const entity: ${interfaceName} = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await this.set(["${keyPrefix}s", id], entity);
    return entity;
  }

  async update(id: string, updates: Partial<Omit<${interfaceName}, "id" | "createdAt">>): Promise<${interfaceName} | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: ${interfaceName} = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    await this.set(["${keyPrefix}s", id], updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const entity = await this.findById(id);
    if (!entity) return false;

    await this.delete(["${keyPrefix}s", id]);
    return true;
  }

  async findAll(): Promise<${interfaceName}[]> {
    const result = await this.list(["${keyPrefix}s"]);
    return result.items;
  }
}
`;
}

// CLI Usage
if (import.meta.main) {
  try {
    const pattern = await detectRepositoryPattern();
    console.log('📊 Repository Pattern Detected:\n');
    console.log(`Base Class: ${pattern.baseClass}`);
    console.log(`Import Path: ${pattern.importPath}`);
    console.log(`Constructor Pattern: ${pattern.constructorPattern}`);
    console.log(`KV Access Pattern: ${pattern.kvAccessPattern}`);
    console.log(`Example File: ${pattern.exampleFile}`);
    console.log(`\nCommon Methods (${pattern.commonMethods.length}):`);
    pattern.commonMethods.forEach(method => console.log(`  - ${method}`));
    
    console.log('\n✅ Pattern detection complete');
    
    // Optionally generate a template
    if (Deno.args.includes('--generate-template')) {
      const entityName = Deno.args[Deno.args.indexOf('--generate-template') + 1] || 'Example';
      const template = generateRepositoryTemplate(pattern, entityName, entityName);
      console.log('\n📝 Generated Template:\n');
      console.log(template);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    Deno.exit(1);
  }
}
