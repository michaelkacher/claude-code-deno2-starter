import { createLogger } from './logger.ts';

const logger = createLogger('KV');

let kvInstance: Deno.Kv | null = null;

/**
 * Get database path based on environment
 */
function getDbPath(): string | undefined {
  try {
    const kvPath = Deno.env.get('DENO_KV_PATH');
    if (kvPath) return kvPath;
    
    const env = Deno.env.get('DENO_ENV');
    return env === 'production' ? undefined : './data/local.db';
  } catch {
    // If we can't access env (e.g., in tests without --allow-env), use default
    return './data/local.db';
  }
}

/**
 * Get the Deno KV instance (singleton)
 * This is the main function to use throughout the application
 */
export async function getKv(): Promise<Deno.Kv> {
  if (!kvInstance) {
    const path = getDbPath();
    try {
      logger.info('Creating new KV connection', { path: path || 'default' });
      kvInstance = await Deno.openKv(path);
      logger.info('KV connection established');
    } catch (error) {
      logger.error('Failed to open KV connection', error, { path });
      throw error;
    }
  }
  return kvInstance;
}

/**
 * Close the KV connection
 * Should be called on application shutdown
 */
export async function closeKv(): Promise<void> {
  if (kvInstance) {
    logger.info('Closing KV connection');
    kvInstance.close();
    kvInstance = null;
  }
}

/**
 * Get KV connection statistics
 */
export function getKvStats() {
  return {
    connected: kvInstance !== null,
  };
}

// Set up graceful shutdown handlers (skip in test environment to avoid leak warnings)
if (typeof Deno !== 'undefined') {
  try {
    const env = Deno.env.get('DENO_ENV');
    if (env !== 'test') {
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
  } catch {
    // Skip signal handlers if env access is restricted
  }
}
