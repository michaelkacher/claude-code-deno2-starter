import { NotificationData, NotificationType } from '../types/notifications.ts';
import { BaseRepository, ListOptions, ListResult, RepositoryOptions } from './base-repository.ts';

/**
 * Notification Query Options
 */
export interface NotificationQueryOptions extends ListOptions {
  /**
   * Filter by read status
   */
  read?: boolean;
  
  /**
   * Filter by notification type
   */
  type?: NotificationType;
  
  /**
   * Sort by creation date
   */
  sortByDate?: 'asc' | 'desc';
}

/**
 * Notification Repository
 * 
 * Manages user notifications:
 * - CRUD operations
 * - Read/unread tracking
 * - Type-based filtering
 * - Pagination support
 */
export class NotificationRepository extends BaseRepository<NotificationData> {
  constructor(options: RepositoryOptions = {}) {
    super('Notification', options);
  }

  /**
   * Create a new notification
   */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string
  ): Promise<NotificationData> {
    try {
      const notificationId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      const notification: NotificationData = {
        id: notificationId,
        userId,
        type,
        title,
        message,
        read: false,
        link,
        createdAt: now,
      };

      await this.set(['notifications', userId, notificationId], notification);
      
      this.logger.info('Notification created', { userId, notificationId, type });
      return notification;
    } catch (error) {
      this.logger.error('Error creating notification', { userId, error });
      throw error;
    }
  }

  /**
   * Get notification by ID
   */
  async findById(userId: string, notificationId: string): Promise<NotificationData | null> {
    return await this.get(['notifications', userId, notificationId]);
  }

  /**
   * List notifications for a user
   */
  async listUserNotifications(
    userId: string,
    options: NotificationQueryOptions = {}
  ): Promise<ListResult<NotificationData>> {
    try {
      const kv = await this.getKv();
      let notifications: NotificationData[] = [];
      
      const entries = kv.list<NotificationData>({ prefix: ['notifications', userId] });
      for await (const entry of entries) {
        if (entry.value) {
          notifications.push(entry.value);
        }
      }

      // Apply filters
      if (options.read !== undefined) {
        notifications = notifications.filter(n => n.read === options.read);
      }

      if (options.type) {
        notifications = notifications.filter(n => n.type === options.type);
      }

      // Sort by date
      const sortOrder = options.sortByDate || 'desc';
      notifications.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });

      // Apply pagination
      const limit = options.limit || notifications.length;
      const items = notifications.slice(0, limit);

      return {
        items,
        cursor: null,
        hasMore: notifications.length > limit,
      };
    } catch (error) {
      this.logger.error('Error listing user notifications', { userId, error });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<NotificationData | null> {
    try {
      const notification = await this.findById(userId, notificationId);
      
      if (!notification) {
        this.logger.warn('Cannot mark non-existent notification as read', { userId, notificationId });
        return null;
      }

      const updatedNotification: NotificationData = {
        ...notification,
        read: true,
        readAt: new Date().toISOString(),
      };

      await this.set(['notifications', userId, notificationId], updatedNotification);
      
      this.logger.info('Notification marked as read', { userId, notificationId });
      return updatedNotification;
    } catch (error) {
      this.logger.error('Error marking notification as read', { userId, notificationId, error });
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const kv = await this.getKv();
      const notifications = await this.listUserNotifications(userId, { read: false });
      
      let count = 0;
      const now = new Date().toISOString();
      
      for (const notification of notifications.items) {
        const updatedNotification: NotificationData = {
          ...notification,
          read: true,
          readAt: now,
        };
        
        await kv.set(['notifications', userId, notification.id], updatedNotification);
        count++;
      }
      
      this.logger.info('All notifications marked as read', { userId, count });
      return count;
    } catch (error) {
      this.logger.error('Error marking all notifications as read', { userId, error });
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    try {
      const exists = await this.exists(['notifications', userId, notificationId]);
      
      if (!exists) {
        this.logger.warn('Cannot delete non-existent notification', { userId, notificationId });
        return false;
      }

      await this.delete(['notifications', userId, notificationId]);
      
      this.logger.info('Notification deleted', { userId, notificationId });
      return true;
    } catch (error) {
      this.logger.error('Error deleting notification', { userId, notificationId, error });
      throw error;
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllUserNotifications(userId: string): Promise<number> {
    try {
      const kv = await this.getKv();
      let count = 0;
      
      const entries = kv.list({ prefix: ['notifications', userId] });
      for await (const entry of entries) {
        await kv.delete(entry.key);
        count++;
      }
      
      this.logger.info('All user notifications deleted', { userId, count });
      return count;
    } catch (error) {
      this.logger.error('Error deleting all user notifications', { userId, error });
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const notifications = await this.listUserNotifications(userId, { read: false });
      return notifications.items.length;
    } catch (error) {
      this.logger.error('Error getting unread count', { userId, error });
      throw error;
    }
  }

  /**
   * Get notification counts by type
   */
  async getCountsByType(userId: string): Promise<Record<NotificationType, number>> {
    try {
      const notifications = await this.listUserNotifications(userId);
      
      const counts: Record<NotificationType, number> = {
        info: 0,
        success: 0,
        warning: 0,
        error: 0,
      };

      for (const notification of notifications.items) {
        counts[notification.type]++;
      }

      return counts;
    } catch (error) {
      this.logger.error('Error getting notification counts by type', { userId, error });
      throw error;
    }
  }

  /**
   * Delete old read notifications (cleanup)
   */
  async deleteOldReadNotifications(olderThanDays: number = 30): Promise<number> {
    try {
      const kv = await this.getKv();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      let count = 0;
      
      const entries = kv.list<NotificationData>({ prefix: ['notifications'] });
      for await (const entry of entries) {
        if (entry.value && entry.value.read && entry.value.readAt) {
          const readDate = new Date(entry.value.readAt);
          if (readDate < cutoffDate) {
            await kv.delete(entry.key);
            count++;
          }
        }
      }
      
      this.logger.info('Old read notifications deleted', { count, olderThanDays });
      return count;
    } catch (error) {
      this.logger.error('Error deleting old read notifications', { olderThanDays, error });
      throw error;
    }
  }
}
