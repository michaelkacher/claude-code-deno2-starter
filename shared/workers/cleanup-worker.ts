/**
 * File Cleanup Worker
 *
 * Scheduled job for cleaning up old temporary files and expired data.
 * This demonstrates how to create a scheduled worker using cron expressions.
 */

import { queue } from '../lib/queue.ts';
import { CronPatterns, scheduler } from '../lib/scheduler.ts';
import { getStorage } from '../lib/storage.ts';

// ============================================================================
// Cleanup Tasks
// ============================================================================

/**
 * Clean up old temporary files from storage
 */
async function cleanupTempFiles(): Promise<void> {
  console.log('🧹 Starting temp file cleanup...');

  try {
    const storage = getStorage();
    const tempFiles = await storage.list('temp/');

    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24); // Files older than 24 hours

    let deletedCount = 0;

    for (const file of tempFiles) {
      // In a real implementation, you would check the file's creation date
      // For now, we'll just demonstrate the deletion logic
      try {
        await storage.delete(file);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete ${file}:`, error);
      }
    }

    console.log(`✅ Deleted ${deletedCount} temporary files`);
  } catch (error) {
    console.error('❌ Temp file cleanup failed:', error);
    throw error;
  }
}

/**
 * Clean up old completed and failed jobs from the queue
 */
async function cleanupOldJobs(): Promise<void> {
  console.log('🧹 Starting job cleanup...');

  try {
    // Clean up jobs older than 7 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    const deletedCount = await queue.cleanup(cutoffDate);

    console.log(`✅ Cleaned up ${deletedCount} old jobs`);
  } catch (error) {
    console.error('❌ Job cleanup failed:', error);
    throw error;
  }
}

/**
 * Clean up expired sessions
 * This is a stub - implement based on your session storage
 */
async function cleanupExpiredSessions(): Promise<void> {
  console.log('🧹 Starting session cleanup...');

  try {
    // Implement session cleanup logic here
    // Example: Delete sessions with expiry < now

    console.log('✅ Session cleanup complete');
  } catch (error) {
    console.error('❌ Session cleanup failed:', error);
    throw error;
  }
}

// ============================================================================
// Worker Registration
// ============================================================================

/**
 * Register cleanup scheduled jobs
 * Call this function during server startup
 */
export function registerCleanupWorker(): void {
  console.log('🧹 [CleanupWorker] Registering cleanup schedules...');
  
  // Clean up temp files every hour
  scheduler.schedule(
    'cleanup-temp-files',
    CronPatterns.EVERY_HOUR,
    cleanupTempFiles,
    { enabled: true },
  );
  console.log('🧹 [CleanupWorker] Registered: cleanup-temp-files');

  // Clean up old jobs daily at 3 AM
  scheduler.schedule(
    'cleanup-old-jobs',
    CronPatterns.DAILY_3AM,
    cleanupOldJobs,
    { enabled: true },
  );
  console.log('🧹 [CleanupWorker] Registered: cleanup-old-jobs');

  // Clean up expired sessions every 6 hours
  scheduler.schedule(
    'cleanup-expired-sessions',
    CronPatterns.EVERY_6_HOURS,
    cleanupExpiredSessions,
    { enabled: true },
  );
  console.log('🧹 [CleanupWorker] Registered: cleanup-expired-sessions');

  console.log('🧹 Cleanup worker registered');
}

// ============================================================================
// Manual Cleanup Functions
// ============================================================================

/**
 * Trigger an immediate cleanup of all resources
 * Useful for admin actions or manual maintenance
 */
export async function triggerFullCleanup(): Promise<void> {
  await Promise.all([
    cleanupTempFiles(),
    cleanupOldJobs(),
    cleanupExpiredSessions(),
  ]);
}
