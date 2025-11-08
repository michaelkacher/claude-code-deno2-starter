import { z } from 'zod';

/**
 * Notification Types
 * Defines types for in-app notifications
 */

// Notification type enum
export const NotificationTypeSchema = z.enum([
  'info',
  'success',
  'warning',
  'error',
]);

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

// Notification data stored in Deno KV
export const NotificationDataSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  read: z.boolean().default(false),
  link: z.string().optional(),
  createdAt: z.string(), // ISO 8601 timestamp
  readAt: z.string().optional(), // ISO 8601 timestamp
});

export type NotificationData = z.infer<typeof NotificationDataSchema>;

// Request to create a notification
export const CreateNotificationRequestSchema = z.object({
  userId: z.string(),
  type: NotificationTypeSchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  link: z.string().url().optional(),
});

export type CreateNotificationRequest = z.infer<typeof CreateNotificationRequestSchema>;

// Response for notification list
export const NotificationListResponseSchema = z.object({
  notifications: z.array(NotificationDataSchema),
  total: z.number(),
  unreadCount: z.number(),
});

export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;

// Response for unread count
export const UnreadCountResponseSchema = z.object({
  unreadCount: z.number(),
});

export type UnreadCountResponse = z.infer<typeof UnreadCountResponseSchema>;
