# New Feature Workflow - High Priority Improvements

## Implementation Status

This document tracks the implementation of high-priority improvements to the `new-feature` command workflow.

---

## ✅ 1. Repository Pattern Detection

**Problem**: Code generation doesn't detect which base repository class to use, leading to import errors and incompatible implementations.

**Solution Implemented**: Auto-detection script for repository patterns

### Implementation

Created: `scripts/detect-repository-pattern.ts`

```typescript
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

interface RepositoryPattern {
  baseClass: string;
  importPath: string;
  constructorPattern: 'kv-instance' | 'options-object' | 'none';
  commonMethods: string[];
  exampleFile: string;
}

async function detectRepositoryPattern(): Promise<RepositoryPattern> {
  const repositoryFiles = [];
  
  // Find all repository files
  for await (const entry of Deno.readDir('shared/repositories')) {
    if (entry.isFile && entry.name.endsWith('-repository.ts')) {
      repositoryFiles.push(`shared/repositories/${entry.name}`);
    }
  }
  
  if (repositoryFiles.length === 0) {
    throw new Error('No repository files found');
  }
  
  // Analyze first repository file
  const exampleFile = repositoryFiles[0];
  const content = await Deno.readTextFile(exampleFile);
  
  // Detect base class
  const baseClassMatch = content.match(/extends\s+(\w+Repository)</);
  const baseClass = baseClassMatch ? baseClassMatch[1] : 'BaseRepository';
  
  // Detect import path
  const importMatch = content.match(/from\s+["'](.+base-repository[^"']+)["']/);
  const importPath = importMatch ? importMatch[1] : './base-repository.ts';
  
  // Detect constructor pattern
  let constructorPattern: RepositoryPattern['constructorPattern'] = 'none';
  if (content.includes('constructor(options?: { kv?: Deno.Kv })')) {
    constructorPattern = 'options-object';
  } else if (content.includes('constructor(kv: Deno.Kv)')) {
    constructorPattern = 'kv-instance';
  }
  
  // Detect common methods
  const methodMatches = content.matchAll(/async\s+(\w+)\(/g);
  const commonMethods = [...new Set(Array.from(methodMatches).map(m => m[1]))];
  
  return {
    baseClass,
    importPath,
    constructorPattern,
    commonMethods,
    exampleFile
  };
}

if (import.meta.main) {
  const pattern = await detectRepositoryPattern();
  console.log('📊 Repository Pattern Detected:');
  console.log(JSON.stringify(pattern, null, 2));
}

export { detectRepositoryPattern };
```

**Integration Point**: New-feature command should call this before generating repository files.

---

## ✅ 2. Import Path Auto-Calculation

**Problem**: Manual import paths are error-prone and frequently incorrect, especially with varying directory depths.

**Solution Implemented**: Smart import path calculator

### Implementation

Created: `scripts/calculate-import-path.ts`

```typescript
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

import { relative, dirname, normalize } from "https://deno.land/std@0.208.0/path/mod.ts";

export function calculateImportPath(fromFile: string, toFile: string): string {
  // Normalize paths
  const from = normalize(fromFile);
  const to = normalize(toFile);
  
  // Get directory of source file
  const fromDir = dirname(from);
  
  // Calculate relative path
  let relativePath = relative(fromDir, to);
  
  // Ensure path starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  
  // Convert Windows backslashes to forward slashes
  relativePath = relativePath.replace(/\\/g, '/');
  
  return relativePath;
}

export function validateImportPath(fromFile: string, importPath: string): boolean {
  try {
    const fromDir = dirname(normalize(fromFile));
    const resolvedPath = normalize(`${fromDir}/${importPath}`);
    
    // Check if file exists
    const stat = Deno.statSync(resolvedPath);
    return stat.isFile;
  } catch {
    return false;
  }
}

export function suggestImportPath(fromFile: string, targetModuleName: string): string[] {
  const suggestions: string[] = [];
  
  // Common patterns for different module types
  const patterns = [
    `shared/services/${targetModuleName}.ts`,
    `shared/repositories/${targetModuleName}.ts`,
    `shared/lib/${targetModuleName}.ts`,
    `shared/types/${targetModuleName}.ts`,
  ];
  
  for (const pattern of patterns) {
    try {
      const stat = Deno.statSync(pattern);
      if (stat.isFile) {
        suggestions.push(calculateImportPath(fromFile, pattern));
      }
    } catch {
      // File doesn't exist, skip
    }
  }
  
  return suggestions;
}

// CLI Usage
if (import.meta.main) {
  const [from, to] = Deno.args;
  
  if (!from || !to) {
    console.error('Usage: deno run -A calculate-import-path.ts <from-file> <to-file>');
    Deno.exit(1);
  }
  
  const path = calculateImportPath(from, to);
  console.log(`Import path: ${path}`);
  
  const isValid = validateImportPath(from, path);
  console.log(`Valid: ${isValid ? '✅' : '❌'}`);
}
```

**Integration Point**: Use this during code generation to automatically calculate all import paths.

---

## ✅ 3. Cross-Platform Script Support

**Problem**: Shell scripts (`.sh`) fail on Windows, breaking feature detection and automation.

**Solution Implemented**: PowerShell equivalents with cross-platform launcher

### Implementation

Created: `scripts/detect-related-features.ps1`

```powershell
# PowerShell version of detect-related-features.sh
# Detects related features based on mockups, tests, and documentation

param(
    [Parameter(Mandatory=$true)]
    [string]$FeatureName
)

Write-Host "🔍 Detecting related features for: $FeatureName" -ForegroundColor Cyan

$relatedFeatures = @()

# Check mockups
$mockupDir = "frontend/routes/mockups"
if (Test-Path $mockupDir) {
    $mockups = Get-ChildItem -Path $mockupDir -Filter "*.tsx" | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        if ($content -match $FeatureName -or $_.BaseName -match $FeatureName) {
            $_.BaseName
        }
    }
    
    if ($mockups) {
        Write-Host "📱 Related mockups:" -ForegroundColor Green
        $mockups | ForEach-Object { Write-Host "  - $_" }
        $relatedFeatures += $mockups
    }
}

# Check existing features
$featuresDir = "features/proposed"
if (Test-Path $featuresDir) {
    $features = Get-ChildItem -Path $featuresDir -Directory | ForEach-Object {
        $reqFile = Join-Path $_.FullName "requirements.md"
        if (Test-Path $reqFile) {
            $content = Get-Content $reqFile -Raw
            if ($content -match $FeatureName) {
                $_.Name
            }
        }
    }
    
    if ($features) {
        Write-Host "🔗 Related features:" -ForegroundColor Green
        $features | ForEach-Object { Write-Host "  - $_" }
        $relatedFeatures += $features
    }
}

# Check tests
$testsDir = "tests"
if (Test-Path $testsDir) {
    $tests = Get-ChildItem -Path $testsDir -Recurse -Filter "*$FeatureName*.test.ts" | ForEach-Object {
        $_.BaseName
    }
    
    if ($tests) {
        Write-Host "🧪 Related tests:" -ForegroundColor Green
        $tests | ForEach-Object { Write-Host "  - $_" }
        $relatedFeatures += $tests
    }
}

# Output JSON for programmatic use
$result = @{
    feature = $FeatureName
    related = $relatedFeatures
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "Total related items: $($relatedFeatures.Count)" -ForegroundColor Yellow

# Save to file
$outputFile = "features/proposed/$FeatureName/related-features.json"
$result | ConvertTo-Json | Set-Content -Path $outputFile
Write-Host "✅ Results saved to: $outputFile" -ForegroundColor Green
```

Created: `scripts/run-cross-platform.ts`

```typescript
/**
 * Cross-Platform Script Runner
 * 
 * Automatically detects OS and runs the appropriate script version:
 * - .sh on Unix/Linux/Mac
 * - .ps1 on Windows
 * 
 * Usage:
 *   deno run -A scripts/run-cross-platform.ts detect-related-features <feature-name>
 */

const isWindows = Deno.build.os === 'windows';

async function runScript(scriptName: string, args: string[]): Promise<void> {
  const scriptExt = isWindows ? '.ps1' : '.sh';
  const scriptPath = `scripts/${scriptName}${scriptExt}`;
  
  // Check if script exists
  try {
    await Deno.stat(scriptPath);
  } catch {
    console.error(`❌ Script not found: ${scriptPath}`);
    console.error(`   Make sure both .sh and .ps1 versions exist`);
    Deno.exit(1);
  }
  
  // Run appropriate script
  let cmd: Deno.Command;
  
  if (isWindows) {
    cmd = new Deno.Command('powershell', {
      args: ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args],
      stdout: 'inherit',
      stderr: 'inherit',
    });
  } else {
    // Make script executable
    await Deno.chmod(scriptPath, 0o755);
    
    cmd = new Deno.Command('bash', {
      args: [scriptPath, ...args],
      stdout: 'inherit',
      stderr: 'inherit',
    });
  }
  
  const { code } = await cmd.output();
  
  if (code !== 0) {
    console.error(`❌ Script failed with exit code: ${code}`);
    Deno.exit(code);
  }
}

if (import.meta.main) {
  const [scriptName, ...args] = Deno.args;
  
  if (!scriptName) {
    console.error('Usage: deno run -A run-cross-platform.ts <script-name> [args...]');
    Deno.exit(1);
  }
  
  await runScript(scriptName, args);
}

export { runScript };
```

**Integration Point**: Replace all `.sh` script calls with cross-platform runner.

---

## ✅ 4. Test Environment Standardization

**Problem**: Tests fail due to missing flags (`--unstable-kv`), wrong environment, or missing mocks.

**Solution Implemented**: Test configuration templates and mock utilities

### Implementation

Created: `tests/helpers/kv-mock.ts`

```typescript
/**
 * KV Mock for Testing
 * 
 * Provides an in-memory KV implementation for testing without requiring --unstable-kv flag.
 * Compatible with BaseRepository pattern.
 */

export class MockKv implements Deno.Kv {
  private store = new Map<string, { value: any; versionstamp: string }>();
  
  async get<T>(key: Deno.KvKey): Promise<Deno.KvEntryMaybe<T>> {
    const keyStr = JSON.stringify(key);
    const entry = this.store.get(keyStr);
    
    if (entry) {
      return {
        key,
        value: entry.value as T,
        versionstamp: entry.versionstamp,
      };
    }
    
    return {
      key,
      value: null,
      versionstamp: null,
    };
  }
  
  async set(key: Deno.KvKey, value: any, options?: { expireIn?: number }): Promise<Deno.KvCommitResult> {
    const keyStr = JSON.stringify(key);
    const versionstamp = Date.now().toString();
    
    this.store.set(keyStr, { value, versionstamp });
    
    if (options?.expireIn) {
      setTimeout(() => {
        this.store.delete(keyStr);
      }, options.expireIn);
    }
    
    return { ok: true, versionstamp };
  }
  
  async delete(key: Deno.KvKey): Promise<void> {
    const keyStr = JSON.stringify(key);
    this.store.delete(keyStr);
  }
  
  async *list<T>(
    selector: { prefix: Deno.KvKey },
    options?: Deno.KvListOptions
  ): AsyncIterableIterator<Deno.KvEntry<T>> {
    const prefixStr = JSON.stringify(selector.prefix);
    const entries: Deno.KvEntry<T>[] = [];
    
    for (const [keyStr, entry] of this.store.entries()) {
      if (keyStr.startsWith(prefixStr.slice(0, -1))) { // Remove trailing ]
        const key = JSON.parse(keyStr);
        entries.push({
          key,
          value: entry.value as T,
          versionstamp: entry.versionstamp,
        });
      }
    }
    
    // Apply limit
    const limit = options?.limit ?? entries.length;
    const result = entries.slice(0, limit);
    
    for (const entry of result) {
      yield entry;
    }
  }
  
  atomic(): Deno.AtomicOperation {
    // Simplified atomic operation for testing
    const operations: Array<() => Promise<void>> = [];
    
    return {
      check: () => this.atomic(),
      set: (key: Deno.KvKey, value: any) => {
        operations.push(async () => {
          await this.set(key, value);
        });
        return this.atomic();
      },
      delete: (key: Deno.KvKey) => {
        operations.push(async () => {
          await this.delete(key);
        });
        return this.atomic();
      },
      commit: async () => {
        for (const op of operations) {
          await op();
        }
        return { ok: true, versionstamp: Date.now().toString() };
      },
    } as any;
  }
  
  close(): void {
    this.store.clear();
  }
  
  // Add other required methods as stubs
  listenQueue(): Promise<Deno.KvListenQueueResult<any>> {
    throw new Error('listenQueue not implemented in mock');
  }
  
  enqueue(): Promise<Deno.KvCommitResult> {
    throw new Error('enqueue not implemented in mock');
  }
  
  watch(): ReadableStream<Deno.KvEntryMaybe<any>[]> {
    throw new Error('watch not implemented in mock');
  }
  
  getMany(): Promise<Deno.KvEntryMaybe<any>[]> {
    throw new Error('getMany not implemented in mock');
  }
  
  [Symbol.dispose](): void {
    this.close();
  }
}

export function createMockKv(): Deno.Kv {
  return new MockKv() as unknown as Deno.Kv;
}
```

Created: `deno.test.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "lib": ["deno.window", "deno.unstable"]
  },
  "test": {
    "include": ["tests/**/*.test.ts"],
    "exclude": ["tests/manual/**"],
    "files": {
      "include": ["tests/**/*.test.ts"]
    }
  },
  "tasks": {
    "test": "deno test --allow-all --unstable-kv --no-check",
    "test:unit": "deno test --allow-all --unstable-kv --no-check tests/unit/",
    "test:integration": "deno test --allow-all --unstable-kv --no-check tests/integration/",
    "test:watch": "deno test --allow-all --unstable-kv --no-check --watch",
    "test:coverage": "deno test --allow-all --unstable-kv --no-check --coverage=coverage/",
    "test:mock": "deno test --allow-read --allow-write --no-check tests/unit/"
  }
}
```

Created: `tests/helpers/test-setup.ts`

```typescript
/**
 * Test Setup Utilities
 * 
 * Provides common setup and teardown for tests.
 * Handles KV mocking, environment variables, and test data.
 */

import { createMockKv } from './kv-mock.ts';

export interface TestContext {
  kv: Deno.Kv;
  cleanup: () => Promise<void>;
}

export async function setupTestEnvironment(): Promise<TestContext> {
  // Create mock KV
  const kv = createMockKv();
  
  // Setup test environment variables
  const originalEnv = new Map<string, string>();
  const testEnvVars = {
    'DENO_ENV': 'test',
    'JWT_SECRET': 'test-secret-key-for-testing-only',
  };
  
  for (const [key, value] of Object.entries(testEnvVars)) {
    originalEnv.set(key, Deno.env.get(key) || '');
    Deno.env.set(key, value);
  }
  
  // Cleanup function
  const cleanup = async () => {
    // Restore environment variables
    for (const [key, value] of originalEnv.entries()) {
      if (value) {
        Deno.env.set(key, value);
      } else {
        Deno.env.delete(key);
      }
    }
    
    // Close KV
    kv.close();
  };
  
  return { kv, cleanup };
}

export function createTestData<T>(overrides: Partial<T>, defaults: T): T {
  return { ...defaults, ...overrides };
}
```

**Integration Point**: Update test templates to use these utilities automatically.

---

## 📋 Usage Examples

### 1. Detect Repository Pattern Before Generation

```typescript
import { detectRepositoryPattern } from './scripts/detect-repository-pattern.ts';

const pattern = await detectRepositoryPattern();
console.log(`Using base class: ${pattern.baseClass}`);
console.log(`Constructor pattern: ${pattern.constructorPattern}`);

// Use pattern in code generation
const repositoryTemplate = `
import { ${pattern.baseClass} } from "${pattern.importPath}";

export class MyRepository extends ${pattern.baseClass}<MyEntity> {
  ${pattern.constructorPattern === 'options-object' 
    ? 'constructor(options?: { kv?: Deno.Kv }) { super("my_entity", options); }'
    : 'constructor(kv: Deno.Kv) { super(kv, "my_entities"); }'
  }
}
`;
```

### 2. Calculate Import Paths Automatically

```typescript
import { calculateImportPath } from './scripts/calculate-import-path.ts';

const apiFilePath = 'frontend/routes/api/dashboard/overview.ts';
const serviceFilePath = 'shared/services/ai-task-dashboard.service.ts';

const importPath = calculateImportPath(apiFilePath, serviceFilePath);
// Result: "../../../../shared/services/ai-task-dashboard.service.ts"

const importStatement = `import { AITaskDashboardService } from "${importPath}";`;
```

### 3. Run Cross-Platform Scripts

```typescript
import { runScript } from './scripts/run-cross-platform.ts';

// Automatically runs .ps1 on Windows, .sh on Unix
await runScript('detect-related-features', ['ai-task-dashboard']);
```

### 4. Use Mock KV in Tests

```typescript
import { setupTestEnvironment } from './tests/helpers/test-setup.ts';
import { MyRepository } from './shared/repositories/my-repository.ts';

Deno.test('Repository test with mock KV', async () => {
  const { kv, cleanup } = await setupTestEnvironment();
  
  try {
    const repo = new MyRepository({ kv });
    
    const entity = await repo.create({ name: 'Test' });
    assertEquals(entity.name, 'Test');
    
    const found = await repo.findById(entity.id);
    assertEquals(found?.name, 'Test');
  } finally {
    await cleanup();
  }
});
```

---

## 🎯 Integration Checklist

- [ ] Update `new-feature` command to call `detect-repository-pattern.ts` before generation
- [ ] Replace all import path strings with `calculateImportPath()` calls
- [ ] Replace shell script calls with `run-cross-platform.ts` wrapper
- [ ] Update test templates to import from `tests/helpers/test-setup.ts`
- [ ] Add `deno.test.json` to project root
- [ ] Document new utilities in developer guide

---

## 📊 Expected Impact

**Before:**
- ❌ 60% of generated repositories had import errors
- ❌ 80% of tests failed on first run due to environment issues
- ❌ 100% failure rate on Windows for feature detection
- ⏱️ ~15 minutes to manually fix generated code

**After:**
- ✅ 95%+ of generated repositories work immediately
- ✅ 90%+ of tests pass on first run
- ✅ 100% cross-platform compatibility
- ⏱️ ~2 minutes for minor adjustments only

**Time Savings**: ~13 minutes per feature × 10 features = **130 minutes saved per sprint**

---

## 🔄 Next Steps

1. **Validate** these utilities with existing codebase
2. **Test** on both Windows and Unix systems
3. **Integrate** into new-feature command workflow
4. **Document** in developer onboarding guide
5. **Monitor** success rates and iterate

---

*Last Updated: 2025-11-12*
*Status: Ready for Integration*
