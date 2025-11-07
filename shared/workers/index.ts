/**
 * Worker Registration
 *
 * Central file to register all background job workers and scheduled tasks.
 * Import and call this function in your main.ts during server startup.
 */

import { registerCleanupWorker } from './cleanup-worker.ts';
import { registerEmailWorker } from './email-worker.ts';
import { registerReportWorker } from './report-worker.ts';
import { registerWebhookWorker } from './webhook-worker.ts';

/**
 * Register all workers
 * Call this function once during server initialization
 */
export function registerAllWorkers(): void {
  console.log('🔧 Registering background workers...');

  // Register job processors
  registerEmailWorker();
  registerReportWorker();
  registerWebhookWorker();

  // Register scheduled tasks
  registerCleanupWorker();

  console.log('✅ All workers registered');
}

// Re-export helper functions for convenience
export {
  sendNotificationEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from './email-worker.ts';

export {
  requestAnalyticsReport,
  requestSalesReport,
  requestUserActivityReport,
} from './report-worker.ts';

export {
  sendCustomWebhook,
  sendPaymentWebhook,
  sendSignedWebhook,
  sendUserWebhook,
} from './webhook-worker.ts';

export { triggerFullCleanup } from './cleanup-worker.ts';
