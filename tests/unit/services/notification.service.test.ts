/// <reference lib="deno.unstable" />

/**
 * NotificationService Tests
 *
 * Tests business logic for notification operations including:
 * - Creating notifications
 * - Listing user notifications
 * - Getting unread count
 * - Marking notifications as read
 * - Deleting notifications
 *
 * Note: NotificationService is a thin wrapper around NotificationRepository
 * with WebSocket broadcasting (non-critical, wrapped in try-catch).
 * Focus: Repository integration and basic business logic.
 */

import { assertEquals, assertExists } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { NotificationRepository } from '../../../shared/repositories/index.ts';
import { NotificationService } from '../../../shared/services/notifications.ts';
import { setupTestKv } from '../../helpers/kv-test.ts';

// Disable resource sanitizer for WebSocket intervals
describe('NotificationService', {
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  let kv: Deno.Kv;
  let cleanup: () => Promise<void>;
  let repo: NotificationRepository;

  beforeEach(async () => {
    const setup = await setupTestKv();
    kv = setup.kv;
    cleanup = setup.cleanup;
    repo = new NotificationRepository({ kv });
    // Inject test repository into service
    new NotificationService(repo);
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('business logic: create notification', () => {
    it('should create notification with all required fields', async () => {
      // Arrange
      const userId = 'user-123';
      const notificationData = {
        userId,
        type: 'info' as const,
        title: 'Test Notification',
        message: 'This is a test message',
        link: '/test',
      };

      // Act
      const notification = await NotificationService.create(notificationData);

      // Assert: Business logic - notification created with correct data
      assertExists(notification.id);
      assertEquals(notification.userId, userId);
      assertEquals(notification.type, 'info');
      assertEquals(notification.title, 'Test Notification');
      assertEquals(notification.message, 'This is a test message');
      assertEquals(notification.link, '/test');
      assertEquals(notification.read, false);
      assertExists(notification.createdAt);

      // Verify notification stored in KV
      const stored = await repo.findById(userId, notification.id);
      assertExists(stored);
      assertEquals(stored.id, notification.id);
    });

    it('should create notification without optional link', async () => {
      // Arrange
      const userId = 'user-456';
      const notificationData = {
        userId,
        type: 'warning' as const,
        title: 'Warning',
        message: 'Warning message',
      };

      // Act
      const notification = await NotificationService.create(notificationData);

      // Assert
      assertExists(notification.id);
      assertEquals(notification.link, undefined);
    });

    it('should handle different notification types', async () => {
      // Arrange & Act
      const info = await NotificationService.create({
        userId: 'user-1',
        type: 'info',
        title: 'Info',
        message: 'Info message',
      });

      const success = await NotificationService.create({
        userId: 'user-1',
        type: 'success',
        title: 'Success',
        message: 'Success message',
      });

      const warning = await NotificationService.create({
        userId: 'user-1',
        type: 'warning',
        title: 'Warning',
        message: 'Warning message',
      });

      const error = await NotificationService.create({
        userId: 'user-1',
        type: 'error',
        title: 'Error',
        message: 'Error message',
      });

      // Assert
      assertEquals(info.type, 'info');
      assertEquals(success.type, 'success');
      assertEquals(warning.type, 'warning');
      assertEquals(error.type, 'error');
    });
  });

  describe('business logic: list user notifications', () => {
    it('should return empty list when no notifications exist', async () => {
      // Act
      const notifications = await NotificationService.getUserNotifications('user-empty');

      // Assert
      assertEquals(notifications.length, 0);
    });

    it('should list all notifications for user', async () => {
      // Arrange: Create multiple notifications
      const userId = 'user-list';
      await NotificationService.create({
        userId,
        type: 'info',
        title: 'First',
        message: 'First notification',
      });

      await NotificationService.create({
        userId,
        type: 'success',
        title: 'Second',
        message: 'Second notification',
      });

      await NotificationService.create({
        userId,
        type: 'warning',
        title: 'Third',
        message: 'Third notification',
      });

      // Act
      const notifications = await NotificationService.getUserNotifications(userId);

      // Assert: Business logic - all notifications returned
      assertEquals(notifications.length, 3);
    });

    it('should not return notifications from other users', async () => {
      // Arrange: Create notifications for different users
      await NotificationService.create({
        userId: 'user-a',
        type: 'info',
        title: 'User A notification',
        message: 'For user A',
      });

      await NotificationService.create({
        userId: 'user-b',
        type: 'info',
        title: 'User B notification',
        message: 'For user B',
      });

      // Act
      const userANotifications = await NotificationService.getUserNotifications('user-a');
      const userBNotifications = await NotificationService.getUserNotifications('user-b');

      // Assert: Business logic - user isolation
      assertEquals(userANotifications.length, 1);
      assertEquals(userANotifications[0]?.title, 'User A notification');
      assertEquals(userBNotifications.length, 1);
      assertEquals(userBNotifications[0]?.title, 'User B notification');
    });

    it('should respect limit option', async () => {
      // Arrange: Create many notifications
      const userId = 'user-limit';
      for (let i = 0; i < 10; i++) {
        await NotificationService.create({
          userId,
          type: 'info',
          title: `Notification ${i}`,
          message: `Message ${i}`,
        });
      }

      // Act
      const notifications = await NotificationService.getUserNotifications(userId, { limit: 5 });

      // Assert
      assertEquals(notifications.length, 5);
    });
  });

  describe('business logic: unread count', () => {
    it('should return 0 when no notifications exist', async () => {
      // Act
      const count = await NotificationService.getUnreadCount('user-nocount');

      // Assert
      assertEquals(count, 0);
    });

    it('should count only unread notifications', async () => {
      // Arrange: Create read and unread notifications
      const userId = 'user-unread';
      
      const notif1 = await NotificationService.create({
        userId,
        type: 'info',
        title: 'Unread 1',
        message: 'Unread message',
      });

      const notif2 = await NotificationService.create({
        userId,
        type: 'info',
        title: 'Unread 2',
        message: 'Unread message',
      });

      await NotificationService.create({
        userId,
        type: 'info',
        title: 'Unread 3',
        message: 'Unread message',
      });

      // Mark one as read
      await NotificationService.markAsRead(userId, notif1.id);

      // Act
      const count = await NotificationService.getUnreadCount(userId);

      // Assert: Business logic - only unread counted
      assertEquals(count, 2);
    });

    it('should return 0 when all notifications are read', async () => {
      // Arrange: Create and read all notifications
      const userId = 'user-allread';
      
      const notif1 = await NotificationService.create({
        userId,
        type: 'info',
        title: 'Read 1',
        message: 'Read message',
      });

      const notif2 = await NotificationService.create({
        userId,
        type: 'info',
        title: 'Read 2',
        message: 'Read message',
      });

      await NotificationService.markAsRead(userId, notif1.id);
      await NotificationService.markAsRead(userId, notif2.id);

      // Act
      const count = await NotificationService.getUnreadCount(userId);

      // Assert
      assertEquals(count, 0);
    });
  });

  describe('business logic: mark as read', () => {
    it('should mark notification as read', async () => {
      // Arrange: Create notification
      const userId = 'user-markread';
      const notif = await NotificationService.create({
        userId,
        type: 'info',
        title: 'Mark Read Test',
        message: 'Test message',
      });

      // Verify initially unread
      assertEquals(notif.read, false);

      // Act
      const updated = await NotificationService.markAsRead(userId, notif.id);

      // Assert: Business logic - marked as read
      assertExists(updated);
      assertEquals(updated.read, true);
      assertEquals(updated.id, notif.id);

      // Verify in repository
      const stored = await repo.findById(userId, notif.id);
      assertExists(stored);
      assertEquals(stored.read, true);
    });

    it('should return null for non-existent notification', async () => {
      // Act
      const result = await NotificationService.markAsRead('user-xyz', 'non-existent-id');

      // Assert
      assertEquals(result, null);
    });

    it('should be idempotent (marking read multiple times)', async () => {
      // Arrange: Create notification
      const userId = 'user-idempotent';
      const notif = await NotificationService.create({
        userId,
        type: 'info',
        title: 'Idempotent Test',
        message: 'Test message',
      });

      // Act: Mark as read multiple times
      await NotificationService.markAsRead(userId, notif.id);
      const result = await NotificationService.markAsRead(userId, notif.id);

      // Assert: Still works, no error
      assertExists(result);
      assertEquals(result.read, true);
    });
  });

  describe('business logic: mark all as read', () => {
    it('should mark all notifications as read', async () => {
      // Arrange: Create multiple unread notifications
      const userId = 'user-markall';
      await NotificationService.create({
        userId,
        type: 'info',
        title: 'Unread 1',
        message: 'Message 1',
      });

      await NotificationService.create({
        userId,
        type: 'info',
        title: 'Unread 2',
        message: 'Message 2',
      });

      await NotificationService.create({
        userId,
        type: 'info',
        title: 'Unread 3',
        message: 'Message 3',
      });

      // Act
      const count = await NotificationService.markAllAsRead(userId);

      // Assert: Business logic - all marked as read
      assertEquals(count, 3);

      // Verify unread count is now 0
      const unreadCount = await NotificationService.getUnreadCount(userId);
      assertEquals(unreadCount, 0);
    });

    it('should return 0 when no unread notifications exist', async () => {
      // Act
      const count = await NotificationService.markAllAsRead('user-nounread');

      // Assert
      assertEquals(count, 0);
    });

    it('should not affect other users notifications', async () => {
      // Arrange: Create notifications for two users
      const userA = 'user-a-markall';
      const userB = 'user-b-markall';

      await NotificationService.create({
        userId: userA,
        type: 'info',
        title: 'User A',
        message: 'Message A',
      });

      await NotificationService.create({
        userId: userB,
        type: 'info',
        title: 'User B',
        message: 'Message B',
      });

      // Act: Mark all for user A only
      await NotificationService.markAllAsRead(userA);

      // Assert: User B still has unread
      const userBUnread = await NotificationService.getUnreadCount(userB);
      assertEquals(userBUnread, 1);
    });
  });

  describe('business logic: delete notification', () => {
    it('should delete notification', async () => {
      // Arrange: Create notification
      const userId = 'user-delete';
      const notif = await NotificationService.create({
        userId,
        type: 'info',
        title: 'Delete Test',
        message: 'To be deleted',
      });

      // Act
      const deleted = await NotificationService.deleteNotification(userId, notif.id);

      // Assert: Business logic - notification deleted
      assertEquals(deleted, true);

      // Verify not in repository
      const stored = await repo.findById(userId, notif.id);
      assertEquals(stored, null);
    });

    it('should return false for non-existent notification', async () => {
      // Act
      const deleted = await NotificationService.deleteNotification('user-xyz', 'non-existent');

      // Assert
      assertEquals(deleted, false);
    });

    it('should not delete notifications from other users', async () => {
      // Arrange: Create notifications for two users
      const userA = 'user-a-delete';
      const userB = 'user-b-delete';

      const notifA = await NotificationService.create({
        userId: userA,
        type: 'info',
        title: 'User A',
        message: 'Message A',
      });

      const notifB = await NotificationService.create({
        userId: userB,
        type: 'info',
        title: 'User B',
        message: 'Message B',
      });

      // Act: Try to delete user A's notification as user B
      const deleted = await NotificationService.deleteNotification(userB, notifA.id);

      // Assert: Cannot delete other user's notification
      assertEquals(deleted, false);

      // Verify user A's notification still exists
      const stillExists = await repo.findById(userA, notifA.id);
      assertExists(stillExists);
    });
  });

  describe('business logic: delete all for user', () => {
    it('should delete all notifications for user', async () => {
      // Arrange: Create multiple notifications
      const userId = 'user-deleteall';
      await NotificationService.create({
        userId,
        type: 'info',
        title: 'Notification 1',
        message: 'Message 1',
      });

      await NotificationService.create({
        userId,
        type: 'info',
        title: 'Notification 2',
        message: 'Message 2',
      });

      await NotificationService.create({
        userId,
        type: 'info',
        title: 'Notification 3',
        message: 'Message 3',
      });

      // Act
      const count = await NotificationService.deleteAllForUser(userId);

      // Assert: Business logic - all deleted
      assertEquals(count, 3);

      // Verify none remain
      const notifications = await NotificationService.getUserNotifications(userId);
      assertEquals(notifications.length, 0);
    });

    it('should return 0 when no notifications exist', async () => {
      // Act
      const count = await NotificationService.deleteAllForUser('user-nonexistent');

      // Assert
      assertEquals(count, 0);
    });

    it('should not affect other users notifications', async () => {
      // Arrange: Create notifications for two users
      const userA = 'user-a-deleteall';
      const userB = 'user-b-deleteall';

      await NotificationService.create({
        userId: userA,
        type: 'info',
        title: 'User A',
        message: 'Message A',
      });

      await NotificationService.create({
        userId: userB,
        type: 'info',
        title: 'User B',
        message: 'Message B',
      });

      // Act: Delete all for user A
      await NotificationService.deleteAllForUser(userA);

      // Assert: User B notifications unaffected
      const userBNotifs = await NotificationService.getUserNotifications(userB);
      assertEquals(userBNotifs.length, 1);
    });
  });
});
