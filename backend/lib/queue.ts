/**
 * Background Job Queue System
 *
 * Features:
 * - Job scheduling with Deno KV
 * - Retry with exponential backoff
 * - Job prioritization
 * - Dead letter queue for failed jobs
 * - Job status tracking
 * - Concurrency control
 *
 * @example
 * ```typescript
 * import { queue } from './lib/queue.ts';
 *
 * // Add a job
 * await queue.add('send-email', {
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 * }, {
 *   priority: 1,
 *   maxRetries: 3,
 * });
 *
 * // Process jobs
 * queue.process('send-email', async (job) => {
 *   await sendEmail(job.data);
 * });
 * ```
 */

import { getKv } from './kv.ts';

// ============================================================================
// Types
// ============================================================================

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying';

export interface Job<T = unknown> {
  id: string;
  name: string;
  data: T;
  status: JobStatus;
  priority: number;
  attempts: number;
  maxRetries: number;
  error?: string;
  result?: unknown;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  scheduledFor?: string;
  processingBy?: string;
}

export interface JobOptions {
  /** Job priority (higher = more important) */
  priority?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Delay before first execution (ms) */
  delay?: number;
  /** Schedule for specific time */
  scheduledFor?: Date;
  /** Unique job ID (prevents duplicates) */
  jobId?: string;
}

export interface QueueStats {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  total: number;
}

type JobHandler<T = unknown> = (job: Job<T>) => Promise<void>;

// ============================================================================
// Queue Implementation
// ============================================================================

export class JobQueue {
  private kv: Deno.Kv | null = null;
  private handlers = new Map<string, JobHandler>();
  private processing = new Set<string>();
  private maxConcurrency = 5;
  private pollInterval = 1000; // 1 second
  private isRunning = false;
  private pollTimeout?: number;

  /**
   * Initialize the queue
   */
  async init(): Promise<void> {
    if (!this.kv) {
      this.kv = await getKv();
    }
  }

  /**
   * Add a job to the queue
   */
  async add<T>(
    name: string,
    data: T,
    options: JobOptions = {},
  ): Promise<string> {
    await this.init();

    const jobId = options.jobId || crypto.randomUUID();
    const now = new Date();
    const scheduledFor = options.scheduledFor ||
      (options.delay ? new Date(now.getTime() + options.delay) : now);

    const job: Job<T> = {
      id: jobId,
      name,
      data,
      status: 'pending',
      priority: options.priority || 0,
      attempts: 0,
      maxRetries: options.maxRetries ?? 3,
      createdAt: now.toISOString(),
      scheduledFor: scheduledFor.toISOString(),
    };

    // Store job
    await this.kv!.set(['jobs', jobId], job);

    // Add to pending queue (sorted by priority and scheduled time)
    const score = this.calculateScore(job);
    await this.kv!.set(['queue', 'pending', score, jobId], jobId);

    // Add to job name index
    await this.kv!.set(['jobs_by_name', name, jobId], jobId);

    return jobId;
  }

  /**
   * Process jobs of a specific type
   */
  process<T>(name: string, handler: JobHandler<T>): void {
    this.handlers.set(name, handler as JobHandler);
  }

  /**
   * Start processing jobs
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    await this.init();
    this.isRunning = true;
    this.poll();
  }

  /**
   * Stop processing jobs
   */
  stop(): void {
    this.isRunning = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    await this.init();
    const result = await this.kv!.get<Job>(['jobs', jobId]);
    return result.value;
  }

  /**
   * List jobs with filters
   */
  async listJobs(options: {
    status?: JobStatus;
    name?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Job[]> {
    await this.init();
    const { status, name, limit = 50, offset = 0 } = options;

    const jobs: Job[] = [];
    let count = 0;

    // If filtering by name, use the name index
    if (name) {
      const prefix = ['jobs_by_name', name];
      const iter = this.kv!.list<string>({ prefix });

      for await (const entry of iter) {
        const jobId = entry.value;
        const job = await this.getJob(jobId);
        if (job && (!status || job.status === status)) {
          if (count >= offset && jobs.length < limit) {
            jobs.push(job);
          }
          count++;
        }
      }
    } else {
      // Otherwise, scan all jobs
      const prefix = ['jobs'];
      const iter = this.kv!.list<Job>({ prefix });

      for await (const entry of iter) {
        const job = entry.value;
        if (!status || job.status === status) {
          if (count >= offset && jobs.length < limit) {
            jobs.push(job);
          }
          count++;
        }
      }
    }

    return jobs;
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    await this.init();

    const stats: QueueStats = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      total: 0,
    };

    const iter = this.kv!.list<Job>({ prefix: ['jobs'] });
    for await (const entry of iter) {
      const job = entry.value;
      stats.total++;
      if (job.status === 'pending') stats.pending++;
      else if (job.status === 'running') stats.running++;
      else if (job.status === 'completed') stats.completed++;
      else if (job.status === 'failed') stats.failed++;
    }

    return stats;
  }

  /**
   * Retry a failed job
   */
  async retry(jobId: string): Promise<void> {
    await this.init();
    const job = await this.getJob(jobId);

    if (!job || job.status !== 'failed') {
      throw new Error('Job not found or not in failed state');
    }

    // Reset job status
    job.status = 'pending';
    job.attempts = 0;
    job.error = undefined;
    job.startedAt = undefined;
    job.completedAt = undefined;

    await this.kv!.set(['jobs', jobId], job);

    // Re-add to pending queue
    const score = this.calculateScore(job);
    await this.kv!.set(['queue', 'pending', score, jobId], jobId);
  }

  /**
   * Delete a job
   */
  async delete(jobId: string): Promise<void> {
    await this.init();
    const job = await this.getJob(jobId);

    if (!job) return;

    // Remove from all indexes
    await this.kv!.delete(['jobs', jobId]);
    await this.kv!.delete(['jobs_by_name', job.name, jobId]);

    // Remove from queue if pending
    if (job.status === 'pending') {
      const score = this.calculateScore(job);
      await this.kv!.delete(['queue', 'pending', score, jobId]);
    }
  }

  /**
   * Clear all completed/failed jobs
   */
  async cleanup(olderThan?: Date): Promise<number> {
    await this.init();
    const cutoff = olderThan || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    let deleted = 0;

    const iter = this.kv!.list<Job>({ prefix: ['jobs'] });
    for await (const entry of iter) {
      const job = entry.value;
      const completedAt = job.completedAt ? new Date(job.completedAt) : null;

      if (
        (job.status === 'completed' || job.status === 'failed') &&
        completedAt &&
        completedAt < cutoff
      ) {
        await this.delete(job.id);
        deleted++;
      }
    }

    return deleted;
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // Process pending jobs if we have capacity
      while (this.processing.size < this.maxConcurrency) {
        const job = await this.getNextJob();
        if (!job) break;

        this.processJob(job).catch(console.error);
      }
    } catch (error) {
      console.error('Error polling queue:', error);
    }

    // Schedule next poll
    this.pollTimeout = setTimeout(() => this.poll(), this.pollInterval);
  }

  private async getNextJob(): Promise<Job | null> {
    // Get the highest priority pending job that's ready to run
    const now = new Date();
    const iter = this.kv!.list<string>({ prefix: ['queue', 'pending'] });

    for await (const entry of iter) {
      const jobId = entry.value;
      const job = await this.getJob(jobId);

      if (!job) {
        // Clean up orphaned queue entry
        await this.kv!.delete(entry.key);
        continue;
      }

      // Check if job is ready to run
      const scheduledFor = new Date(job.scheduledFor || job.createdAt);
      if (scheduledFor > now) {
        continue; // Not ready yet
      }

      // Remove from pending queue
      await this.kv!.delete(entry.key);

      return job;
    }

    return null;
  }

  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.name);

    if (!handler) {
      console.warn(`No handler found for job: ${job.name}`);
      return;
    }

    this.processing.add(job.id);

    try {
      // Mark as running
      job.status = 'running';
      job.startedAt = new Date().toISOString();
      job.attempts++;
      job.processingBy = Deno.env.get('DENO_DEPLOYMENT_ID') || 'local';
      await this.kv!.set(['jobs', job.id], job);

      // Execute handler
      await handler(job);

      // Mark as completed
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      await this.kv!.set(['jobs', job.id], job);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);

      // Check if we should retry
      if (job.attempts < job.maxRetries) {
        job.status = 'retrying';
        job.error = error instanceof Error ? error.message : String(error);

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, job.attempts), 60000);
        job.scheduledFor = new Date(Date.now() + delay).toISOString();

        // Re-add to pending queue
        const score = this.calculateScore(job);
        await this.kv!.set(['queue', 'pending', score, job.id], job.id);
      } else {
        // Max retries reached, mark as failed
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : String(error);
        job.completedAt = new Date().toISOString();
      }

      await this.kv!.set(['jobs', job.id], job);
    } finally {
      this.processing.delete(job.id);
    }
  }

  private calculateScore(job: Job): number {
    // Score = priority (higher first) + timestamp (earlier first)
    // Negative priority so higher values sort first
    const priorityScore = -job.priority * 1000000000000;
    const timeScore = new Date(job.scheduledFor || job.createdAt).getTime();
    return priorityScore + timeScore;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const queue = new JobQueue();
