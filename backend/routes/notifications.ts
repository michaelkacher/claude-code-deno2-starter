import { Hono } from 'hono';
import { upgradeWebSocket } from 'hono/deno';
import { setupWebSocketConnection } from '../lib/notification-websocket.ts';
import { authenticate } from '../middleware/auth.ts';
import { NotificationService } from '../services/notifications.ts';
import {
    CreateNotificationRequestSchema,
    NotificationListResponseSchema,
    UnreadCountResponseSchema,
} from '../types/notifications.ts';

/**
 * Notification Routes
 * REST API endpoints for managing user notifications
 */
const app = new Hono();

/**
 * GET /api/notifications/ws
 * WebSocket endpoint for real-time notification updates
 * NOTE: This MUST come before other routes and BEFORE auth middleware
 * WebSocket handles its own authentication after connection
 */
app.get('/ws', upgradeWebSocket(() => {
  // Return WebSocket event handlers
  // Authentication happens in onOpen
  return setupWebSocketConnection();
}));

// Apply authentication middleware to REST API routes (not WebSocket)
app.use('*', authenticate);

/**
 * GET /api/notifications
 * Get all notifications for the authenticated user
 */
app.get('/', async (c) => {
  try {
    // Get user ID from JWT (set by auth middleware)
    const user = c.get('user');
    const userId = user?.sub;

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get query params for pagination
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    // Get notifications
    const notifications = await NotificationService.getUserNotifications(
      userId,
      { limit, offset },
    );

    // Get unread count
    const unreadCount = await NotificationService.getUnreadCount(userId);

    // Validate response
    const response = NotificationListResponseSchema.parse({
      notifications,
      total: notifications.length,
      unreadCount,
    });

    return c.json(response);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications for the authenticated user
 */
app.get('/unread-count', async (c) => {
  try {
    // Get user ID from JWT
    const user = c.get('user');
    const userId = user?.sub;

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get unread count
    const unreadCount = await NotificationService.getUnreadCount(userId);

    // Validate response
    const response = UnreadCountResponseSchema.parse({ unreadCount });

    return c.json(response);
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return c.json({ error: 'Failed to fetch unread count' }, 500);
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
app.patch('/:id/read', async (c) => {
  try {
    // Get user ID from JWT
    const user = c.get('user');
    const userId = user?.sub;

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');

    // Mark as read
    const notification = await NotificationService.markAsRead(
      userId,
      notificationId,
    );

    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    return c.json({ notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return c.json({ error: 'Failed to mark notification as read' }, 500);
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the authenticated user
 */
app.post('/read-all', async (c) => {
  try {
    // Get user ID from JWT
    const user = c.get('user');
    const userId = user?.sub;

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Mark all as read
    const count = await NotificationService.markAllAsRead(userId);

    return c.json({ count, message: `Marked ${count} notifications as read` });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return c.json(
      { error: 'Failed to mark all notifications as read' },
      500,
    );
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
app.delete('/:id', async (c) => {
  try {
    // Get user ID from JWT
    const user = c.get('user');
    const userId = user?.sub;

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');

    // Delete notification
    const success = await NotificationService.deleteNotification(
      userId,
      notificationId,
    );

    if (!success) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    return c.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return c.json({ error: 'Failed to delete notification' }, 500);
  }
});

/**
 * POST /api/notifications (Admin or system use)
 * Create a notification for a user
 * Note: This should be protected or used internally
 */
app.post('/', async (c) => {
  try {
    // Parse request body
    const body = await c.req.json();

    // Validate request
    const validatedData = CreateNotificationRequestSchema.parse(body);

    // Create notification
    const notification = await NotificationService.create(validatedData);

    return c.json({ notification }, 201);
  } catch (error) {
    console.error('Error creating notification:', error);
    if (error.name === 'ZodError') {
      return c.json({ error: 'Invalid request data', details: error.errors }, 400);
    }
    return c.json({ error: 'Failed to create notification' }, 500);
  }
});

export default app;
