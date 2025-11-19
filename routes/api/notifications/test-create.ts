/**
 * Test API: Create test notifications
 * POST /api/notifications/test-create
 *
 * Creates test notifications for the authenticated user
 * This runs in the dev server process so WebSocket broadcasts work properly
 */

import {
  requireUser,
  successResponse,
  withErrorHandler,
  type AppState,
} from '@/lib/fresh-helpers.ts';
import { createLogger } from '@/lib/logger.ts';
import { NotificationService } from '@/services/notifications.ts';
import { Handlers } from 'fresh';

const logger = createLogger('NotificationsTestAPI');

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    // Require authentication
    const user = requireUser(ctx);
    const userId = user.sub;

    logger.debug('Creating test notifications for user', { userId });

    // Create test notifications
    const notifications = [];

    notifications.push(
      await NotificationService.create({
        userId,
        type: 'success',
        title: 'Test Notification #1',
        message: 'This is a success notification. The system is working!',
      })
    );

    notifications.push(
      await NotificationService.create({
        userId,
        type: 'info',
        title: 'Test Notification #2',
        message: 'This is an info notification with a link.',
        link: '/notifications',
      })
    );

    notifications.push(
      await NotificationService.create({
        userId,
        type: 'warning',
        title: 'Test Notification #3',
        message: 'This is a warning notification.',
      })
    );

    notifications.push(
      await NotificationService.create({
        userId,
        type: 'error',
        title: 'Test Notification #4',
        message: 'This is an error notification.',
      })
    );

    notifications.push(
      await NotificationService.create({
        userId,
        type: 'info',
        title: 'Test Complete',
        message: 'All test notifications have been created successfully!',
      })
    );

    logger.info('Test notifications created', { count: notifications.length, userId });

    return successResponse({
      message: `Created ${notifications.length} test notifications`,
      notifications: notifications.map(n => ({ id: n.id, title: n.title })),
    });
  }),
};

