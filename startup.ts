/**
 * Background Services Startup
 * 
 * Initializes background job queue, scheduler, and workers
 * Called from Fresh server startup
 */

import { setupDevAdmin } from './lib/dev-admin-setup.ts';
import { setupInitialAdmin } from './lib/initial-admin-setup.ts';
import { createLogger } from './lib/logger.ts';
import { queue } from './lib/queue.ts';
import { scheduler } from './lib/scheduler.ts';
import { registerAllWorkers } from './workers/index.ts';

const logger = createLogger('Startup');

/**
 * Initialize all background services
 * Call this once when the server starts
 * 
 * Non-blocking: Services initialize in the background.
 * The app can still function even if some services fail to start.
 */
export async function initializeBackgroundServices() {
  logger.info('🚀 Initializing background services (non-blocking)...');
  
  const errors: Array<{ service: string; error: unknown }> = [];
  
  try {
    // Auto-create dev admin on first run (development only)
    logger.info('Checking for first-run dev admin setup...');
    try {
      await setupDevAdmin();
    } catch (error) {
      errors.push({ service: 'dev-admin-setup', error });
      logger.warn('Dev admin setup failed (non-critical)', error);
    }

    // Setup initial admin if specified (production)
    logger.info('Setting up initial admin user...');
    try {
      await setupInitialAdmin();
    } catch (error) {
      errors.push({ service: 'initial-admin-setup', error });
      logger.warn('Initial admin setup failed (non-critical)', error);
    }

    // Register all workers and scheduled tasks
    logger.info('Registering job workers...');
    try {
      registerAllWorkers();
      logger.info('Workers registered successfully');
    } catch (error) {
      errors.push({ service: 'worker-registration', error });
      logger.error('Worker registration failed', error);
      throw error; // Critical - can't continue without workers
    }

    // Load persisted schedules from KV
    logger.info('Loading persisted schedules...');
    try {
      await loadPersistedSchedules();
      logger.info('Persisted schedules loaded');
    } catch (error) {
      errors.push({ service: 'schedule-loading', error });
      logger.warn('Schedule loading failed (will retry)', error);
    }

    // Start the job queue processor
    logger.info('Starting job queue...');
    try {
      await queue.start();
      logger.info('✓ Job queue started');
    } catch (error) {
      errors.push({ service: 'job-queue', error });
      logger.error('Job queue failed to start', error);
      throw error; // Critical - jobs won't process
    }

    // Start the scheduler
    logger.info('Starting job scheduler...');
    try {
      scheduler.start();
      logger.info('✓ Job scheduler started');
    } catch (error) {
      errors.push({ service: 'scheduler', error });
      logger.error('Scheduler failed to start', error);
      throw error; // Critical - scheduled jobs won't run
    }

    if (errors.length > 0) {
      logger.warn(`⚠️  Background services started with ${errors.length} non-critical error(s)`);
    } else {
      logger.info('✅ All background services initialized successfully');
    }
  } catch (error) {
    logger.error('❌ Critical background service initialization failure', error);
    logger.error('   Some features may not work correctly');
    throw error;
  }
}

/**
 * Load persisted schedules from Deno KV
 * Recreates the handler functions for each schedule
 */
async function loadPersistedSchedules(): Promise<void> {
  // Handler factory that creates job handlers for persisted schedules
  const handlerFactory = (jobName: string, jobData: Record<string, unknown>) => {
    return async () => {
      logger.info('Persisted schedule triggered', { jobName, jobData });
      await queue.add(jobName, jobData);
    };
  };

  await scheduler.loadSchedules(handlerFactory);
}
