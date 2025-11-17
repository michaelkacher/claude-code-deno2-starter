/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */

import { Handlers } from 'fresh';
import { NotificationRepository } from '@/repositories/index.ts";
import {
    requireUser,
    successResponse,
    withErrorHandler,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (ctx) => {
    // Require authentication
    const user = requireUser(ctx);

    const notificationRepo = new NotificationRepository();
    const count = await notificationRepo.getUnreadCount(user.sub);

    return successResponse({ count });
  }),
};

