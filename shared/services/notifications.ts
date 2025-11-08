import { NotificationRepository } from '../repositories/index.ts';
import type {
  CreateNotificationRequest,
  NotificationData,
} from '../types/notifications.ts';

/**
 * NotificationService
 * Thin wrapper around NotificationRepository for backward compatibility
 * 
 * Key Structure:
 * - ['notifications', userId, notificationId] -> NotificationData
 * - ['notifications_by_user', userId, timestamp, notificationId] -> null (for listing by date)
 */
export class NotificationService {
  private static repo = new NotificationRepository();
  /**
   * Create a new notification for a user
   */
  static async create(
    data: CreateNotificationRequest,
  ): Promise<NotificationData> {
    const notification = await this.repo.create(
      data.userId,
      data.type,
      data.title,
      data.message,
      data.link,
    );

    // Broadcast to WebSocket clients
    try {
      const { notifyUser } = await import('../lib/notification-websocket.ts');
      notifyUser(data.userId, notification);
    } catch (wsError) {
      // WebSocket broadcast is not critical, just log if it fails
      console.debug('WebSocket broadcast failed (non-critical):', wsError);
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
    const result = await this.repo.listUserNotifications(userId, {
      limit: options.limit || 50,
      cursor: options.offset ? String(options.offset) : undefined,
    });
    return result.items;
  }

  /**
   * Get count of unread notifications for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return await this.repo.getUnreadCount(userId);
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationData | null> {
    const notification = await this.repo.markAsRead(userId, notificationId);

    // Broadcast update to WebSocket clients
    if (notification) {
      try {
        const { sendToUser } = await import('../lib/notification-websocket.ts');
        sendToUser(userId, {
          type: 'notification_update',
          notification,
        });
      } catch (wsError) {
        console.debug('WebSocket broadcast failed (non-critical):', wsError);
      }
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    const count = await this.repo.markAllAsRead(userId);

    // Broadcast update to WebSocket clients
    if (count > 0) {
      try {
        const { sendToUser } = await import('../lib/notification-websocket.ts');
        sendToUser(userId, {
          type: 'notifications_cleared',
          count,
        });
      } catch (wsError) {
        console.debug('WebSocket broadcast failed (non-critical):', wsError);
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
    const deleted = await this.repo.deleteNotification(userId, notificationId);

    // Broadcast update to WebSocket clients
    if (deleted) {
      try {
        const { sendToUser } = await import('../lib/notification-websocket.ts');
        sendToUser(userId, {
          type: 'notification_deleted',
          notificationId,
        });
      } catch (wsError) {
        console.debug('WebSocket broadcast failed (non-critical):', wsError);
      }
    }

    return deleted;
  }

  /**
   * Delete all notifications for a user (useful for cleanup/testing)
   */
  static async deleteAllForUser(userId: string): Promise<number> {
    let count = 0;
    const result = await this.repo.listUserNotifications(userId, { limit: 1000 });
    
    for (const notification of result.items) {
      const deleted = await this.deleteNotification(userId, notification.id);
      if (deleted) count++;
    }

    return count;
  }
}
