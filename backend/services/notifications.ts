import { getKv } from '../lib/kv.ts';
import type {
    CreateNotificationRequest,
    NotificationData,
} from '../types/notifications.ts';

/**
 * NotificationService
 * Handles CRUD operations for user notifications using Deno KV
 * 
 * Key Structure:
 * - ['notifications', userId, notificationId] -> NotificationData
 * - ['notifications_by_user', userId, timestamp, notificationId] -> null (for listing by date)
 */
export class NotificationService {
  /**
   * Create a new notification for a user
   */
  static async create(
    data: CreateNotificationRequest,
  ): Promise<NotificationData> {
    const kv = await getKv();
    const notificationId = crypto.randomUUID();
    const now = new Date().toISOString();

    const notification: NotificationData = {
      id: notificationId,
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
      read: false,
      createdAt: now,
    };

    // Atomic transaction: store notification + create index for listing
    const result = await kv.atomic()
      .set(['notifications', data.userId, notificationId], notification)
      .set(
        ['notifications_by_user', data.userId, now, notificationId],
        null,
      ) // Secondary index
      .commit();

    if (!result.ok) {
      throw new Error('Failed to create notification');
    }

    return notification;
  }

  /**
   * Get all notifications for a user (sorted by date, newest first)
   */
  static async getUserNotifications(
    userId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<NotificationData[]> {
    const kv = await getKv();
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const notifications: NotificationData[] = [];

    // List by secondary index (sorted by timestamp)
    const entries = kv.list<null>({
      prefix: ['notifications_by_user', userId],
    }, {
      reverse: true, // Newest first
      limit: limit + offset,
    });

    let count = 0;
    for await (const entry of entries) {
      // Skip offset entries
      if (count < offset) {
        count++;
        continue;
      }

      // Extract notificationId from key
      const notificationId = entry.key[3] as string;

      // Get full notification data
      const notificationEntry = await kv.get<NotificationData>([
        'notifications',
        userId,
        notificationId,
      ]);

      if (notificationEntry.value) {
        notifications.push(notificationEntry.value);
      }

      count++;
      if (notifications.length >= limit) {
        break;
      }
    }

    return notifications;
  }

  /**
   * Get count of unread notifications for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const kv = await getKv();
    let count = 0;

    const entries = kv.list<NotificationData>({
      prefix: ['notifications', userId],
    });

    for await (const entry of entries) {
      if (entry.value && !entry.value.read) {
        count++;
      }
    }

    return count;
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationData | null> {
    const kv = await getKv();

    // Get current notification
    const entry = await kv.get<NotificationData>([
      'notifications',
      userId,
      notificationId,
    ]);

    if (!entry.value) {
      return null;
    }

    // Update with read status
    const updatedNotification: NotificationData = {
      ...entry.value,
      read: true,
      readAt: new Date().toISOString(),
    };

    await kv.set(
      ['notifications', userId, notificationId],
      updatedNotification,
    );

    return updatedNotification;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    const kv = await getKv();
    let count = 0;

    const entries = kv.list<NotificationData>({
      prefix: ['notifications', userId],
    });

    const now = new Date().toISOString();

    for await (const entry of entries) {
      if (entry.value && !entry.value.read) {
        const updatedNotification: NotificationData = {
          ...entry.value,
          read: true,
          readAt: now,
        };

        await kv.set(entry.key, updatedNotification);
        count++;
      }
    }

    return count;
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(
    userId: string,
    notificationId: string,
  ): Promise<boolean> {
    const kv = await getKv();

    // Get notification to find its timestamp for index cleanup
    const entry = await kv.get<NotificationData>([
      'notifications',
      userId,
      notificationId,
    ]);

    if (!entry.value) {
      return false;
    }

    // Atomic transaction: delete notification + index
    const result = await kv.atomic()
      .delete(['notifications', userId, notificationId])
      .delete([
        'notifications_by_user',
        userId,
        entry.value.createdAt,
        notificationId,
      ])
      .commit();

    return result.ok;
  }

  /**
   * Delete all notifications for a user (useful for cleanup/testing)
   */
  static async deleteAllForUser(userId: string): Promise<number> {
    const kv = await getKv();
    let count = 0;

    // Get all notifications
    const entries = kv.list<NotificationData>({
      prefix: ['notifications', userId],
    });

    for await (const entry of entries) {
      if (entry.value) {
        await this.deleteNotification(userId, entry.value.id);
        count++;
      }
    }

    return count;
  }
}
