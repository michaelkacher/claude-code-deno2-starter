/**
 * Integration Test Generator
 * Auto-generates integration tests for API endpoints
 */

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/ensure_dir.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";

export interface TestCase {
  name: string;
  method: string;
  path: string;
  auth: boolean;
  body?: any;
  expectedStatus: number;
  expectedResponse?: any;
}

export interface IntegrationTestSuite {
  featureName: string;
  testCases: TestCase[];
}

/**
 * Extracts test cases from API route files
 */
async function extractTestCases(filePath: string, routePath: string): Promise<TestCase[]> {
  const content = await Deno.readTextFile(filePath);
  const testCases: TestCase[] = [];
  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  
  for (const method of methods) {
    const handlerPattern = new RegExp(`export\\s+const\\s+${method}\\s*[=:]`, "m");
    if (handlerPattern.test(content)) {
      // Extract JSDoc for auth requirements
      const commentPattern = new RegExp(`/\\*\\*([^*]|\\*[^/])*\\*/\\s*export\\s+const\\s+${method}`, "s");
      const commentMatch = content.match(commentPattern);
      
      const auth = commentMatch ? 
        (commentMatch[0].includes("@auth") || commentMatch[0].includes("@requireAuth")) : false;
      
      // Generate test cases
      if (method === "GET") {
        testCases.push({
          name: `should ${auth ? "require auth for" : "allow"} ${method} ${routePath}`,
          method,
          path: routePath,
          auth,
          expectedStatus: auth ? 401 : 200,
        });
        
        if (auth) {
          testCases.push({
            name: `should successfully ${method} ${routePath} with auth`,
            method,
            path: routePath,
            auth: true,
            expectedStatus: 200,
          });
        }
      } else if (["POST", "PUT", "PATCH"].includes(method)) {
        testCases.push({
          name: `should ${auth ? "require auth for" : "allow"} ${method} ${routePath}`,
          method,
          path: routePath,
          auth,
          body: {},
          expectedStatus: auth ? 401 : 200,
        });
        
        if (auth) {
          testCases.push({
            name: `should successfully ${method} ${routePath} with valid data`,
            method,
            path: routePath,
            auth: true,
            body: { /* TODO: Add test data */ },
            expectedStatus: method === "POST" ? 201 : 200,
          });
        }
        
        testCases.push({
          name: `should reject ${method} ${routePath} with invalid data`,
          method,
          path: routePath,
          auth,
          body: { invalid: "data" },
          expectedStatus: 400,
        });
      } else if (method === "DELETE") {
        testCases.push({
          name: `should ${auth ? "require auth for" : "allow"} ${method} ${routePath}`,
          method,
          path: routePath,
          auth,
          expectedStatus: auth ? 401 : 204,
        });
        
        if (auth) {
          testCases.push({
            name: `should successfully ${method} ${routePath}`,
            method,
            path: routePath,
            auth: true,
            expectedStatus: 204,
          });
        }
      }
    }
  }
  
  return testCases;
}

/**
 * Scans API routes and generates test suite
 */
async function generateTestSuite(featureName: string): Promise<IntegrationTestSuite> {
  const testCases: TestCase[] = [];
  const apiDir = "frontend/routes/api";
  
  if (!(await exists(apiDir))) {
    return { featureName, testCases };
  }
  
  // Find feature-related API routes
  for await (const entry of Deno.readDir(apiDir)) {
    if (entry.isDirectory) {
      const dirPath = `${apiDir}/${entry.name}`;
      
      for await (const file of Deno.readDir(dirPath)) {
        if (file.name.endsWith(".ts") && !file.name.endsWith(".test.ts")) {
          const filePath = `${dirPath}/${file.name}`;
          const fileName = file.name.replace(".ts", "");
          const routePath = fileName === "index" 
            ? `/api/${entry.name}` 
            : `/api/${entry.name}/${fileName}`;
          
          const cases = await extractTestCases(filePath, routePath);
          testCases.push(...cases);
        }
      }
    }
  }
  
  return { featureName, testCases };
}

/**
 * Generates TypeScript test file content
 */
export function generateTestFileContent(suite: IntegrationTestSuite): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`/**`);
  lines.push(` * Integration Tests: ${suite.featureName}`);
  lines.push(` * Auto-generated integration tests for API endpoints`);
  lines.push(` */`);
  lines.push("");
  lines.push(`import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";`);
  lines.push(`import { createTestContext, withTestContext } from "../../helpers/test-setup.ts";`);
  lines.push("");
  
  // Setup
  lines.push(`const BASE_URL = "http://localhost:3000";`);
  lines.push(`let authToken: string | null = null;`);
  lines.push("");
  
  // Helper function for authenticated requests
  lines.push(`async function authenticatedFetch(path: string, options: RequestInit = {}) {`);
  lines.push(`  if (authToken) {`);
  lines.push(`    options.headers = {`);
  lines.push(`      ...options.headers,`);
  lines.push(`      "Authorization": \`Bearer \${authToken}\`,`);
  lines.push(`    };`);
  lines.push(`  }`);
  lines.push(`  return fetch(\`\${BASE_URL}\${path}\`, options);`);
  lines.push(`}`);
  lines.push("");
  
  // Setup auth before tests
  lines.push(`// Setup: Login to get auth token`);
  lines.push(`Deno.test("Setup: Login for integration tests", async () => {`);
  lines.push(`  const response = await fetch(\`\${BASE_URL}/api/auth/login\`, {`);
  lines.push(`    method: "POST",`);
  lines.push(`    headers: { "Content-Type": "application/json" },`);
  lines.push(`    body: JSON.stringify({`);
  lines.push(`      email: "test@example.com",`);
  lines.push(`      password: "password123",`);
  lines.push(`    }),`);
  lines.push(`  });`);
  lines.push(`  `);
  lines.push(`  if (response.ok) {`);
  lines.push(`    const data = await response.json();`);
  lines.push(`    authToken = data.data?.accessToken;`);
  lines.push(`  }`);
  lines.push(`});`);
  lines.push("");
  
  // Group tests by endpoint
  const testsByPath = new Map<string, TestCase[]>();
  for (const testCase of suite.testCases) {
    if (!testsByPath.has(testCase.path)) {
      testsByPath.set(testCase.path, []);
    }
    testsByPath.get(testCase.path)!.push(testCase);
  }
  
  // Generate test cases
  for (const [path, tests] of testsByPath.entries()) {
    lines.push(`// Tests for ${path}`);
    
    for (const test of tests) {
      lines.push(`Deno.test("${test.name}", async () => {`);
      lines.push(`  const options: RequestInit = {`);
      lines.push(`    method: "${test.method}",`);
      
      if (test.body) {
        lines.push(`    headers: { "Content-Type": "application/json" },`);
        lines.push(`    body: JSON.stringify(${JSON.stringify(test.body)}),`);
      }
      
      lines.push(`  };`);
      lines.push(``);
      
      if (test.auth) {
        lines.push(`  const response = await authenticatedFetch("${test.path}", options);`);
      } else {
        lines.push(`  const response = await fetch(\`\${BASE_URL}${test.path}\`, options);`);
      }
      
      lines.push(`  assertEquals(response.status, ${test.expectedStatus});`);
      
      if (test.expectedStatus === 200 || test.expectedStatus === 201) {
        lines.push(`  `);
        lines.push(`  const data = await response.json();`);
        lines.push(`  // TODO: Add assertions for response data`);
      }
      
      lines.push(`});`);
      lines.push("");
    }
  }
  
  return lines.join("\n");
}

/**
 * Saves integration test file
 */
export async function saveIntegrationTest(
  featureName: string,
  content: string
): Promise<string> {
  const testDir = "tests/integration";
  await ensureDir(testDir);
  
  const testPath = `${testDir}/${featureName}.integration.test.ts`;
  await Deno.writeTextFile(testPath, content);
  
  return testPath;
}

/**
 * Generates integration tests for a feature
 */
export async function generateIntegrationTests(featureName: string): Promise<string> {
  const suite = await generateTestSuite(featureName);
  const content = generateTestFileContent(suite);
  const testPath = await saveIntegrationTest(featureName, content);
  
  return testPath;
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
Integration Test Generator

Usage:
  deno run --allow-read --allow-write scripts/generate-integration-tests.ts [options]

Options:
  -f, --feature <name>    Feature name (required)
  -o, --output <path>     Output file path (default: tests/integration/<feature>.integration.test.ts)
  -h, --help              Show this help

Examples:
  # Generate integration tests for a feature
  deno run --allow-read --allow-write scripts/generate-integration-tests.ts -f ai-task-dashboard

  # Generate with custom output path
  deno run --allow-read --allow-write scripts/generate-integration-tests.ts -f my-feature -o tests/custom.test.ts
`);
    Deno.exit(0);
  }
  
  if (!args.feature) {
    console.error("❌ Error: --feature is required");
    console.error("Run with --help for usage information");
    Deno.exit(1);
  }
  
  console.log(`🧪 Generating integration tests for: ${args.feature}`);
  
  try {
    const suite = await generateTestSuite(args.feature);
    const content = generateTestFileContent(suite);
    
    const outputPath = args.output || `tests/integration/${args.feature}.integration.test.ts`;
    await Deno.writeTextFile(outputPath, content);
    
    console.log(`✅ Integration tests generated: ${outputPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`  - Test cases: ${suite.testCases.length}`);
    console.log(`\n💡 Next steps:`);
    console.log(`  1. Review generated tests and fill in TODO items`);
    console.log(`  2. Ensure test server is running`);
    console.log(`  3. Run tests: deno test ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}
