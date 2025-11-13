/**
 * Mock Deno KV for Testing
 * Provides in-memory implementation of Deno.Kv interface for unit tests
 */

// Type definitions matching Deno.Kv interface
export type KvKey = Deno.KvKey;
export type KvEntry<T> = Deno.KvEntry<T>;
export type KvListSelector = Deno.KvListSelector;
export type KvListOptions = Deno.KvListOptions;

interface StoredEntry<T> {
  key: KvKey;
  value: T;
  versionstamp: string;
}

/**
 * In-memory mock implementation of Deno.Kv for testing
 */
export class MockKv implements Deno.Kv {
  private store = new Map<string, StoredEntry<unknown>>();
  private versionCounter = 0;
  private watchers = new Map<string, Set<(entries: KvEntry<unknown>[]) => void>>();

  /**
   * Serializes a KV key to a string for storage
   */
  private serializeKey(key: KvKey): string {
    return JSON.stringify(key);
  }

  /**
   * Generates a new versionstamp
   */
  private generateVersionstamp(): string {
    return String(++this.versionCounter).padStart(10, "0");
  }

  /**
   * Gets a value from the store
   */
  async get<T>(key: KvKey): Promise<KvEntry<T>> {
    const serialized = this.serializeKey(key);
    const entry = this.store.get(serialized) as StoredEntry<T> | undefined;

    if (!entry) {
      return {
        key,
        value: null,
        versionstamp: null,
      };
    }

    return {
      key,
      value: entry.value,
      versionstamp: entry.versionstamp,
    };
  }

  /**
   * Gets multiple values in a single operation
   */
  async getMany<T extends readonly unknown[]>(
    keys: readonly [...{ [K in keyof T]: KvKey }]
  ): Promise<{ [K in keyof T]: KvEntry<T[K]> }> {
    const results = await Promise.all(keys.map((key) => this.get(key)));
    return results as { [K in keyof T]: KvEntry<T[K]> };
  }

  /**
   * Sets a value in the store
   */
  async set(key: KvKey, value: unknown): Promise<{ ok: true; versionstamp: string }> {
    const serialized = this.serializeKey(key);
    const versionstamp = this.generateVersionstamp();

    this.store.set(serialized, {
      key,
      value,
      versionstamp,
    });

    // Notify watchers
    this.notifyWatchers(key);

    return { ok: true, versionstamp };
  }

  /**
   * Deletes a value from the store
   */
  async delete(key: KvKey): Promise<void> {
    const serialized = this.serializeKey(key);
    this.store.delete(serialized);

    // Notify watchers
    this.notifyWatchers(key);
  }

  /**
   * Lists entries matching a selector
   */
  list<T>(
    selector: KvListSelector,
    options?: KvListOptions
  ): Deno.KvListIterator<T> {
    const entries: KvEntry<T>[] = [];
    const prefix = "prefix" in selector ? selector.prefix : undefined;
    const start = "start" in selector ? selector.start : undefined;
    const end = "end" in selector ? selector.end : undefined;

    for (const [serialized, entry] of this.store) {
      const key = entry.key;

      // Check prefix match
      if (prefix) {
        const matches = prefix.every((part, i) => key[i] === part);
        if (!matches) continue;
      }

      // Check range
      if (start && this.compareKeys(key, start) < 0) continue;
      if (end && this.compareKeys(key, end) >= 0) continue;

      entries.push({
        key,
        value: entry.value as T,
        versionstamp: entry.versionstamp,
      });
    }

    // Sort entries by key
    entries.sort((a, b) => this.compareKeys(a.key, b.key));

    // Apply reverse if specified
    if (options?.reverse) {
      entries.reverse();
    }

    // Apply limit if specified
    const limit = options?.limit ?? entries.length;
    const limitedEntries = entries.slice(0, limit);

    // Return async iterator
    let index = 0;
    return {
      [Symbol.asyncIterator](): AsyncIterator<KvEntry<T>> {
        return {
          next: async () => {
            if (index < limitedEntries.length) {
              return {
                done: false,
                value: limitedEntries[index++],
              };
            }
            return { done: true, value: undefined };
          },
        };
      },
      get cursor(): string {
        return String(index);
      },
    } as Deno.KvListIterator<T>;
  }

  /**
   * Compares two keys for ordering
   */
  private compareKeys(a: KvKey, b: KvKey): number {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (a[i] < b[i]) return -1;
      if (a[i] > b[i]) return 1;
    }
    return a.length - b.length;
  }

  /**
   * Performs an atomic transaction
   */
  atomic(): Deno.AtomicOperation {
    const operations: Array<{
      type: "set" | "delete" | "sum" | "min" | "max";
      key: KvKey;
      value?: unknown;
    }> = [];

    const operation: Deno.AtomicOperation = {
      check: (..._checks: Deno.AtomicCheck[]) => operation,
      
      set: (key: KvKey, value: unknown) => {
        operations.push({ type: "set", key, value });
        return operation;
      },

      delete: (key: KvKey) => {
        operations.push({ type: "delete", key });
        return operation;
      },

      sum: (key: KvKey, value: bigint) => {
        operations.push({ type: "sum", key, value });
        return operation;
      },

      min: (key: KvKey, value: bigint) => {
        operations.push({ type: "min", key, value });
        return operation;
      },

      max: (key: KvKey, value: bigint) => {
        operations.push({ type: "max", key, value });
        return operation;
      },

      mutate: (..._mutations: Deno.KvMutation[]) => operation,

      commit: async () => {
        for (const op of operations) {
          if (op.type === "set") {
            await this.set(op.key, op.value);
          } else if (op.type === "delete") {
            await this.delete(op.key);
          } else if (op.type === "sum") {
            const current = await this.get<bigint>(op.key);
            const newValue = (current.value || 0n) + (op.value as bigint);
            await this.set(op.key, newValue);
          } else if (op.type === "min") {
            const current = await this.get<bigint>(op.key);
            const newValue = current.value === null ? op.value : 
              (current.value < (op.value as bigint) ? current.value : op.value);
            await this.set(op.key, newValue);
          } else if (op.type === "max") {
            const current = await this.get<bigint>(op.key);
            const newValue = current.value === null ? op.value :
              (current.value > (op.value as bigint) ? current.value : op.value);
            await this.set(op.key, newValue);
          }
        }
        return { ok: true, versionstamp: this.generateVersionstamp() };
      },

      enqueue: (_value: unknown, _options?: { delay?: number; keysIfUndelivered?: Deno.KvKey[] }) => operation,
    };

    return operation;
  }

  /**
   * Watches keys for changes
   */
  watch<T extends readonly unknown[]>(
    keys: readonly [...{ [K in keyof T]: KvKey }],
    options?: { raw?: boolean }
  ): ReadableStream<{ [K in keyof T]: KvEntry<T[K]> }> {
    return new ReadableStream({
      start: async (controller) => {
        // Send initial values
        const initial = await this.getMany(keys);
        controller.enqueue(initial);

        // Set up watchers for each key
        for (const key of keys) {
          const serialized = this.serializeKey(key);
          if (!this.watchers.has(serialized)) {
            this.watchers.set(serialized, new Set());
          }

          const callback = async () => {
            const current = await this.getMany(keys);
            controller.enqueue(current);
          };

          this.watchers.get(serialized)!.add(callback);
        }
      },
    });
  }

  /**
   * Notifies watchers of changes to a key
   */
  private notifyWatchers(key: KvKey): void {
    const serialized = this.serializeKey(key);
    const callbacks = this.watchers.get(serialized);
    if (callbacks) {
      for (const callback of callbacks) {
        callback([{ key, value: this.store.get(serialized)?.value, versionstamp: this.store.get(serialized)?.versionstamp || null }]);
      }
    }
  }

  /**
   * Closes the KV store
   */
  close(): void {
    this.store.clear();
    this.watchers.clear();
  }

  /**
   * Adds a listener (not implemented in mock)
   */
  listenQueue(_handler: (value: unknown) => void | Promise<void>): Promise<void> {
    return Promise.resolve();
  }

  // Additional mock-specific methods for testing

  /**
   * Clears all data from the mock store
   */
  clear(): void {
    this.store.clear();
    this.versionCounter = 0;
  }

  /**
   * Gets the current size of the store
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Seeds the store with initial data
   */
  async seed(entries: Array<{ key: KvKey; value: unknown }>): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value);
    }
  }

  /**
   * Dumps all data for debugging
   */
  dump(): Array<{ key: KvKey; value: unknown; versionstamp: string }> {
    return Array.from(this.store.values());
  }
}

/**
 * Creates a new mock KV instance for testing
 */
export function createMockKv(): MockKv {
  return new MockKv();
}

/**
 * Helper to setup mock KV with initial data
 */
export async function setupMockKv(
  initialData?: Array<{ key: KvKey; value: unknown }>
): Promise<MockKv> {
  const kv = createMockKv();
  if (initialData) {
    await kv.seed(initialData);
  }
  return kv;
}

/**
 * Helper to cleanup mock KV after tests
 */
export function cleanupMockKv(kv: MockKv): void {
  kv.clear();
  kv.close();
}

/**
 * Helper to create a test fixture with common test data
 */
export async function createTestFixture(
  fixture: "users" | "tasks" | "notifications" | "custom",
  customData?: Array<{ key: KvKey; value: unknown }>
): Promise<MockKv> {
  const kv = createMockKv();

  if (fixture === "users") {
    await kv.seed([
      {
        key: ["users", "user1"],
        value: { id: "user1", email: "test@example.com", name: "Test User" },
      },
      {
        key: ["users", "user2"],
        value: { id: "user2", email: "admin@example.com", name: "Admin User" },
      },
    ]);
  } else if (fixture === "tasks") {
    await kv.seed([
      {
        key: ["tasks", "task1"],
        value: { id: "task1", title: "Test Task", status: "pending" },
      },
      {
        key: ["tasks", "task2"],
        value: { id: "task2", title: "Complete Task", status: "completed" },
      },
    ]);
  } else if (fixture === "notifications") {
    await kv.seed([
      {
        key: ["notifications", "notif1"],
        value: { id: "notif1", message: "Test notification", read: false },
      },
    ]);
  } else if (fixture === "custom" && customData) {
    await kv.seed(customData);
  }

  return kv;
}
