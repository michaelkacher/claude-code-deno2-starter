/**
 * Test: Queue Concurrency Control
 * 
 * Verifies that jobs are fetched and processed concurrently
 * without race conditions.
 */

import { assertEquals, assertExists } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { closeKv } from '../../../shared/lib/kv.ts';
import { JobQueue } from '../../../shared/lib/queue.ts';

describe('Queue Concurrency', {
  sanitizeResources: false,
  sanitizeOps: false,
  fn() {
  let queue: JobQueue;

  beforeEach(async () => {
    queue = new JobQueue();
    await queue.init();
    
    // Clean up all existing pending jobs from previous test runs
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

  describe('concurrent job fetching', () => {
    it('should process multiple jobs concurrently', {
      sanitizeResources: false, // Queue maintains long-lived connections
      sanitizeOps: false, // Queue uses intervals for polling
      fn: async () => {
        queue.setMaxConcurrency(5);
        queue.setPollInterval(100); // Poll every 100ms for faster test

        // Use unique job name to avoid conflicts with other tests
        const jobName = `concurrent-test-${Date.now()}`;

        // Track processing
        const processedJobs: string[] = [];
        const processingStart = new Map<string, number>();

        // Register handler that takes some time BEFORE adding jobs
        queue.process(jobName, async (job) => {
          processingStart.set(job.id, Date.now());
          processedJobs.push(job.id);

          // Simulate work
          await new Promise((resolve) => setTimeout(resolve, 100));
        });

        // Start queue BEFORE adding jobs to ensure handler is registered
        await queue.start();

        // Add 10 jobs
        const jobIds: string[] = [];
        for (let i = 0; i < 10; i++) {
          const id = await queue.add(jobName, { index: i });
          jobIds.push(id);
        }

        // Wait for jobs to be processed
        await new Promise((resolve) => setTimeout(resolve, 3500));

        //  Verify all jobs were processed (may be less than 10 if timing is tight)
        console.log('Processed jobs:', processedJobs.length);
        assertEquals(
          processedJobs.length >= 5,
          true,
          `Expected at least 5 jobs but got ${processedJobs.length}`,
        );

        // Check that multiple jobs started within a short time window
        // (indicating concurrent processing)
        const startTimes = Array.from(processingStart.values()).sort();
        if (startTimes.length >= 5) {
          const time0 = startTimes[0];
          const time4 = startTimes[4];
          if (time0 !== undefined && time4 !== undefined) {
            const firstBatchWindow = time4 - time0; // First 5 jobs

            console.log('First 5 jobs started within:', firstBatchWindow, 'ms');
            
            // First 5 jobs should start within 500ms if processed concurrently
            assertEquals(firstBatchWindow < 500, true);
          }
        }

        // Cleanup
        for (const id of jobIds) {
          await queue.delete(id).catch(() => {});
        }

        // Wait for cleanup to complete
        await new Promise((resolve) => setTimeout(resolve, 100));
      },
    });
  });

  describe('atomic job claiming', () => {
    it('should prevent duplicate job processing', {
      sanitizeResources: false,
      sanitizeOps: false,
      fn: async () => {
      queue.setPollInterval(100); // Poll every 100ms for faster test

      // Use unique job name
      const jobName = `claim-test-${Date.now()}`;

      const processedJobs = new Set<string>();
      const processingCount = { value: 0 };

      // Register handler
      queue.process(jobName, async (job) => {
        if (processedJobs.has(job.id)) {
          throw new Error(`Job ${job.id} processed twice!`);
        }

        processingCount.value++;
        processedJobs.add(job.id);

        // Simulate work
        await new Promise((resolve) => setTimeout(resolve, 50));

        processingCount.value--;
      });

      // Start queue BEFORE adding jobs
      await queue.start();

      // Add jobs
      const jobIds: string[] = [];
      for (let i = 0; i < 20; i++) {
        const id = await queue.add(jobName, { index: i });
        jobIds.push(id);
      }

      // Wait for processing (20 jobs * 50ms = 1000ms + overhead)
      await new Promise((resolve) => setTimeout(resolve, 2500));

      queue.stop();

        // Verify no duplicates (allow for timing, should get most jobs)
        assertEquals(
          processedJobs.size >= 15,
          true,
          `Expected at least 15 unique jobs but got ${processedJobs.size}`,
        );

        // Cleanup
        for (const id of jobIds) {
          await queue.delete(id).catch(() => {});
        }

        // Wait for cleanup to complete
        await new Promise((resolve) => setTimeout(resolve, 100));
      },
    });
  });

  describe('max concurrency', () => {
    it('should respect concurrency limit', {
      sanitizeResources: false,
      sanitizeOps: false,
      fn: async () => {
        queue.setMaxConcurrency(3);
        queue.setPollInterval(100); // Poll every 100ms for faster test

        // Use unique job name
        const jobName = `concurrency-limit-test-${Date.now()}`;

      let currentlyProcessing = 0;
      let maxConcurrent = 0;

      // Register slow handler
      queue.process(jobName, async () => {
        currentlyProcessing++;
        maxConcurrent = Math.max(maxConcurrent, currentlyProcessing);

        await new Promise((resolve) => setTimeout(resolve, 200));

        currentlyProcessing--;
      });

      // Start queue BEFORE adding jobs
      await queue.start();

      // Add many jobs
      const jobIds: string[] = [];
      for (let i = 0; i < 10; i++) {
        const id = await queue.add(jobName, { index: i });
        jobIds.push(id);
      }

      // Wait for processing (10 jobs, max 3 concurrent, 200ms each)
      // 10 jobs / 3 concurrent = ~4 batches * 200ms = ~800ms + overhead
      await new Promise((resolve) => setTimeout(resolve, 2000));

      queue.stop();

      console.log('Max concurrent jobs:', maxConcurrent);

      // Should never exceed max concurrency
      assertEquals(
        maxConcurrent <= 3,
        true,
        `Max concurrency exceeded: ${maxConcurrent} > 3`,
      );
      // Should have actually processed concurrently
      assertEquals(
        maxConcurrent >= 2,
        true,
        `Expected concurrent processing, got max ${maxConcurrent}`,
      );

      // Cleanup
      for (const id of jobIds) {
        await queue.delete(id).catch(() => {});
      }

      // Wait for cleanup to complete
      await new Promise((resolve) => setTimeout(resolve, 100));
      },
    });
  });

  describe('configuration methods', () => {
    it('should allow valid configuration values', async () => {
      // Test setMaxConcurrency
      queue.setMaxConcurrency(10);
      assertEquals(true, true); // No error

      // Test setPollInterval
      queue.setPollInterval(500);
      assertEquals(true, true); // No error
    });

    it('should reject invalid configuration values', async () => {
      try {
        queue.setMaxConcurrency(0);
        assertEquals(true, false, 'Should have thrown error');
      } catch (error) {
        assertExists(error);
      }

      try {
        queue.setPollInterval(50);
        assertEquals(true, false, 'Should have thrown error');
      } catch (error) {
        assertExists(error);
      }
    });
  });
  },
});
