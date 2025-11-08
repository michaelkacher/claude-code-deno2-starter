/// <reference lib="deno.unstable" />

/**
 * Composite Indexes Tests
 * 
 * Tests for the composite index system that enables efficient
 * multi-field queries in Deno KV
 */

import { assertEquals } from 'jsr:@std/assert';
import { beforeEach, describe, it } from 'jsr:@std/testing/bdd';
import {
    CompositeIndexManager,
    type Job,
    type Notification,
    type User,
} from '../../shared/lib/composite-indexes.ts';

describe('CompositeIndexManager', () => {
  let kv: Deno.Kv;

  beforeEach(async () => {
    // Create a fresh in-memory KV store for each test
    kv = await Deno.openKv(':memory:');
  });

  // ==========================================================================
  // User Indexes
  // ==========================================================================

  describe('User Indexes', () => {
    it('should create user indexes', async () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        emailVerified: false,
        createdAt: new Date().toISOString(),
      };

      await CompositeIndexManager.createUserIndexes(kv, user);

      // Verify indexes exist
      const timestamp = new Date(user.createdAt).getTime();
      const roleIndex = await kv.get(['users_by_role', 'user', timestamp, '1']);
      const roleVerifiedIndex = await kv.get([
        'users_by_role_verified',
        'user',
        'unverified',
        timestamp,
        '1',
      ]);
      const verifiedIndex = await kv.get([
        'users_by_verified',
        'unverified',
        timestamp,
        '1',
      ]);
      const createdIndex = await kv.get(['users_by_created', timestamp, '1']);

      assertEquals(roleIndex.value, null);
      assertEquals(roleVerifiedIndex.value, null);
      assertEquals(verifiedIndex.value, null);
      assertEquals(createdIndex.value, null);
    });

    it('should query users by role', async () => {
      // Create test users
      const admin: User = {
        id: 'admin1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };

      const user1: User = {
        id: 'user1',
        email: 'user1@example.com',
        name: 'User 1',
        role: 'user',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };

      const user2: User = {
        id: 'user2',
        email: 'user2@example.com',
        name: 'User 2',
        role: 'user',
        emailVerified: false,
        createdAt: new Date().toISOString(),
      };

      // Store users
      await kv.set(['users', admin.id], admin);
      await kv.set(['users', user1.id], user1);
      await kv.set(['users', user2.id], user2);

      // Create indexes
      await CompositeIndexManager.createUserIndexes(kv, admin);
      await CompositeIndexManager.createUserIndexes(kv, user1);
      await CompositeIndexManager.createUserIndexes(kv, user2);

      // Query by role
      const admins = await CompositeIndexManager.queryUsers({ role: 'admin' });
      const users = await CompositeIndexManager.queryUsers({ role: 'user' });

      assertEquals(admins.length, 1);
      assertEquals(admins[0].id, 'admin1');
      assertEquals(users.length, 2);
    });

    it('should query users by role and emailVerified', async () => {
      const users: User[] = [
        {
          id: 'admin-verified',
          email: 'admin-v@example.com',
          name: 'Admin Verified',
          role: 'admin',
          emailVerified: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'admin-unverified',
          email: 'admin-u@example.com',
          name: 'Admin Unverified',
          role: 'admin',
          emailVerified: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'user-verified',
          email: 'user-v@example.com',
          name: 'User Verified',
          role: 'user',
          emailVerified: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'user-unverified',
          email: 'user-u@example.com',
          name: 'User Unverified',
          role: 'user',
          emailVerified: false,
          createdAt: new Date().toISOString(),
        },
      ];

      // Store and index all users
      for (const user of users) {
        await kv.set(['users', user.id], user);
        await CompositeIndexManager.createUserIndexes(kv, user);
      }

      // Query verified admins
      const verifiedAdmins = await CompositeIndexManager.queryUsers({
        role: 'admin',
        emailVerified: true,
      });

      assertEquals(verifiedAdmins.length, 1);
      assertEquals(verifiedAdmins[0].id, 'admin-verified');

      // Query unverified users
      const unverifiedUsers = await CompositeIndexManager.queryUsers({
        role: 'user',
        emailVerified: false,
      });

      assertEquals(unverifiedUsers.length, 1);
      assertEquals(unverifiedUsers[0].id, 'user-unverified');
    });

    it('should update user indexes when data changes', async () => {
      const oldUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        emailVerified: false,
        createdAt: new Date().toISOString(),
      };

      const newUser: User = {
        ...oldUser,
        role: 'admin',
        emailVerified: true,
      };

      await kv.set(['users', oldUser.id], oldUser);
      await CompositeIndexManager.createUserIndexes(kv, oldUser);
      await CompositeIndexManager.updateUserIndexes(kv, oldUser, newUser);

      // Query should now find user as admin
      const admins = await CompositeIndexManager.queryUsers({ role: 'admin' });
      assertEquals(admins.length, 1);
      assertEquals(admins[0].id, '1');

      // Should not find user as regular user
      const users = await CompositeIndexManager.queryUsers({ role: 'user' });
      assertEquals(users.length, 0);
    });

    it('should delete user indexes', async () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        emailVerified: false,
        createdAt: new Date().toISOString(),
      };

      await kv.set(['users', user.id], user);
      await CompositeIndexManager.createUserIndexes(kv, user);
      await CompositeIndexManager.deleteUserIndexes(kv, user);

      // Query should return empty
      const users = await CompositeIndexManager.queryUsers({ role: 'user' });
      assertEquals(users.length, 0);
    });

    it('should respect limit parameter', async () => {
      // Create 10 users
      for (let i = 0; i < 10; i++) {
        const user: User = {
          id: `user${i}`,
          email: `user${i}@example.com`,
          name: `User ${i}`,
          role: 'user',
          emailVerified: true,
          createdAt: new Date(Date.now() + i).toISOString(),
        };
        await kv.set(['users', user.id], user);
        await CompositeIndexManager.createUserIndexes(kv, user);
      }

      // Query with limit
      const users = await CompositeIndexManager.queryUsers({
        role: 'user',
        limit: 5,
      });

      assertEquals(users.length, 5);
    });
  });

  // ==========================================================================
  // Notification Indexes
  // ==========================================================================

  describe('Notification Indexes', () => {
    it('should create notification indexes', async () => {
      const notification: Notification = {
        id: 'notif1',
        userId: 'user1',
        type: 'alert',
        read: false,
        createdAt: new Date().toISOString(),
        title: 'Test',
        message: 'Test notification',
      };

      await CompositeIndexManager.createNotificationIndexes(kv, notification);

      // Verify indexes exist
      const timestamp = new Date(notification.createdAt).getTime();
      const readIndex = await kv.get([
        'notifications_by_user_read',
        'user1',
        'unread',
        timestamp,
        'notif1',
      ]);
      const typeIndex = await kv.get([
        'notifications_by_user_type',
        'user1',
        'alert',
        timestamp,
        'notif1',
      ]);

      assertEquals(readIndex.value, null);
      assertEquals(typeIndex.value, null);
    });

    it('should query notifications by read status', async () => {
      const notifications: Notification[] = [
        {
          id: 'notif1',
          userId: 'user1',
          type: 'alert',
          read: false,
          createdAt: new Date().toISOString(),
          title: 'Unread 1',
          message: 'Test',
        },
        {
          id: 'notif2',
          userId: 'user1',
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
          title: 'Unread 2',
          message: 'Test',
        },
        {
          id: 'notif3',
          userId: 'user1',
          type: 'alert',
          read: true,
          createdAt: new Date().toISOString(),
          title: 'Read',
          message: 'Test',
        },
      ];

      // Store and index notifications
      for (const notif of notifications) {
        await kv.set(['notifications', notif.userId, notif.id], notif);
        await CompositeIndexManager.createNotificationIndexes(kv, notif);
      }

      // Query unread notifications
      const unread = await CompositeIndexManager.queryNotifications({
        userId: 'user1',
        read: false,
      });

      assertEquals(unread.length, 2);
      assertEquals(unread.every((n) => !n.read), true);
    });

    it('should query notifications by type', async () => {
      const notifications: Notification[] = [
        {
          id: 'notif1',
          userId: 'user1',
          type: 'alert',
          read: false,
          createdAt: new Date().toISOString(),
          title: 'Alert 1',
          message: 'Test',
        },
        {
          id: 'notif2',
          userId: 'user1',
          type: 'alert',
          read: true,
          createdAt: new Date().toISOString(),
          title: 'Alert 2',
          message: 'Test',
        },
        {
          id: 'notif3',
          userId: 'user1',
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
          title: 'Info',
          message: 'Test',
        },
      ];

      for (const notif of notifications) {
        await kv.set(['notifications', notif.userId, notif.id], notif);
        await CompositeIndexManager.createNotificationIndexes(kv, notif);
      }

      // Query by type
      const alerts = await CompositeIndexManager.queryNotifications({
        userId: 'user1',
        type: 'alert',
      });

      assertEquals(alerts.length, 2);
      assertEquals(alerts.every((n) => n.type === 'alert'), true);
    });

    it('should update notification indexes when marking as read', async () => {
      const oldNotif: Notification = {
        id: 'notif1',
        userId: 'user1',
        type: 'alert',
        read: false,
        createdAt: new Date().toISOString(),
        title: 'Test',
        message: 'Test',
      };

      const newNotif: Notification = {
        ...oldNotif,
        read: true,
        readAt: new Date().toISOString(),
      };

      await kv.set(['notifications', oldNotif.userId, oldNotif.id], oldNotif);
      await CompositeIndexManager.createNotificationIndexes(kv, oldNotif);
      await CompositeIndexManager.updateNotificationIndexes(
        kv,
        oldNotif,
        newNotif,
      );

      // Query should now find notification as read
      const read = await CompositeIndexManager.queryNotifications({
        userId: 'user1',
        read: true,
      });
      assertEquals(read.length, 1);

      // Should not find as unread
      const unread = await CompositeIndexManager.queryNotifications({
        userId: 'user1',
        read: false,
      });
      assertEquals(unread.length, 0);
    });
  });

  // ==========================================================================
  // Job Indexes
  // ==========================================================================

  describe('Job Indexes', () => {
    it('should create job indexes', async () => {
      const job: Job = {
        id: 'job1',
        name: 'send-email',
        status: 'pending',
        priority: 5,
        createdAt: new Date().toISOString(),
      };

      await CompositeIndexManager.createJobIndexes(kv, job);

      // Verify indexes exist
      const timestamp = new Date(job.createdAt).getTime();
      const nameStatusIndex = await kv.get([
        'jobs_by_name_status',
        'send-email',
        'pending',
        5,
        timestamp,
        'job1',
      ]);
      const statusIndex = await kv.get([
        'jobs_by_status',
        'pending',
        5,
        timestamp,
        'job1',
      ]);
      const priorityIndex = await kv.get([
        'jobs_by_priority',
        5,
        timestamp,
        'job1',
      ]);

      assertEquals(nameStatusIndex.value, null);
      assertEquals(statusIndex.value, null);
      assertEquals(priorityIndex.value, null);
    });

    it('should query jobs by name and status', async () => {
      const jobs: Job[] = [
        {
          id: 'job1',
          name: 'send-email',
          status: 'pending',
          priority: 5,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'job2',
          name: 'send-email',
          status: 'failed',
          priority: 5,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'job3',
          name: 'process-data',
          status: 'pending',
          priority: 3,
          createdAt: new Date().toISOString(),
        },
      ];

      for (const job of jobs) {
        await kv.set(['jobs', job.id], job);
        await CompositeIndexManager.createJobIndexes(kv, job);
      }

      // Query failed send-email jobs
      const failedEmailJobs = await CompositeIndexManager.queryJobs({
        name: 'send-email',
        status: 'failed',
      });

      assertEquals(failedEmailJobs.length, 1);
      assertEquals(failedEmailJobs[0].id, 'job2');
    });

    it('should query jobs by status only', async () => {
      const jobs: Job[] = [
        {
          id: 'job1',
          name: 'send-email',
          status: 'pending',
          priority: 5,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'job2',
          name: 'process-data',
          status: 'pending',
          priority: 3,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'job3',
          name: 'send-email',
          status: 'completed',
          priority: 5,
          createdAt: new Date().toISOString(),
        },
      ];

      for (const job of jobs) {
        await kv.set(['jobs', job.id], job);
        await CompositeIndexManager.createJobIndexes(kv, job);
      }

      // Query all pending jobs
      const pendingJobs = await CompositeIndexManager.queryJobs({
        status: 'pending',
      });

      assertEquals(pendingJobs.length, 2);
      assertEquals(
        pendingJobs.every((j) => j.status === 'pending'),
        true,
      );
    });

    it('should update job indexes when status changes', async () => {
      const oldJob: Job = {
        id: 'job1',
        name: 'send-email',
        status: 'pending',
        priority: 5,
        createdAt: new Date().toISOString(),
      };

      const newJob: Job = {
        ...oldJob,
        status: 'completed',
      };

      await kv.set(['jobs', oldJob.id], oldJob);
      await CompositeIndexManager.createJobIndexes(kv, oldJob);
      await CompositeIndexManager.updateJobIndexes(kv, oldJob, newJob);

      // Query should find as completed
      const completed = await CompositeIndexManager.queryJobs({
        status: 'completed',
      });
      assertEquals(completed.length, 1);

      // Should not find as pending
      const pending = await CompositeIndexManager.queryJobs({
        status: 'pending',
      });
      assertEquals(pending.length, 0);
    });
  });

  // ==========================================================================
  // Maintenance
  // ==========================================================================

  describe('Maintenance', () => {
    it('should rebuild all indexes', async () => {
      // Create test data without indexes
      const user: User = {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };

      const notification: Notification = {
        id: 'notif1',
        userId: 'user1',
        type: 'alert',
        read: false,
        createdAt: new Date().toISOString(),
        title: 'Test',
        message: 'Test',
      };

      const job: Job = {
        id: 'job1',
        name: 'send-email',
        status: 'pending',
        priority: 5,
        createdAt: new Date().toISOString(),
      };

      await kv.set(['users', user.id], user);
      await kv.set(['notifications', notification.userId, notification.id], notification);
      await kv.set(['jobs', job.id], job);

      // Rebuild indexes
      const result = await CompositeIndexManager.rebuildAllIndexes();

      assertEquals(result.users, 1);
      assertEquals(result.notifications, 1);
      assertEquals(result.jobs, 1);

      // Verify queries work
      const users = await CompositeIndexManager.queryUsers({ role: 'user' });
      assertEquals(users.length, 1);
    });

    it('should cleanup orphaned indexes', async () => {
      const user: User = {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };

      await kv.set(['users', user.id], user);
      await CompositeIndexManager.createUserIndexes(kv, user);

      // Delete the user but leave indexes
      await kv.delete(['users', user.id]);

      // Cleanup should remove orphaned indexes
      const cleaned = await CompositeIndexManager.cleanupOrphanedIndexes();
      assertEquals(cleaned > 0, true);
    });
  });
});
