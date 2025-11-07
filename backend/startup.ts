/**
 * Background Services Startup
 * 
 * Initializes background job queue, scheduler, and workers
 * Called from Fresh server startup
 */

import { setupInitialAdmin } from './lib/initial-admin-setup.ts';
import { createLogger } from './lib/logger.ts';
import { queue } from './lib/queue.ts';
import { scheduler } from './lib/scheduler.ts';
import { registerAllWorkers } from './workers/index.ts';

const logger = createLogger('Startup');

/**
 * Initialize all background services
 * Call this once when the server starts
 */
export async function initializeBackgroundServices() {
  try {
    // Setup initial admin if specified (only runs if DISABLE_AUTH=false)
    logger.info('Setting up initial admin user...');
    await setupInitialAdmin();

    // Register all workers and scheduled tasks
    logger.info('Registering job workers...');
    registerAllWorkers();

    // Start the job queue processor
    logger.info('Starting job queue...');
    await queue.start();
    logger.info('Job queue started');

    // Start the scheduler
    logger.info('Starting job scheduler...');
    scheduler.start();
    logger.info('Job scheduler started');

    logger.info('All background services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize background services', error);
    throw error;
  }
}
