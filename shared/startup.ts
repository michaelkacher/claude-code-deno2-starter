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
 */
export async function initializeBackgroundServices() {
  logger.info('initializeBackgroundServices() CALLED');
  try {
    // Auto-create dev admin on first run (development only)
    logger.info('Checking for first-run dev admin setup...');
    await setupDevAdmin();

    // Setup initial admin if specified (production)
    logger.info('Setting up initial admin user...');
    await setupInitialAdmin();

    // Register all workers and scheduled tasks
    logger.info('Registering job workers...');
    registerAllWorkers();
    logger.info('Workers registered successfully');

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
