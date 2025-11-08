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
 * - Optimized indexing to prevent N+1 queries
 *
 * Performance Optimizations:
 * - The `jobs_by_name` index stores full job data (not just IDs)
 * - listJobs() uses the optimized index for O(1) lookups per job
 * - Atomic operations ensure index consistency
 * - Early exit optimization when limit is reached
 * - Concurrent job fetching based on available capacity
 * - Atomic job claiming prevents race conditions
 * - Separate ready/scheduled queues avoid scanning all pending jobs
 * - Time-based index on scheduled queue for efficient promotion
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
   * Set maximum concurrent job processing
   */
  setMaxConcurrency(max: number): void {
    if (max < 1) {
      throw new Error('Max concurrency must be at least 1');
    }
    this.maxConcurrency = max;
  }

  /**
   * Set polling interval in milliseconds
   */
  setPollInterval(ms: number): void {
    if (ms < 100) {
      throw new Error('Poll interval must be at least 100ms');
    }
    this.pollInterval = ms;
  }

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

    // Determine which queue to add to based on scheduled time
    const isScheduled = new Date(scheduledFor) > now;
    
    if (isScheduled) {
      // Add to scheduled queue with timestamp-based key for efficient time-based queries
      const timestamp = new Date(scheduledFor).getTime();
      const score = this.calculateScore(job);
      await this.kv!.set(['queue', 'scheduled', timestamp, score, jobId], jobId);
    } else {
      // Add to ready queue (sorted by priority)
      const score = this.calculateScore(job);
      await this.kv!.set(['queue', 'ready', score, jobId], jobId);
    }

    // Add to job name index WITH FULL JOB DATA (optimization for listJobs)
    await this.kv!.set(['jobs_by_name', name, jobId], job);

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
   * List jobs with filters (optimized to avoid N+1 queries)
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

    // If filtering by name, use the name index (which now stores full job data)
    if (name) {
      const prefix = ['jobs_by_name', name];
      const iter = this.kv!.list<Job>({ prefix });

      for await (const entry of iter) {
        const job = entry.value;
        
        // Verify job still exists (index might be stale)
        if (!job || typeof job !== 'object' || !job.id) {
          // Clean up stale index entry
          await this.kv!.delete(entry.key);
          continue;
        }

        if (!status || job.status === status) {
          if (count >= offset && jobs.length < limit) {
            jobs.push(job);
          }
          count++;
          
          if (jobs.length >= limit) {
            break; // Early exit optimization
          }
        }
      }
    } else {
      // Scan all jobs - already optimized as it fetches full data
      const prefix = ['jobs'];
      const iter = this.kv!.list<Job>({ prefix });

      for await (const entry of iter) {
        const job = entry.value;
        if (!status || job.status === status) {
          if (count >= offset && jobs.length < limit) {
            jobs.push(job);
          }
          count++;
          
          if (jobs.length >= limit) {
            break; // Early exit optimization
          }
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

    await this.updateJobWithIndex(job);

    // Re-add to appropriate queue based on scheduled time
    const now = new Date();
    const scheduledFor = new Date(job.scheduledFor || job.createdAt);
    const score = this.calculateScore(job);
    
    if (scheduledFor > now) {
      const timestamp = scheduledFor.getTime();
      await this.kv!.set(['queue', 'scheduled', timestamp, score, jobId], jobId);
    } else {
      await this.kv!.set(['queue', 'ready', score, jobId], jobId);
    }
  }

  /**
   * Delete a job
   */
  async delete(jobId: string): Promise<void> {
    await this.init();
    const job = await this.getJob(jobId);

    if (!job) return;

    // Use atomic operation for consistency
    const atomic = this.kv!.atomic();
    
    // Remove from all indexes
    atomic.delete(['jobs', jobId]);
    atomic.delete(['jobs_by_name', job.name, jobId]);

    // Remove from queues if pending
    if (job.status === 'pending') {
      const score = this.calculateScore(job);
      const scheduledFor = new Date(job.scheduledFor || job.createdAt);
      const timestamp = scheduledFor.getTime();
      
      // Try to delete from both queues (only one will exist)
      atomic.delete(['queue', 'ready', score, jobId]);
      atomic.delete(['queue', 'scheduled', timestamp, score, jobId]);
    }

    await atomic.commit();
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
      // First, move any scheduled jobs that are now ready
      await this.promoteScheduledJobs();
      
      // Calculate how many jobs we can process
      const availableSlots = this.maxConcurrency - this.processing.size;
      
      if (availableSlots > 0) {
        // Fetch jobs sequentially to avoid race conditions
        // Each call to getNextJob() atomically claims a job
        const jobs: Job[] = [];
        
        for (let i = 0; i < availableSlots; i++) {
          const job = await this.getNextJob();
          if (!job) break; // No more jobs available
          jobs.push(job);
        }
        
        // Start processing all fetched jobs concurrently
        for (const job of jobs) {
          this.processJob(job).catch(console.error);
        }
      }
    } catch (error) {
      console.error('Error polling queue:', error);
    }

    // Schedule next poll
    this.pollTimeout = setTimeout(() => this.poll(), this.pollInterval);
  }

  private async getNextJob(): Promise<Job | null> {
    // Get the highest priority job from the ready queue (no need to check time!)
    const iter = this.kv!.list<string>({ prefix: ['queue', 'ready'] });

    for await (const entry of iter) {
      const jobId = entry.value;
      const job = await this.getJob(jobId);

      if (!job) {
        // Clean up orphaned queue entry
        await this.kv!.delete(entry.key);
        continue;
      }

      // Atomically claim the job to prevent race conditions
      // Use check-and-set to ensure only one worker gets this job
      const queueKey = entry.key;
      const jobKey = ['jobs', jobId];
      
      // Get current versionstamp for optimistic locking
      const jobEntry = await this.kv!.get<Job>(jobKey);
      if (!jobEntry.value) {
        // Job was deleted
        await this.kv!.delete(queueKey);
        continue;
      }

      // Allow both 'pending' and 'retrying' statuses
      if (jobEntry.value.status !== 'pending' && jobEntry.value.status !== 'retrying') {
        // Job was already claimed or is in a final state
        await this.kv!.delete(queueKey);
        continue;
      }

      // Atomically remove from queue and mark as claimed
      const atomic = this.kv!.atomic()
        .check(jobEntry) // Ensure job hasn't changed
        .delete(queueKey); // Remove from ready queue

      const result = await atomic.commit();
      
      if (result.ok) {
        // Successfully claimed the job
        return job;
      }
      
      // Another worker claimed it first, try next job
      continue;
    }

    return null;
  }

  /**
   * Move scheduled jobs that are now ready to the ready queue
   */
  private async promoteScheduledJobs(): Promise<void> {
    const now = new Date().getTime();
    
    // List scheduled jobs up to current time
    const iter = this.kv!.list<string>({ 
      prefix: ['queue', 'scheduled'],
      end: ['queue', 'scheduled', now + 1], // Only get jobs scheduled up to now
    });

    for await (const entry of iter) {
      const jobId = entry.value;
      const job = await this.getJob(jobId);

      if (!job) {
        // Clean up orphaned entry
        await this.kv!.delete(entry.key);
        continue;
      }

      // Atomically move from scheduled to ready queue
      const scheduledKey = entry.key;
      const score = this.calculateScore(job);
      const readyKey = ['queue', 'ready', score, jobId];
      
      const jobEntry = await this.kv!.get<Job>(['jobs', jobId]);
      if (!jobEntry.value) {
        // Job was deleted
        await this.kv!.delete(scheduledKey);
        continue;
      }

      // Allow both 'pending' and 'retrying' statuses (retrying jobs need to be promoted too)
      if (jobEntry.value.status !== 'pending' && jobEntry.value.status !== 'retrying') {
        // Job was already claimed or is in a final state
        await this.kv!.delete(scheduledKey);
        continue;
      }

      // Atomic move operation
      const atomic = this.kv!.atomic()
        .check(jobEntry)
        .delete(scheduledKey)
        .set(readyKey, jobId);

      await atomic.commit();
    }
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
      
      // Update both main storage and index atomically
      await this.updateJobWithIndex(job);
      
      // Broadcast job update via WebSocket
      try {
        const { broadcastJobUpdate } = await import('./notification-websocket.ts');
        broadcastJobUpdate(job);
      } catch (wsError) {
        // WebSocket broadcast is not critical, just log if it fails
        console.debug('WebSocket broadcast failed (non-critical):', wsError);
      }

      // Execute handler
      await handler(job);

      // Mark as completed
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      await this.updateJobWithIndex(job);
      
      // Broadcast completion
      try {
        const { broadcastJobUpdate } = await import('./notification-websocket.ts');
        broadcastJobUpdate(job);
      } catch (wsError) {
        console.debug('WebSocket broadcast failed (non-critical):', wsError);
      }
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);

      // Check if we should retry
      if (job.attempts < job.maxRetries) {
        job.status = 'retrying';
        job.error = error instanceof Error ? error.message : String(error);

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, job.attempts), 60000);
        job.scheduledFor = new Date(Date.now() + delay).toISOString();

        // Re-add to scheduled queue (will be promoted to ready when time comes)
        const score = this.calculateScore(job);
        const timestamp = new Date(job.scheduledFor).getTime();
        await this.kv!.set(['queue', 'scheduled', timestamp, score, job.id], job.id);
      } else {
        // Max retries reached, mark as failed
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : String(error);
        job.completedAt = new Date().toISOString();
      }

      await this.updateJobWithIndex(job);
      
      // Broadcast error/retry status
      try {
        const { broadcastJobUpdate } = await import('./notification-websocket.ts');
        broadcastJobUpdate(job);
      } catch (wsError) {
        console.debug('WebSocket broadcast failed (non-critical):', wsError);
      }
    } finally {
      this.processing.delete(job.id);
    }
  }

  /**
   * Update job in both main storage and name index atomically
   * This keeps the index in sync and prevents stale data
   */
  private async updateJobWithIndex(job: Job): Promise<void> {
    const atomic = this.kv!.atomic();
    atomic.set(['jobs', job.id], job);
    atomic.set(['jobs_by_name', job.name, job.id], job);
    await atomic.commit();
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
