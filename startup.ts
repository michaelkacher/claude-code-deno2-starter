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
    // Run admin setup tasks in parallel (both query KV)
    logger.info('Running admin setup tasks...');
    const [devAdminResult, initialAdminResult] = await Promise.allSettled([
      setupDevAdmin(),
      setupInitialAdmin(),
    ]);
    
    if (devAdminResult.status === 'rejected') {
      errors.push({ service: 'dev-admin-setup', error: devAdminResult.reason });
      logger.warn('Dev admin setup failed (non-critical)', devAdminResult.reason);
    }
    
    if (initialAdminResult.status === 'rejected') {
      errors.push({ service: 'initial-admin-setup', error: initialAdminResult.reason });
      logger.warn('Initial admin setup failed (non-critical)', initialAdminResult.reason);
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

    // Start queue and load schedules in parallel (both are I/O bound)
    logger.info('Starting queue and loading schedules...');
    const [queueResult, scheduleResult] = await Promise.allSettled([
      queue.start(),
      loadPersistedSchedules(),
    ]);
    
    if (queueResult.status === 'rejected') {
      errors.push({ service: 'job-queue', error: queueResult.reason });
      logger.error('Job queue failed to start', queueResult.reason);
      throw queueResult.reason; // Critical - jobs won't process
    } else {
      logger.info('✓ Job queue started');
    }
    
    if (scheduleResult.status === 'rejected') {
      errors.push({ service: 'schedule-loading', error: scheduleResult.reason });
      logger.warn('Schedule loading failed (will retry)', scheduleResult.reason);
    } else {
      logger.info('✓ Persisted schedules loaded');
    }

    // Start the scheduler (fast, synchronous operation)
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
