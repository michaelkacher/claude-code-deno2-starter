/**
 * Test API: Create test notifications
 * POST /api/notifications/test-create
 * 
 * Creates test notifications for the authenticated user
 * This runs in the dev server process so WebSocket broadcasts work properly
 */

import { Handlers } from '$fresh/server.ts';
import { NotificationService } from '../../../../shared/services/notifications.ts';
import {
    errorResponse,
    requireUser,
    successResponse,
    type AppState,
} from '../../../lib/fresh-helpers.ts';

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Require authentication
      const user = requireUser(ctx);
      const userId = user.sub;

      console.log('[Test API] Creating test notifications for user:', userId);

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

      console.log('[Test API] Created', notifications.length, 'test notifications');

      return successResponse({
        message: `Created ${notifications.length} test notifications`,
        notifications: notifications.map(n => ({ id: n.id, title: n.title })),
      });
    } catch (error) {
      if (error.message === 'Authentication required') {
        return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
      }
      console.error('[Test API] Error creating test notifications:', error);
      return errorResponse(
        'SERVER_ERROR',
        'Failed to create test notifications',
        500,
      );
    }
  },
};
