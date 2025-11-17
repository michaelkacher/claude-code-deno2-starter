import { Job, JobStatus } from '../lib/queue.ts';
import { BaseRepository, ListOptions, ListResult, RepositoryOptions } from './base-repository.ts';

/**
 * Job Query Options
 */
export interface JobQueryOptions extends ListOptions {
  /**
   * Filter by job status
   */
  status?: JobStatus;
  
  /**
   * Filter by job name/type
   */
  name?: string;
  
  /**
   * Sort order
   */
  sortBy?: 'createdAt' | 'priority' | 'startedAt' | 'completedAt';
  
  /**
   * Sort direction
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Job Repository
 * 
 * Manages background job queue data:
 * - CRUD operations for jobs
 * - Status tracking
 * - Priority management
 * - Job history
 */
export class JobRepository extends BaseRepository<Job> {
  constructor(options: RepositoryOptions = {}) {
    super('Job', options);
  }

  /**
   * Create a new job
   */
  async create<T = unknown>(
    name: string,
    data: T,
    options: {
      priority?: number;
      maxRetries?: number;
      scheduledFor?: Date;
      jobId?: string;
    } = {}
  ): Promise<Job<T>> {
    try {
      const jobId = options.jobId || crypto.randomUUID();
      const now = new Date().toISOString();
      
      const job: Job<T> = {
        id: jobId,
        name,
        data,
        status: 'pending',
        priority: options.priority || 0,
        attempts: 0,
        maxRetries: options.maxRetries || 3,
        createdAt: now,
        scheduledFor: options.scheduledFor?.toISOString(),
      };

      await this.set(['jobs', jobId], job);
      
      this.logger.info('Job created', { jobId, name, priority: job.priority });
      return job;
    } catch (error) {
      this.logger.error('Error creating job', { name, error });
      throw error;
    }
  }

  /**
   * Find job by ID
   */
  async findById(jobId: string): Promise<Job | null> {
    return await this.get(['jobs', jobId]);
  }

  /**
   * Update job status
   */
  async updateStatus(
    jobId: string,
    status: JobStatus,
    updates: {
      error?: string | undefined;
      result?: unknown;
      startedAt?: string | undefined;
      completedAt?: string | undefined;
      processingBy?: string | undefined;
      attempts?: number | undefined;
    } = {}
  ): Promise<Job | null> {
    try {
      const job = await this.findById(jobId);
      
      if (!job) {
        this.logger.warn('Cannot update non-existent job', { jobId });
        return null;
      }

      const updatedJob: Job = {
        ...job,
        status,
        error: updates.error !== undefined ? updates.error : job.error,
        result: updates.result !== undefined ? updates.result : job.result,
        startedAt: updates.startedAt !== undefined ? updates.startedAt : job.startedAt,
        completedAt: updates.completedAt !== undefined ? updates.completedAt : job.completedAt,
        processingBy: updates.processingBy !== undefined ? updates.processingBy : job.processingBy,
        attempts: updates.attempts !== undefined ? updates.attempts : job.attempts,
      };

      await this.set(['jobs', jobId], updatedJob);
      
      this.logger.info('Job status updated', { jobId, status });
      return updatedJob;
    } catch (error) {
      this.logger.error('Error updating job status', { jobId, status, error });
      throw error;
    }
  }

  /**
   * Increment job attempts
   */
  async incrementAttempts(jobId: string): Promise<Job | null> {
    try {
      const job = await this.findById(jobId);
      
      if (!job) {
        return null;
      }

      return await this.updateStatus(jobId, 'retrying', {
        attempts: job.attempts + 1,
      });
    } catch (error) {
      this.logger.error('Error incrementing job attempts', { jobId, error });
      throw error;
    }
  }

  /**
   * List all jobs with filtering
   */
  async listJobs(options: JobQueryOptions = {}): Promise<ListResult<Job>> {
    try {
      const kv = await this.getKv();
      let jobs: Job[] = [];
      
      const entries = kv.list<Job>({ prefix: ['jobs'] });
      for await (const entry of entries) {
        if (entry.value) {
          jobs.push(entry.value);
        }
      }

      // Apply filters
      if (options.status) {
        jobs = jobs.filter(j => j.status === options.status);
      }

      if (options.name) {
        jobs = jobs.filter(j => j.name === options.name);
      }

      // Sort jobs
      const sortBy = options.sortBy || 'createdAt';
      const sortOrder = options.sortOrder || 'desc';
      
      jobs.sort((a, b) => {
        let aValue: number | string = 0;
        let bValue: number | string = 0;

        switch (sortBy) {
          case 'priority':
            aValue = a.priority;
            bValue = b.priority;
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'startedAt':
            aValue = a.startedAt ? new Date(a.startedAt).getTime() : 0;
            bValue = b.startedAt ? new Date(b.startedAt).getTime() : 0;
            break;
          case 'completedAt':
            aValue = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            bValue = b.completedAt ? new Date(b.completedAt).getTime() : 0;
            break;
        }

        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });

      // Apply pagination
      const limit = options.limit || jobs.length;
      const items = jobs.slice(0, limit);

      return {
        items,
        cursor: null,
        hasMore: jobs.length > limit,
      };
    } catch (error) {
      this.logger.error('Error listing jobs', { error });
      throw error;
    }
  }

  /**
   * Get pending jobs ready to process
   */
  async getPendingJobs(limit: number = 10): Promise<Job[]> {
    try {
      const now = new Date().toISOString();
      const result = await this.listJobs({
        status: 'pending',
        sortBy: 'priority',
        sortOrder: 'desc',
        limit: limit * 2, // Get extra to filter by schedule
      });

      // Filter by scheduled time
      const readyJobs = result.items.filter(job => {
        if (!job.scheduledFor) {
          return true;
        }
        return job.scheduledFor <= now;
      });

      return readyJobs.slice(0, limit);
    } catch (error) {
      this.logger.error('Error getting pending jobs', { error });
      throw error;
    }
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<boolean> {
    try {
      const exists = await this.exists(['jobs', jobId]);
      
      if (!exists) {
        this.logger.warn('Cannot delete non-existent job', { jobId });
        return false;
      }

      await this.delete(['jobs', jobId]);
      
      this.logger.info('Job deleted', { jobId });
      return true;
    } catch (error) {
      this.logger.error('Error deleting job', { jobId, error });
      throw error;
    }
  }

  /**
   * Get job queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    running: number;
    completed: number;
    failed: number;
    retrying: number;
    total: number;
  }> {
    try {
      const allJobs = await this.listJobs({ limit: 10000 });
      const jobs = allJobs.items;
      
      return {
        pending: jobs.filter(j => j.status === 'pending').length,
        running: jobs.filter(j => j.status === 'running').length,
        completed: jobs.filter(j => j.status === 'completed').length,
        failed: jobs.filter(j => j.status === 'failed').length,
        retrying: jobs.filter(j => j.status === 'retrying').length,
        total: jobs.length,
      };
    } catch (error) {
      this.logger.error('Error getting job stats', { error });
      throw error;
    }
  }

  /**
   * Delete completed jobs older than specified days
   */
  async deleteOldCompletedJobs(olderThanDays: number = 7): Promise<number> {
    try {
      const kv = await this.getKv();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      let count = 0;
      
      const entries = kv.list<Job>({ prefix: ['jobs'] });
      for await (const entry of entries) {
        const job = entry.value;
        if (job && job.status === 'completed' && job.completedAt) {
          const completedDate = new Date(job.completedAt);
          if (completedDate < cutoffDate) {
            await kv.delete(entry.key);
            count++;
          }
        }
      }
      
      this.logger.info('Old completed jobs deleted', { count, olderThanDays });
      return count;
    } catch (error) {
      this.logger.error('Error deleting old completed jobs', { olderThanDays, error });
      throw error;
    }
  }

  /**
   * Delete failed jobs older than specified days
   */
  async deleteOldFailedJobs(olderThanDays: number = 30): Promise<number> {
    try {
      const kv = await this.getKv();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      let count = 0;
      
      const entries = kv.list<Job>({ prefix: ['jobs'] });
      for await (const entry of entries) {
        const job = entry.value;
        if (job && job.status === 'failed') {
          const failedDate = new Date(job.completedAt || job.createdAt);
          if (failedDate < cutoffDate) {
            await kv.delete(entry.key);
            count++;
          }
        }
      }
      
      this.logger.info('Old failed jobs deleted', { count, olderThanDays });
      return count;
    } catch (error) {
      this.logger.error('Error deleting old failed jobs', { olderThanDays, error });
      throw error;
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<Job | null> {
    try {
      const job = await this.findById(jobId);
      
      if (!job) {
        return null;
      }

      if (job.status !== 'failed') {
        this.logger.warn('Cannot retry non-failed job', { jobId, status: job.status });
        return null;
      }

      return await this.updateStatus(jobId, 'pending', {
        error: undefined,
        startedAt: undefined,
        completedAt: undefined,
        processingBy: undefined,
      });
    } catch (error) {
      this.logger.error('Error retrying job', { jobId, error });
      throw error;
    }
  }
}
