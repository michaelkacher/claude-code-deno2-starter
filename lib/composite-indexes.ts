/// <reference lib="deno.unstable" />

/**
 * Composite Index Manager for Deno KV
 * 
 * Problem: Deno KV only supports prefix-based queries. Filtering by multiple
 * fields (e.g., users by role AND emailVerified) requires scanning all records
 * and filtering in memory, which is slow and inefficient.
 * 
 * Solution: Maintain composite indexes that combine multiple fields in the key.
 * This allows efficient queries without full table scans.
 * 
 * Performance Impact:
 * - Before: Scan 10,000 users, filter in memory → O(n) time
 * - After: Query specific index → O(log n) time, 100x-1000x faster
 * 
 * Storage Cost:
 * - Each index adds ~100 bytes per record
 * - 10,000 users with 5 indexes = ~5MB (acceptable for most use cases)
 * 
 * @example
 * ```typescript
 * // Create user with indexes
 * await CompositeIndexManager.createUser(user);
 * 
 * // Query by role
 * const admins = await CompositeIndexManager.queryUsers({ role: 'admin' });
 * 
 * // Query by multiple fields
 * const verifiedAdmins = await CompositeIndexManager.queryUsers({
 *   role: 'admin',
 *   emailVerified: true
 * });
 * ```
 */

import { getKv } from './kv.ts';
import { createLogger } from './logger.ts';

const logger = createLogger('CompositeIndexes');

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  emailVerified: boolean;
  createdAt: string;
  [key: string]: unknown; // Allow additional fields
}

export interface UserQueryOptions {
  role?: 'admin' | 'user';
  emailVerified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  cursor?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  read: boolean;
  createdAt: string;
  [key: string]: unknown;
}

export interface NotificationQueryOptions {
  userId: string;
  read?: boolean;
  type?: string;
  createdAfter?: Date;
  limit?: number;
  cursor?: string;
}

export interface Job {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  priority: number;
  createdAt: string;
  [key: string]: unknown;
}

export interface JobQueryOptions {
  name?: string;
  status?: Job['status'];
  priority?: number;
  limit?: number;
  cursor?: string;
}

// ============================================================================
// Composite Index Manager
// ============================================================================

export class CompositeIndexManager {
  
  // ==========================================================================
  // User Indexes
  // ==========================================================================
  
  /**
   * Create all composite indexes for a user
   * 
   * Index Structure:
   * - ['users_by_role', role, createdAt, userId] -> null
   * - ['users_by_role_verified', role, emailVerified, createdAt, userId] -> null
   * - ['users_by_verified', emailVerified, createdAt, userId] -> null
   * - ['users_by_created', createdAt, userId] -> null
   * 
   * Benefits:
   * - Fast queries by role: O(log n) instead of O(n)
   * - Fast queries by verification status: O(log n)
   * - Fast queries by role + verification: O(log n)
   * - Chronological ordering built into index
   */
  static async createUserIndexes(kv: Deno.Kv, user: User): Promise<void> {
    const atomic = kv.atomic();
    const timestamp = new Date(user.createdAt).getTime();
    
    // Index by role (sorted by creation date)
    atomic.set(['users_by_role', user.role, timestamp, user.id], null);
    
    // Index by role + emailVerified (composite index)
    atomic.set(
      ['users_by_role_verified', user.role, user.emailVerified ? 'verified' : 'unverified', timestamp, user.id],
      null
    );
    
    // Index by emailVerified (sorted by creation date)
    atomic.set(
      ['users_by_verified', user.emailVerified ? 'verified' : 'unverified', timestamp, user.id],
      null
    );
    
    // Index by creation date (for chronological queries)
    atomic.set(['users_by_created', timestamp, user.id], null);
    
    const result = await atomic.commit();
    if (!result.ok) {
      logger.error('Failed to create user indexes', null, { userId: user.id });
      throw new Error('Failed to create user indexes');
    }
  }
  
  /**
   * Update user indexes when user data changes
   */
  static async updateUserIndexes(kv: Deno.Kv, oldUser: User, newUser: User): Promise<void> {
    const atomic = kv.atomic();
    const oldTimestamp = new Date(oldUser.createdAt).getTime();
    const newTimestamp = new Date(newUser.createdAt).getTime();
    
    // Delete old indexes
    atomic.delete(['users_by_role', oldUser.role, oldTimestamp, oldUser.id]);
    atomic.delete([
      'users_by_role_verified',
      oldUser.role,
      oldUser.emailVerified ? 'verified' : 'unverified',
      oldTimestamp,
      oldUser.id
    ]);
    atomic.delete([
      'users_by_verified',
      oldUser.emailVerified ? 'verified' : 'unverified',
      oldTimestamp,
      oldUser.id
    ]);
    atomic.delete(['users_by_created', oldTimestamp, oldUser.id]);
    
    // Create new indexes
    atomic.set(['users_by_role', newUser.role, newTimestamp, newUser.id], null);
    atomic.set([
      'users_by_role_verified',
      newUser.role,
      newUser.emailVerified ? 'verified' : 'unverified',
      newTimestamp,
      newUser.id
    ], null);
    atomic.set([
      'users_by_verified',
      newUser.emailVerified ? 'verified' : 'unverified',
      newTimestamp,
      newUser.id
    ], null);
    atomic.set(['users_by_created', newTimestamp, newUser.id], null);
    
    const result = await atomic.commit();
    if (!result.ok) {
      logger.error('Failed to update user indexes', null, { userId: newUser.id });
      throw new Error('Failed to update user indexes');
    }
  }
  
  /**
   * Delete all user indexes
   */
  static async deleteUserIndexes(kv: Deno.Kv, user: User): Promise<void> {
    const atomic = kv.atomic();
    const timestamp = new Date(user.createdAt).getTime();
    
    atomic.delete(['users_by_role', user.role, timestamp, user.id]);
    atomic.delete([
      'users_by_role_verified',
      user.role,
      user.emailVerified ? 'verified' : 'unverified',
      timestamp,
      user.id
    ]);
    atomic.delete([
      'users_by_verified',
      user.emailVerified ? 'verified' : 'unverified',
      timestamp,
      user.id
    ]);
    atomic.delete(['users_by_created', timestamp, user.id]);
    
    const result = await atomic.commit();
    if (!result.ok) {
      logger.error('Failed to delete user indexes', null, { userId: user.id });
      throw new Error('Failed to delete user indexes');
    }
  }
  
  /**
   * Query users using composite indexes
   * 
   * @example
   * ```typescript
   * // Get all admins
   * const admins = await queryUsers({ role: 'admin' });
   * 
   * // Get verified admins
   * const verifiedAdmins = await queryUsers({ 
   *   role: 'admin', 
   *   emailVerified: true 
   * });
   * 
   * // Get users created in last 24 hours
   * const newUsers = await queryUsers({ 
   *   createdAfter: new Date(Date.now() - 24 * 60 * 60 * 1000)
   * });
   * ```
   */
  static async queryUsers(options: UserQueryOptions, kvInstance?: Deno.Kv): Promise<User[]> {
    const kv = kvInstance || await getKv();
    const {
      role,
      emailVerified,
      createdAfter,
      createdBefore,
      limit = 100,
      cursor
    } = options;
    
    // Choose the most specific index
    let prefix: Deno.KvKey;
    let startKey: Deno.KvKey | undefined;
    
    if (role !== undefined && emailVerified !== undefined) {
      // Most specific: role + emailVerified
      prefix = ['users_by_role_verified', role, emailVerified ? 'verified' : 'unverified'];
    } else if (role !== undefined) {
      // Role only
      prefix = ['users_by_role', role];
    } else if (emailVerified !== undefined) {
      // EmailVerified only
      prefix = ['users_by_verified', emailVerified ? 'verified' : 'unverified'];
    } else {
      // No filters, use creation date index
      prefix = ['users_by_created'];
    }
    
    // Handle date range filtering
    if (createdAfter) {
      const timestamp = createdAfter.getTime();
      startKey = [...prefix, timestamp];
    }
    
    // Handle cursor pagination
    if (cursor) {
      try {
        const parsed = JSON.parse(atob(cursor));
        startKey = parsed;
      } catch {
        logger.warn('Invalid cursor, ignoring', { cursor });
      }
    }
    
    // Query the index
    const userIds: string[] = [];
    const entries = kv.list({
      prefix,
      ...(startKey && { start: startKey })
    }, {
      limit: limit + 1, // Fetch one extra to check if there are more
      reverse: true // Newest first
    });
    
    for await (const entry of entries) {
      // Extract userId from key (last element)
      const userId = entry.key[entry.key.length - 1] as string;
      userIds.push(userId);
      
      if (userIds.length >= limit) {
        break;
      }
    }
    
    // Fetch full user data in parallel
    const users = await Promise.all(
      userIds.map(async (userId) => {
        const userEntry = await kv.get<User>(['users', userId]);
        return userEntry.value;
      })
    );
    
    // Filter out nulls and apply additional filters
    let filteredUsers = users.filter((u): u is User => u !== null);
    
    if (createdBefore) {
      filteredUsers = filteredUsers.filter((u: User) => 
        new Date(u.createdAt) < createdBefore
      );
    }
    
    logger.debug('User query completed', {
      options,
      resultCount: filteredUsers.length
    });
    
    return filteredUsers;
  }
  
  // ==========================================================================
  // Notification Indexes
  // ==========================================================================
  
  /**
   * Create composite indexes for a notification
   * 
   * Index Structure:
   * - ['notifications_by_user_read', userId, read, timestamp, notificationId] -> null
   * - ['notifications_by_user_type', userId, type, timestamp, notificationId] -> null
   * 
   * Benefits:
   * - Fast queries for unread notifications: O(log n)
   * - Fast queries by notification type: O(log n)
   * - No full table scan needed
   */
  static async createNotificationIndexes(kv: Deno.Kv, notification: Notification): Promise<void> {
    const atomic = kv.atomic();
    const timestamp = new Date(notification.createdAt).getTime();
    
    // Index by userId + read status
    atomic.set(
      ['notifications_by_user_read', notification.userId, notification.read ? 'read' : 'unread', timestamp, notification.id],
      null
    );
    
    // Index by userId + type
    atomic.set(
      ['notifications_by_user_type', notification.userId, notification.type, timestamp, notification.id],
      null
    );
    
    const result = await atomic.commit();
    if (!result.ok) {
      logger.error('Failed to create notification indexes', null, { notificationId: notification.id });
      throw new Error('Failed to create notification indexes');
    }
  }
  
  /**
   * Update notification indexes (e.g., when marking as read)
   */
  static async updateNotificationIndexes(
    kv: Deno.Kv,
    oldNotification: Notification,
    newNotification: Notification
  ): Promise<void> {
    const atomic = kv.atomic();
    const timestamp = new Date(oldNotification.createdAt).getTime();
    
    // Delete old indexes
    atomic.delete([
      'notifications_by_user_read',
      oldNotification.userId,
      oldNotification.read ? 'read' : 'unread',
      timestamp,
      oldNotification.id
    ]);
    atomic.delete([
      'notifications_by_user_type',
      oldNotification.userId,
      oldNotification.type,
      timestamp,
      oldNotification.id
    ]);
    
    // Create new indexes
    atomic.set([
      'notifications_by_user_read',
      newNotification.userId,
      newNotification.read ? 'read' : 'unread',
      timestamp,
      newNotification.id
    ], null);
    atomic.set([
      'notifications_by_user_type',
      newNotification.userId,
      newNotification.type,
      timestamp,
      newNotification.id
    ], null);
    
    const result = await atomic.commit();
    if (!result.ok) {
      logger.error('Failed to update notification indexes', null, { notificationId: newNotification.id });
      throw new Error('Failed to update notification indexes');
    }
  }
  
  /**
   * Delete notification indexes
   */
  static async deleteNotificationIndexes(kv: Deno.Kv, notification: Notification): Promise<void> {
    const atomic = kv.atomic();
    const timestamp = new Date(notification.createdAt).getTime();
    
    atomic.delete([
      'notifications_by_user_read',
      notification.userId,
      notification.read ? 'read' : 'unread',
      timestamp,
      notification.id
    ]);
    atomic.delete([
      'notifications_by_user_type',
      notification.userId,
      notification.type,
      timestamp,
      notification.id
    ]);
    
    const result = await atomic.commit();
    if (!result.ok) {
      logger.error('Failed to delete notification indexes', null, { notificationId: notification.id });
      throw new Error('Failed to delete notification indexes');
    }
  }
  
  /**
   * Query notifications using composite indexes
   * 
   * @example
   * ```typescript
   * // Get unread notifications for user
   * const unread = await queryNotifications({ 
   *   userId: '123',
   *   read: false 
   * });
   * 
   * // Get notifications by type
   * const alerts = await queryNotifications({ 
   *   userId: '123',
   *   type: 'alert' 
   * });
   * ```
   */
  static async queryNotifications(options: NotificationQueryOptions, kvInstance?: Deno.Kv): Promise<Notification[]> {
    const kv = kvInstance || await getKv();
    const { userId, read, type, createdAfter, limit = 50, cursor } = options;
    
    // Choose the appropriate index
    let prefix: Deno.KvKey;
    
    if (read !== undefined) {
      prefix = ['notifications_by_user_read', userId, read ? 'read' : 'unread'];
    } else if (type !== undefined) {
      prefix = ['notifications_by_user_type', userId, type];
    } else {
      // Fall back to existing index
      prefix = ['notifications_by_user', userId];
    }
    
    // Build start key for date filtering or cursor
    let startKey: Deno.KvKey | undefined;
    if (cursor) {
      try {
        startKey = JSON.parse(atob(cursor));
      } catch {
        logger.warn('Invalid cursor, ignoring', { cursor });
      }
    } else if (createdAfter) {
      startKey = [...prefix, createdAfter.getTime()];
    }
    
    // Query the index
    const notificationIds: string[] = [];
    const entries = kv.list({
      prefix,
      ...(startKey && { start: startKey })
    }, {
      limit: limit + 1,
      reverse: true
    });
    
    for await (const entry of entries) {
      const notificationId = entry.key[entry.key.length - 1] as string;
      notificationIds.push(notificationId);
      
      if (notificationIds.length >= limit) {
        break;
      }
    }
    
    // Fetch full notification data in parallel
    const notifications = await Promise.all(
      notificationIds.map(async (id) => {
        const entry = await kv.get<Notification>(['notifications', userId, id]);
        return entry.value;
      })
    );
    
    return notifications.filter((n): n is Notification => n !== null);
  }
  
  // ==========================================================================
  // Job Indexes
  // ==========================================================================
  
  /**
   * Create composite indexes for a job
   * 
   * Index Structure:
   * - ['jobs_by_name_status', name, status, priority, createdAt, jobId] -> null
   * - ['jobs_by_status', status, priority, createdAt, jobId] -> null
   * - ['jobs_by_priority', priority, createdAt, jobId] -> null
   * 
   * Benefits:
   * - Fast queries by name + status: O(log n)
   * - Fast queries by status only: O(log n)
   * - Priority-based ordering built in
   */
  static async createJobIndexes(kv: Deno.Kv, job: Job): Promise<void> {
    const atomic = kv.atomic();
    const timestamp = new Date(job.createdAt).getTime();
    
    // Index by name + status + priority
    atomic.set(
      ['jobs_by_name_status', job.name, job.status, job.priority, timestamp, job.id],
      null
    );
    
    // Index by status + priority
    atomic.set(
      ['jobs_by_status', job.status, job.priority, timestamp, job.id],
      null
    );
    
    // Index by priority (for priority-based processing)
    atomic.set(
      ['jobs_by_priority', job.priority, timestamp, job.id],
      null
    );
    
    const result = await atomic.commit();
    if (!result.ok) {
      logger.error('Failed to create job indexes', null, { jobId: job.id });
      throw new Error('Failed to create job indexes');
    }
  }
  
  /**
   * Update job indexes when job status or priority changes
   */
  static async updateJobIndexes(kv: Deno.Kv, oldJob: Job, newJob: Job): Promise<void> {
    const atomic = kv.atomic();
    const oldTimestamp = new Date(oldJob.createdAt).getTime();
    const newTimestamp = new Date(newJob.createdAt).getTime();
    
    // Delete old indexes
    atomic.delete(['jobs_by_name_status', oldJob.name, oldJob.status, oldJob.priority, oldTimestamp, oldJob.id]);
    atomic.delete(['jobs_by_status', oldJob.status, oldJob.priority, oldTimestamp, oldJob.id]);
    atomic.delete(['jobs_by_priority', oldJob.priority, oldTimestamp, oldJob.id]);
    
    // Create new indexes
    atomic.set(['jobs_by_name_status', newJob.name, newJob.status, newJob.priority, newTimestamp, newJob.id], null);
    atomic.set(['jobs_by_status', newJob.status, newJob.priority, newTimestamp, newJob.id], null);
    atomic.set(['jobs_by_priority', newJob.priority, newTimestamp, newJob.id], null);
    
    const result = await atomic.commit();
    if (!result.ok) {
      logger.error('Failed to update job indexes', null, { jobId: newJob.id });
      throw new Error('Failed to update job indexes');
    }
  }
  
  /**
   * Delete job indexes
   */
  static async deleteJobIndexes(kv: Deno.Kv, job: Job): Promise<void> {
    const atomic = kv.atomic();
    const timestamp = new Date(job.createdAt).getTime();
    
    atomic.delete(['jobs_by_name_status', job.name, job.status, job.priority, timestamp, job.id]);
    atomic.delete(['jobs_by_status', job.status, job.priority, timestamp, job.id]);
    atomic.delete(['jobs_by_priority', job.priority, timestamp, job.id]);
    
    const result = await atomic.commit();
    if (!result.ok) {
      logger.error('Failed to delete job indexes', null, { jobId: job.id });
      throw new Error('Failed to delete job indexes');
    }
  }
  
  /**
   * Query jobs using composite indexes
   * 
   * @example
   * ```typescript
   * // Get failed jobs for specific name
   * const failedEmailJobs = await queryJobs({ 
   *   name: 'send-email',
   *   status: 'failed' 
   * });
   * 
   * // Get all pending jobs by priority
   * const pendingJobs = await queryJobs({ status: 'pending' });
   * ```
   */
  static async queryJobs(options: JobQueryOptions, kvInstance?: Deno.Kv): Promise<Job[]> {
    const kv = kvInstance || await getKv();
    const { name, status, priority, limit = 50, cursor } = options;
    
    // Choose the most specific index
    let prefix: Deno.KvKey;
    
    if (name !== undefined && status !== undefined) {
      prefix = ['jobs_by_name_status', name, status];
    } else if (status !== undefined) {
      prefix = ['jobs_by_status', status];
    } else if (priority !== undefined) {
      prefix = ['jobs_by_priority', priority];
    } else {
      // Fall back to existing index
      prefix = ['jobs'];
    }
    
    // Handle cursor pagination
    let startKey: Deno.KvKey | undefined;
    if (cursor) {
      try {
        startKey = JSON.parse(atob(cursor));
      } catch {
        logger.warn('Invalid cursor, ignoring', { cursor });
      }
    }
    
    // Query the index
    const jobIds: string[] = [];
    const entries = kv.list({
      prefix,
      ...(startKey && { start: startKey })
    }, {
      limit: limit + 1,
      reverse: true // Higher priority first
    });
    
    for await (const entry of entries) {
      const jobId = entry.key[entry.key.length - 1] as string;
      jobIds.push(jobId);
      
      if (jobIds.length >= limit) {
        break;
      }
    }
    
    // Fetch full job data in parallel
    const jobs = await Promise.all(
      jobIds.map(async (id) => {
        const entry = await kv.get<Job>(['jobs', id]);
        return entry.value;
      })
    );
    
    return jobs.filter((j): j is Job => j !== null);
  }
  
  // ==========================================================================
  // Maintenance
  // ==========================================================================
  
  /**
   * Rebuild all indexes for consistency
   * Use this if indexes get out of sync
   */
  static async rebuildAllIndexes(kvInstance?: Deno.Kv): Promise<{
    users: number;
    notifications: number;
    jobs: number;
  }> {
    const kv = kvInstance || await getKv();
    logger.info('Starting index rebuild');
    
    let userCount = 0;
    let notificationCount = 0;
    let jobCount = 0;
    
    // Rebuild user indexes
    const users = kv.list<User>({ prefix: ['users'] });
    for await (const entry of users) {
      if (entry.value && entry.value.id) {
        await this.createUserIndexes(kv, entry.value);
        userCount++;
      }
    }
    
    // Rebuild notification indexes
    const notifications = kv.list<Notification>({ prefix: ['notifications'] });
    for await (const entry of notifications) {
      if (entry.value && entry.value.id) {
        await this.createNotificationIndexes(kv, entry.value);
        notificationCount++;
      }
    }
    
    // Rebuild job indexes
    const jobs = kv.list<Job>({ prefix: ['jobs'] });
    for await (const entry of jobs) {
      if (entry.value && entry.value.id) {
        await this.createJobIndexes(kv, entry.value);
        jobCount++;
      }
    }
    
    logger.info('Index rebuild completed', {
      users: userCount,
      notifications: notificationCount,
      jobs: jobCount
    });
    
    return { users: userCount, notifications: notificationCount, jobs: jobCount };
  }
  
  /**
   * Clean up orphaned indexes (indexes pointing to non-existent records)
   */
  static async cleanupOrphanedIndexes(kvInstance?: Deno.Kv): Promise<number> {
    const kv = kvInstance || await getKv();
    let cleaned = 0;
    
    // Clean user indexes
    const userIndexPrefixes = [
      'users_by_role',
      'users_by_role_verified',
      'users_by_verified',
      'users_by_created'
    ];
    
    for (const indexPrefix of userIndexPrefixes) {
      const entries = kv.list({ prefix: [indexPrefix] });
      for await (const entry of entries) {
        const userId = entry.key[entry.key.length - 1] as string;
        const user = await kv.get(['users', userId]);
        if (!user.value) {
          await kv.delete(entry.key);
          cleaned++;
        }
      }
    }
    
    logger.info('Cleanup completed', { cleaned });
    return cleaned;
  }
}

// Export singleton instance
export const compositeIndexes = CompositeIndexManager;

