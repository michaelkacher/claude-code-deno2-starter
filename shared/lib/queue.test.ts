/**
 * Tests for Job Queue System
 */

import { assertEquals, assertExists } from 'jsr:@std/assert';
import { closeKv } from './kv.ts';
import { JobQueue } from './queue.ts';

Deno.test('JobQueue - add job', async () => {
  const queue = new JobQueue();
  await queue.init();

  const jobId = await queue.add('test-job', { message: 'Hello' });

  assertExists(jobId);
  assertEquals(typeof jobId, 'string');

  const job = await queue.getJob(jobId);
  assertExists(job);
  assertEquals(job.name, 'test-job');
  assertEquals((job.data as { message: string }).message, 'Hello');
  assertEquals(job.status, 'pending');

  await queue.delete(jobId);
  await closeKv();
});

Deno.test('JobQueue - add job with options', async () => {
  const queue = new JobQueue();
  await queue.init();

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
  await closeKv();
});

Deno.test('JobQueue - list jobs', async () => {
  const queue = new JobQueue();
  await queue.init();

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
  await closeKv();
});

Deno.test('JobQueue - get stats', async () => {
  const queue = new JobQueue();
  await queue.init();

  const jobId = await queue.add('stats-test', {});
  const stats = await queue.getStats();

  assertExists(stats);
  assertEquals(typeof stats.pending, 'number');
  assertEquals(typeof stats.running, 'number');
  assertEquals(typeof stats.completed, 'number');
  assertEquals(typeof stats.failed, 'number');
  assertEquals(typeof stats.total, 'number');

  await queue.delete(jobId);
  await closeKv();
});

Deno.test({
  name: 'JobQueue - process job successfully',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const queue = new JobQueue();
    await queue.init();

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
    
    // Close KV connection
    await closeKv();
  },
});

Deno.test('JobQueue - retry failed job', async () => {
  const queue = new JobQueue();
  await queue.init();

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

  await queue.start();

  // Wait for retries
  await new Promise((resolve) => setTimeout(resolve, 5000));

  assertEquals(attempts >= 2, true);

  queue.stop();
  await queue.delete(jobId);
  await closeKv();
});

Deno.test('JobQueue - delete job', async () => {
  const queue = new JobQueue();
  await queue.init();

  const jobId = await queue.add('delete-test', {});

  let job = await queue.getJob(jobId);
  assertExists(job);

  await queue.delete(jobId);

  job = await queue.getJob(jobId);
  assertEquals(job, null);
  await closeKv();
});

Deno.test('JobQueue - cleanup old jobs', async () => {
  const queue = new JobQueue();
  await queue.init();

  // Create a completed job with old timestamp
  const jobId = await queue.add('old-job', {});
  const job = await queue.getJob(jobId);

  if (job) {
    job.status = 'completed';
    job.completedAt = new Date('2020-01-01').toISOString();
    // Save updated job manually for test
    const { getKv } = await import('./kv.ts');
    const kv = await getKv();
    await kv.set(['jobs', jobId], job);
  }

  const cutoff = new Date('2021-01-01');
  const deleted = await queue.cleanup(cutoff);

  assertEquals(deleted >= 1, true);
  await closeKv();
});
