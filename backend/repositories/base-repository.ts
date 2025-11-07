import { getKv } from '../lib/kv.ts';
import { createLogger } from '../lib/logger.ts';

/**
 * Base Repository Pattern for Deno KV
 * 
 * Provides:
 * - Centralized data access layer
 * - Type-safe CRUD operations
 * - Transaction support
 * - Consistent error handling
 * - Logging and monitoring
 */

export interface RepositoryOptions {
  /**
   * Optional KV instance for testing or transaction support
   */
  kv?: Deno.Kv;
}

export interface ListOptions {
  /**
   * Maximum number of items to return
   */
  limit?: number;
  
  /**
   * Cursor for pagination (from previous list result)
   */
  cursor?: string;
  
  /**
   * Reverse the order of results
   */
  reverse?: boolean;
}

export interface ListResult<T> {
  items: T[];
  cursor: string | null;
  hasMore: boolean;
}

/**
 * Base repository providing common CRUD operations
 * All entity repositories should extend this class
 */
export abstract class BaseRepository<T> {
  protected logger;
  protected kv: Deno.Kv | null = null;
  protected kvPromise: Promise<Deno.Kv> | null = null;

  constructor(
    protected readonly entityName: string,
    protected readonly options: RepositoryOptions = {}
  ) {
    this.logger = createLogger(`${entityName}Repository`);
    if (options.kv) {
      this.kv = options.kv;
    }
  }

  /**
   * Get KV instance (lazy initialization)
   */
  protected async getKv(): Promise<Deno.Kv> {
    if (this.options.kv) {
      return this.options.kv;
    }
    
    if (this.kv) {
      return this.kv;
    }
    
    if (this.kvPromise) {
      return await this.kvPromise;
    }
    
    this.kvPromise = getKv();
    this.kv = await this.kvPromise;
    this.kvPromise = null;
    
    return this.kv;
  }

  /**
   * Get entity by key
   */
  protected async get(key: Deno.KvKey): Promise<T | null> {
    try {
      const kv = await this.getKv();
      const entry = await kv.get<T>(key);
      
      if (!entry.value) {
        this.logger.debug(`${this.entityName} not found`, { key });
        return null;
      }
      
      return entry.value;
    } catch (error) {
      this.logger.error(`Error getting ${this.entityName}`, { key, error });
      throw error;
    }
  }

  /**
   * Set entity value
   */
  protected async set(key: Deno.KvKey, value: T, options?: { expireIn?: number }): Promise<void> {
    try {
      const kv = await this.getKv();
      
      if (options?.expireIn) {
        await kv.set(key, value, { expireIn: options.expireIn });
      } else {
        await kv.set(key, value);
      }
      
      this.logger.debug(`${this.entityName} saved`, { key });
    } catch (error) {
      this.logger.error(`Error setting ${this.entityName}`, { key, error });
      throw error;
    }
  }

  /**
   * Delete entity
   */
  protected async delete(key: Deno.KvKey): Promise<void> {
    try {
      const kv = await this.getKv();
      await kv.delete(key);
      this.logger.debug(`${this.entityName} deleted`, { key });
    } catch (error) {
      this.logger.error(`Error deleting ${this.entityName}`, { key, error });
      throw error;
    }
  }

  /**
   * List entities by prefix
   */
  protected async list(
    prefix: Deno.KvKey,
    options: ListOptions = {}
  ): Promise<ListResult<T>> {
    try {
      const kv = await this.getKv();
      const items: T[] = [];
      
      const listOptions: Deno.KvListOptions = {
        limit: options.limit,
        reverse: options.reverse,
      };
      
      if (options.cursor) {
        listOptions.cursor = options.cursor;
      }
      
      const entries = kv.list<T>({ prefix }, listOptions);
      
      for await (const entry of entries) {
        if (entry.value) {
          items.push(entry.value);
        }
      }
      
      // Get cursor from last entry (simplified - in production you'd track the actual cursor)
      const cursor = items.length > 0 && options.limit && items.length >= options.limit
        ? 'next_page' // Simplified cursor handling
        : null;
      
      return {
        items,
        cursor,
        hasMore: cursor !== null,
      };
    } catch (error) {
      this.logger.error(`Error listing ${this.entityName}`, { prefix, error });
      throw error;
    }
  }

  /**
   * Get atomic operation builder for transactions
   */
  protected async atomic(): Promise<Deno.AtomicOperation> {
    const kv = await this.getKv();
    return kv.atomic();
  }

  /**
   * Count entities by prefix
   */
  protected async count(prefix: Deno.KvKey): Promise<number> {
    try {
      const kv = await this.getKv();
      let count = 0;
      
      const entries = kv.list({ prefix });
      for await (const _ of entries) {
        count++;
      }
      
      return count;
    } catch (error) {
      this.logger.error(`Error counting ${this.entityName}`, { prefix, error });
      throw error;
    }
  }

  /**
   * Check if entity exists
   */
  protected async exists(key: Deno.KvKey): Promise<boolean> {
    try {
      const kv = await this.getKv();
      const entry = await kv.get(key);
      return entry.value !== null;
    } catch (error) {
      this.logger.error(`Error checking ${this.entityName} existence`, { key, error });
      throw error;
    }
  }

  /**
   * Close KV connection (for cleanup in tests)
   */
  async close(): Promise<void> {
    if (this.kv && !this.options.kv) {
      await this.kv.close();
      this.kv = null;
    }
  }
}
