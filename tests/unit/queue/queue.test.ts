/**
 * Tests for Job Queue System
 */

import { assertEquals, assertExists } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { closeKv } from '../../../shared/lib/kv.ts';
import { JobQueue } from '../../../shared/lib/queue.ts';
import { suppressLogs } from '../../helpers/logger-test.ts';

describe('JobQueue', {
  sanitizeResources: false,
  sanitizeOps: false,
  fn() {
  let queue: JobQueue;

  beforeEach(async () => {
    queue = new JobQueue();
    await queue.init();
  });

  afterEach(async () => {
    queue.stop();
    // Add delay to ensure intervals are cleared
    await new Promise((resolve) => setTimeout(resolve, 200));
    await closeKv();
  });

  describe('add', () => {
    it('should add job with default options', async () => {
      const jobId = await queue.add('test-job', { message: 'Hello' });

      assertExists(jobId);
      assertEquals(typeof jobId, 'string');

      const job = await queue.getJob(jobId);
      assertExists(job);
      assertEquals(job.name, 'test-job');
      assertEquals((job.data as { message: string }).message, 'Hello');
      assertEquals(job.status, 'pending');

      await queue.delete(jobId);
    });

    it('should add job with custom options', async () => {
      const jobId = await queue.add('priority-job', { value: 123 }, {
        priority: 10,
        maxRetries: 5,
        delay: 5000,
      });

      const job = await queue.getJob(jobId);
      assertExists(job);
      assertEquals(job.priority, 10);
      assertEquals(job.maxRetries, 5);

      await queue.delete(jobId);
    });
  });

  describe('list', () => {
    it('should list all jobs', async () => {
      // Add multiple jobs
      const ids = await Promise.all([
        queue.add('job-1', { num: 1 }),
        queue.add('job-2', { num: 2 }),
        queue.add('job-3', { num: 3 }),
      ]);

      const jobs = await queue.listJobs({ limit: 10 });
      assertEquals(jobs.length >= 3, true);

      // Cleanup
      for (const id of ids) {
        await queue.delete(id);
      }
    });
  });

  describe('getStats', () => {
    it('should return correct job statistics', async () => {
      const jobId = await queue.add('stats-test', {});
      const stats = await queue.getStats();

      assertExists(stats);
      assertEquals(typeof stats.pending, 'number');
      assertEquals(typeof stats.running, 'number');
      assertEquals(typeof stats.completed, 'number');
      assertEquals(typeof stats.failed, 'number');
      assertEquals(typeof stats.total, 'number');

      await queue.delete(jobId);
    });
  });

  describe('process', () => {
    it('should process job successfully', {
      sanitizeResources: false,
      sanitizeOps: false,
      fn: async () => {
        let processed = false;

        queue.process('success-job', async () => {
          processed = true;
        });

        const jobId = await queue.add('success-job', {});

        // Start processing
        await queue.start();

        // Wait for job to be processed
        await new Promise((resolve) => setTimeout(resolve, 2000));

        assertEquals(processed, true);

        const job = await queue.getJob(jobId);
        assertEquals(job?.status, 'completed');

        // Stop the queue first
        queue.stop();

        // Clean up the job
        await queue.delete(jobId);
      },
    });

    it('should retry failed job', async () => {
      let attempts = 0;

      queue.process('retry-job', async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Simulated failure');
        }
      });

      const jobId = await queue.add('retry-job', {}, {
        maxRetries: 3,
      });

      // Suppress expected "Job failed" error logs from intentional failures
      await suppressLogs(async () => {
        await queue.start();

        // Wait for retries
        await new Promise((resolve) => setTimeout(resolve, 5000));
        
        queue.stop();
        
        // Give queue time to finish processing
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      assertEquals(attempts >= 2, true);

      await queue.delete(jobId);
    });
  });

  describe('delete', () => {
    it('should delete job from queue', async () => {
      const jobId = await queue.add('delete-test', {});

      let job = await queue.getJob(jobId);
      assertExists(job);

      await queue.delete(jobId);

      job = await queue.getJob(jobId);
      assertEquals(job, null);
    });
  });

  describe('cleanup', () => {
    it('should remove old completed jobs', async () => {
      // Create a completed job with old timestamp
      const jobId = await queue.add('old-job', {});
      const job = await queue.getJob(jobId);

      if (job) {
        job.status = 'completed';
        job.completedAt = new Date('2020-01-01').toISOString();
        // Save updated job manually for test
        const { getKv } = await import('../../../shared/lib/kv.ts');
        const kv = await getKv();
        await kv.set(['jobs', jobId], job);
      }

      const cutoff = new Date('2021-01-01');
      const deleted = await queue.cleanup(cutoff);

      assertEquals(deleted >= 1, true);
    });
  });
  },
});
