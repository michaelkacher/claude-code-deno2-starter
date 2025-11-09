/**
 * Test: Queue Scheduled Job Promotion
 * 
 * Verifies that scheduled jobs are properly promoted to the ready queue
 */

import { assertEquals } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { closeKv } from '../../../shared/lib/kv.ts';
import { JobQueue } from '../../../shared/lib/queue.ts';
import { suppressLogs } from '../../helpers/logger-test.ts';

describe('Queue Scheduled Jobs', {
  sanitizeResources: false,
  sanitizeOps: false,
  fn() {
  let queue: JobQueue;

  beforeEach(async () => {
    queue = new JobQueue();
    await queue.init();
    queue.setPollInterval(100);

    // Clean up existing jobs
    const existingJobs = await queue.listJobs({ status: 'pending', limit: 1000 });
    for (const job of existingJobs) {
      await queue.delete(job.id).catch(() => {});
    }
  });

  afterEach(async () => {
    queue.stop();
    // Add delay to ensure intervals are cleared
    await new Promise((resolve) => setTimeout(resolve, 200));
    await closeKv();
  });

  describe('job promotion', () => {
    it('should promote scheduled jobs to ready queue', {
      sanitizeResources: false,
      sanitizeOps: false,
      fn: async () => {
        const jobName = `scheduled-test-${Date.now()}`;
        const processedJobs: string[] = [];

        // Register handler
        queue.process(jobName, async (job) => {
          processedJobs.push(job.id);
        });

        // Start queue
        await queue.start();

        // Add a job scheduled for 500ms in the future
        const scheduledId = await queue.add(jobName, { type: 'scheduled' }, {
          delay: 500,
        });

        // Add an immediate job
        const immediateId = await queue.add(jobName, { type: 'immediate' });

        // Wait for both to process
        await new Promise((resolve) => setTimeout(resolve, 1500));

        queue.stop();

        console.log('Processed jobs:', processedJobs.length);

        // Both jobs should be processed
        assertEquals(
          processedJobs.length,
          2,
          `Expected 2 jobs but got ${processedJobs.length}`,
        );
        assertEquals(
          processedJobs.includes(immediateId),
          true,
          'Immediate job should be processed',
        );
        assertEquals(
          processedJobs.includes(scheduledId),
          true,
          'Scheduled job should be processed',
        );

        // Cleanup
        await queue.delete(immediateId).catch(() => {});
        await queue.delete(scheduledId).catch(() => {});
      },
    });
  });

  describe('retry with exponential backoff', () => {
    it('should use scheduled queue for retries', {
      sanitizeResources: false,
      sanitizeOps: false,
      fn: async () => {
        const jobName = `retry-scheduled-test-${Date.now()}`;
        let attempts = 0;
        let jobId = '';

        // Register handler that fails once, then succeeds
        queue.process(jobName, async () => {
          attempts++;
          if (attempts < 2) {
            throw new Error('Simulated failure for retry test');
          }
        });

        // Start queue and suppress expected "Job failed" error logs
        await suppressLogs(async () => {
          await queue.start();

          // Add job
          jobId = await queue.add(jobName, { test: true }, {
            maxRetries: 3,
          });

          // Wait for retry (first attempt + exponential backoff ~2s + processing)
          await new Promise((resolve) => setTimeout(resolve, 5000));
          
          queue.stop();
          
          // Give queue time to finish processing
          await new Promise((resolve) => setTimeout(resolve, 100));
        });

        console.log('Retry attempts:', attempts);

        // Should have attempted at least twice
        assertEquals(
          attempts >= 2,
          true,
          `Expected at least 2 attempts, got ${attempts}`,
        );

        // Cleanup
        await queue.delete(jobId).catch(() => {});
      },
    });
  });
  },
});
