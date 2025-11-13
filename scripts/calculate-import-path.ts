/**
 * Import Path Calculator
 * 
 * Automatically calculates correct relative import paths based on:
 * - Source file location
 * - Target file location
 * - Project structure conventions
 * 
 * Usage:
 *   import { calculateImportPath } from './scripts/calculate-import-path.ts';
 *   const path = calculateImportPath('frontend/routes/api/dashboard/overview.ts', 'shared/services/ai-task-dashboard.service.ts');
 */

import { dirname, normalize, relative, resolve } from "https://deno.land/std@0.208.0/path/mod.ts";

export function calculateImportPath(fromFile: string, toFile: string): string {
  // Normalize paths (handle both forward and back slashes)
  const from = normalize(fromFile).replace(/\\/g, '/');
  const to = normalize(toFile).replace(/\\/g, '/');
  
  // Get directory of source file
  const fromDir = dirname(from);
  
  // Calculate relative path
  let relativePath = relative(fromDir, to);
  
  // Convert Windows backslashes to forward slashes
  relativePath = relativePath.replace(/\\/g, '/');
  
  // Ensure path starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  
  return relativePath;
}

export async function validateImportPath(fromFile: string, importPath: string): Promise<boolean> {
  try {
    const fromDir = dirname(normalize(fromFile));
    const resolvedPath = resolve(fromDir, importPath);
    
    // Check if file exists
    const stat = await Deno.stat(resolvedPath);
    return stat.isFile;
  } catch {
    return false;
  }
}

export async function suggestImportPath(fromFile: string, targetModuleName: string): Promise<string[]> {
  const suggestions: string[] = [];
  
  // Common patterns for different module types
  const patterns = [
    `shared/services/${targetModuleName}.service.ts`,
    `shared/services/${targetModuleName}.ts`,
    `shared/repositories/${targetModuleName}.repository.ts`,
    `shared/repositories/${targetModuleName}-repository.ts`,
    `shared/repositories/${targetModuleName}.ts`,
    `shared/lib/${targetModuleName}.ts`,
    `shared/types/${targetModuleName}.ts`,
    `shared/types/${targetModuleName}.d.ts`,
  ];
  
  for (const pattern of patterns) {
    try {
      const stat = await Deno.stat(pattern);
      if (stat.isFile) {
        const importPath = calculateImportPath(fromFile, pattern);
        suggestions.push(importPath);
      }
    } catch {
      // File doesn't exist, skip
    }
  }
  
  return suggestions;
}

export interface ImportPathMap {
  [fromFile: string]: {
    [moduleName: string]: string;
  };
}

export async function buildImportPathMap(rootDir: string = '.'): Promise<ImportPathMap> {
  const map: ImportPathMap = {};
  
  // Find all TypeScript files
  const tsFiles: string[] = [];
  
  async function walkDir(dir: string) {
    for await (const entry of Deno.readDir(dir)) {
      const path = `${dir}/${entry.name}`;
      
      if (entry.isDirectory && !['node_modules', '.git', 'dist', 'coverage'].includes(entry.name)) {
        await walkDir(path);
      } else if (entry.isFile && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        tsFiles.push(path);
      }
    }
  }
  
  await walkDir(rootDir);
  
  // Build map for each file
  for (const fromFile of tsFiles) {
    map[fromFile] = {};
    
    for (const toFile of tsFiles) {
      if (fromFile !== toFile) {
        const moduleName = toFile.split('/').pop()?.replace(/\.(ts|tsx)$/, '') || '';
        map[fromFile][moduleName] = calculateImportPath(fromFile, toFile);
      }
    }
  }
  
  return map;
}

export function generateImportStatement(
  fromFile: string,
  toFile: string,
  imports: string[]
): string {
  const importPath = calculateImportPath(fromFile, toFile);
  const importList = imports.join(', ');
  
  return `import { ${importList} } from "${importPath}";`;
}

// CLI Usage
if (import.meta.main) {
  const [command, ...args] = Deno.args;
  
  if (command === 'calculate') {
    const [from, to] = args;
    
    if (!from || !to) {
      console.error('Usage: deno run -A calculate-import-path.ts calculate <from-file> <to-file>');
      Deno.exit(1);
    }
    
    const path = calculateImportPath(from, to);
    console.log(`Import path: ${path}`);
    
    const isValid = await validateImportPath(from, path);
    console.log(`Valid: ${isValid ? '✅' : '❌'}`);
  } else if (command === 'suggest') {
    const [from, module] = args;
    
    if (!from || !module) {
      console.error('Usage: deno run -A calculate-import-path.ts suggest <from-file> <module-name>');
      Deno.exit(1);
    }
    
    const suggestions = await suggestImportPath(from, module);
    
    if (suggestions.length > 0) {
      console.log(`Found ${suggestions.length} possible import(s):`);
      suggestions.forEach(s => console.log(`  ${s}`));
    } else {
      console.log('No matching files found');
    }
  } else if (command === 'generate') {
    const [from, to, ...imports] = args;
    
    if (!from || !to || imports.length === 0) {
      console.error('Usage: deno run -A calculate-import-path.ts generate <from-file> <to-file> <import1> [import2...]');
      Deno.exit(1);
    }
    
    const statement = generateImportStatement(from, to, imports);
    console.log(statement);
  } else {
    console.error('Usage: deno run -A calculate-import-path.ts <calculate|suggest|generate> [args...]');
    console.error('');
    console.error('Commands:');
    console.error('  calculate <from> <to>           - Calculate import path');
    console.error('  suggest <from> <module>         - Suggest import paths for module');
    console.error('  generate <from> <to> <imports>  - Generate import statement');
    Deno.exit(1);
  }
}
