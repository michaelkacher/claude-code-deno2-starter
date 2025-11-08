import { createLogger } from './logger.ts';

const logger = createLogger('KV');

/**
 * Deno KV Connection Manager
 * 
 * Manages a singleton Deno KV connection with:
 * - Health checks
 * - Automatic reconnection
 * - Connection pooling
 * - Graceful shutdown
 */
class KvConnectionManager {
  private instance: Deno.Kv | null = null;
  private connecting: Promise<Deno.Kv> | null = null;
  private healthCheckInterval: number | null = null;
  private isClosing = false;

  /**
   * Get or create a KV connection
   */
  async getConnection(): Promise<Deno.Kv> {
    // Return existing connection if healthy
    if (this.instance && !this.isClosing) {
      return this.instance;
    }

    // Wait for in-progress connection
    if (this.connecting) {
      logger.debug('Waiting for in-progress connection');
      return await this.connecting;
    }

    // Create new connection
    logger.info('Creating new KV connection');
    this.connecting = this.connect();
    
    try {
      this.instance = await this.connecting;
      return this.instance;
    } finally {
      this.connecting = null;
    }
  }

  /**
   * Create a new KV connection
   */
  private async connect(): Promise<Deno.Kv> {
    const kvPath = Deno.env.get('DENO_KV_PATH');
    const denoEnv = Deno.env.get('DENO_ENV');
    
    let path = kvPath
      ? kvPath
      : (denoEnv === 'production' ? undefined : './data/local.db');

    // If path is relative, resolve it as an absolute path from the project root
    // This file is at shared/lib/kv.ts, so project root is ../../ from here
    if (path && !path.startsWith('/') && !path.match(/^[a-zA-Z]:\\/)) {
      // Get the directory of this file (shared/lib/)
      const kvFileDir = new URL('.', import.meta.url).pathname;
      // Go up two levels to project root: shared/lib -> shared -> root
      const projectRoot = new URL('../../', import.meta.url).pathname;
      // Remove leading ./ from path and join with project root
      const cleanPath = path.startsWith('./') ? path.substring(2) : path;
      // On Windows, convert URL pathname to proper Windows path
      path = (projectRoot + cleanPath).replace(/^\/([A-Za-z]:)/, '$1');
    }

    try {
      const kv = await Deno.openKv(path);
      logger.info('KV connection established', { path: path || 'default' });

      // Set up health check
      this.setupHealthCheck(kv);

      return kv;
    } catch (error) {
      logger.error('Failed to open KV connection', error, { path });
      throw error;
    }
  }

  /**
   * Set up periodic health checks
   */
  private setupHealthCheck(kv: Deno.Kv) {
    // Clear existing interval if any
    if (this.healthCheckInterval !== null) {
      clearInterval(this.healthCheckInterval);
    }

    // Check connection health every 10 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        // Simple health check - try to get a key
        await kv.get(['__health_check__']);
        logger.debug('Health check passed');
      } catch (error) {
        logger.error('Health check failed', error);

        // Clear instance to force reconnection on next request
        this.instance = null;

        if (this.healthCheckInterval !== null) {
          clearInterval(this.healthCheckInterval);
          this.healthCheckInterval = null;
        }
      }
    }, 10 * 60 * 1000); // Check every 10 minutes
  }

  /**
   * Close the KV connection
   */
  async close(): Promise<void> {
    this.isClosing = true;
    
    // Clear health check interval
    if (this.healthCheckInterval !== null) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Close connection
    if (this.instance) {
      logger.info('Closing KV connection');
      this.instance.close();
      this.instance = null;
    }

    this.isClosing = false;
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      connected: this.instance !== null,
      connecting: this.connecting !== null,
      healthCheckActive: this.healthCheckInterval !== null,
    };
  }
}

// Singleton instance
const manager = new KvConnectionManager();

/**
 * Get the Deno KV instance
 * This is the main function to use throughout the application
 */
export async function getKv(): Promise<Deno.Kv> {
  return await manager.getConnection();
}

/**
 * Close the KV connection
 * Should be called on application shutdown
 */
export async function closeKv(): Promise<void> {
  await manager.close();
}

/**
 * Get KV connection statistics
 */
export function getKvStats() {
  return manager.getStats();
}

// Set up graceful shutdown handlers
if (typeof Deno !== 'undefined') {
  const isWindows = Deno.build.os === 'windows';
  
  // Handle SIGINT (Ctrl+C) - supported on all platforms
  Deno.addSignalListener('SIGINT', async () => {
    logger.info('Received SIGINT, closing KV connection');
    await closeKv();
    Deno.exit(0);
  });

  // Handle SIGTERM (docker stop, etc.) - Unix only
  if (!isWindows) {
    Deno.addSignalListener('SIGTERM', async () => {
      logger.info('Received SIGTERM, closing KV connection');
      await closeKv();
      Deno.exit(0);
    });
  }
}
