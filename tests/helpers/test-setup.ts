/**
 * Test Setup Utilities
 * Common test helpers and configuration for unit and integration tests
 */

import { assertEquals, assertExists, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { cleanupMockKv, createMockKv, MockKv } from "./kv-mock.ts";

export { assertEquals, assertExists, assertRejects, cleanupMockKv, createMockKv, MockKv };

/**
 * Test context that includes common dependencies
 */
export interface TestContext {
  kv: MockKv;
  cleanup: () => void;
}

/**
 * Creates a test context with a fresh mock KV instance
 */
export async function createTestContext(): Promise<TestContext> {
  const kv = createMockKv();

  return {
    kv,
    cleanup: () => {
      cleanupMockKv(kv);
    },
  };
}

/**
 * Wrapper for test functions that provides automatic setup/teardown
 */
export async function withTestContext<T>(
  fn: (ctx: TestContext) => Promise<T> | T
): Promise<T> {
  const ctx = await createTestContext();
  try {
    return await fn(ctx);
  } finally {
    ctx.cleanup();
  }
}

/**
 * Delays execution for testing async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Waits for a condition to become true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await delay(interval);
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Creates a spy function for testing callbacks
 */
export function createSpy<T extends (...args: any[]) => any>(): {
  fn: T;
  calls: Array<Parameters<T>>;
  callCount: number;
  reset: () => void;
} {
  const calls: Array<Parameters<T>> = [];

  const fn = ((...args: Parameters<T>) => {
    calls.push(args);
  }) as T;

  return {
    fn,
    calls,
    get callCount() {
      return calls.length;
    },
    reset() {
      calls.length = 0;
    },
  };
}

/**
 * Creates a stub function that returns specified values
 */
export function createStub<T extends (...args: any[]) => any>(
  returnValue: ReturnType<T> | ((...args: Parameters<T>) => ReturnType<T>)
): {
  fn: T;
  calls: Array<Parameters<T>>;
  callCount: number;
  reset: () => void;
  setReturnValue: (value: ReturnType<T> | ((...args: Parameters<T>) => ReturnType<T>)) => void;
} {
  const calls: Array<Parameters<T>> = [];
  let currentReturnValue = returnValue;

  const fn = ((...args: Parameters<T>) => {
    calls.push(args);
    return typeof currentReturnValue === "function"
      ? currentReturnValue(...args)
      : currentReturnValue;
  }) as T;

  return {
    fn,
    calls,
    get callCount() {
      return calls.length;
    },
    reset() {
      calls.length = 0;
    },
    setReturnValue(value) {
      currentReturnValue = value;
    },
  };
}

/**
 * Generates a random ID for testing
 */
export function generateTestId(prefix = "test"): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

/**
 * Creates test data with common fields
 */
export function createTestEntity<T extends Record<string, any>>(
  overrides: Partial<T> = {}
): T {
  return {
    id: generateTestId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as T;
}

/**
 * Seeds mock KV with test data
 */
export async function seedTestData<T>(
  kv: MockKv,
  prefix: string[],
  data: T[]
): Promise<void> {
  for (const item of data) {
    const id = (item as any).id;
    await kv.set([...prefix, id], item);
  }
}

/**
 * Asserts that an error is thrown with a specific message
 */
export async function assertThrowsAsync(
  fn: () => Promise<unknown>,
  expectedMessage?: string | RegExp
): Promise<void> {
  let error: Error | null = null;
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  if (!error) {
    throw new Error("Expected function to throw an error, but it didn't");
  }

  if (expectedMessage) {
    const message = error.message;
    if (typeof expectedMessage === "string") {
      if (!message.includes(expectedMessage)) {
        throw new Error(
          `Expected error message to include "${expectedMessage}", but got "${message}"`
        );
      }
    } else {
      if (!expectedMessage.test(message)) {
        throw new Error(
          `Expected error message to match ${expectedMessage}, but got "${message}"`
        );
      }
    }
  }
}

/**
 * Asserts that a value is of a specific type
 */
export function assertType<T>(
  value: unknown,
  type: "string" | "number" | "boolean" | "object" | "array" | "function"
): asserts value is T {
  const actualType = Array.isArray(value) ? "array" : typeof value;
  if (actualType !== type) {
    throw new Error(`Expected type ${type}, but got ${actualType}`);
  }
}

/**
 * Asserts that an object has specific properties
 */
export function assertHasProperties<T extends Record<string, any>>(
  obj: unknown,
  properties: Array<keyof T>
): asserts obj is T {
  if (typeof obj !== "object" || obj === null) {
    throw new Error("Expected an object");
  }

  for (const prop of properties) {
    if (!(prop in obj)) {
      throw new Error(`Expected object to have property "${String(prop)}"`);
    }
  }
}

/**
 * Test fixture loader for common test scenarios
 */
export class TestFixture {
  constructor(private kv: MockKv) {}

  /**
   * Loads user test data
   */
  async loadUsers(count = 3): Promise<void> {
    const users = Array.from({ length: count }, (_, i) => ({
      id: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      name: `Test User ${i + 1}`,
      role: i === 0 ? "admin" : "user",
      createdAt: new Date().toISOString(),
    }));

    await seedTestData(this.kv, ["users"], users);
  }

  /**
   * Loads task test data
   */
  async loadTasks(count = 5): Promise<void> {
    const statuses = ["pending", "in_progress", "completed"];
    const tasks = Array.from({ length: count }, (_, i) => ({
      id: `task${i + 1}`,
      title: `Test Task ${i + 1}`,
      description: `Description for task ${i + 1}`,
      status: statuses[i % statuses.length],
      assigneeId: `user${(i % 3) + 1}`,
      createdAt: new Date().toISOString(),
    }));

    await seedTestData(this.kv, ["tasks"], tasks);
  }

  /**
   * Loads notification test data
   */
  async loadNotifications(count = 10): Promise<void> {
    const notifications = Array.from({ length: count }, (_, i) => ({
      id: `notif${i + 1}`,
      userId: `user${(i % 3) + 1}`,
      message: `Test notification ${i + 1}`,
      type: i % 2 === 0 ? "info" : "warning",
      read: i % 3 === 0,
      createdAt: new Date().toISOString(),
    }));

    await seedTestData(this.kv, ["notifications"], notifications);
  }

  /**
   * Loads all common fixtures
   */
  async loadAll(): Promise<void> {
    await this.loadUsers();
    await this.loadTasks();
    await this.loadNotifications();
  }
}

/**
 * Creates a test fixture with mock data
 */
export async function withFixture(
  kv: MockKv,
  fixtures: Array<"users" | "tasks" | "notifications" | "all">
): Promise<TestFixture> {
  const fixture = new TestFixture(kv);

  for (const name of fixtures) {
    if (name === "all") {
      await fixture.loadAll();
    } else if (name === "users") {
      await fixture.loadUsers();
    } else if (name === "tasks") {
      await fixture.loadTasks();
    } else if (name === "notifications") {
      await fixture.loadNotifications();
    }
  }

  return fixture;
}

/**
 * Performance testing helper
 */
export async function measurePerformance<T>(
  fn: () => Promise<T> | T,
  iterations = 1
): Promise<{ result: T; avgDuration: number; minDuration: number; maxDuration: number }> {
  const durations: number[] = [];
  let result: T;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    result = await fn();
    const duration = performance.now() - start;
    durations.push(duration);
  }

  return {
    result: result!,
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
  };
}

/**
 * Snapshot testing helper
 */
export class SnapshotTester {
  private snapshots = new Map<string, any>();

  /**
   * Saves a snapshot
   */
  save(name: string, value: any): void {
    this.snapshots.set(name, structuredClone(value));
  }

  /**
   * Compares current value with saved snapshot
   */
  compare(name: string, value: any): boolean {
    const snapshot = this.snapshots.get(name);
    if (!snapshot) {
      throw new Error(`Snapshot "${name}" not found`);
    }
    return JSON.stringify(snapshot) === JSON.stringify(value);
  }

  /**
   * Asserts that current value matches snapshot
   */
  assertMatch(name: string, value: any): void {
    if (!this.compare(name, value)) {
      const snapshot = this.snapshots.get(name);
      throw new Error(
        `Snapshot mismatch for "${name}":\nExpected: ${JSON.stringify(snapshot, null, 2)}\nActual: ${JSON.stringify(value, null, 2)}`
      );
    }
  }

  /**
   * Clears all snapshots
   */
  clear(): void {
    this.snapshots.clear();
  }
}

/**
 * Creates a snapshot tester
 */
export function createSnapshotTester(): SnapshotTester {
  return new SnapshotTester();
}
