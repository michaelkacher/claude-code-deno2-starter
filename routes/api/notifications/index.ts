/**
 * GET /api/notifications
 * List user notifications with pagination
 */

import { requireUser, successResponse, withErrorHandler, type AppState } from '@/lib/fresh-helpers.ts';
import { NotificationRepository } from '@/repositories/index.ts';
import { Handlers } from "fresh";

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (ctx) => {
    const req = ctx.req;
    // Require authentication
    const user = requireUser(ctx);

    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const cursor = url.searchParams.get("cursor") || undefined;

    const notificationRepo = new NotificationRepository();
    const result = await notificationRepo.listUserNotifications(user.sub, { limit, cursor });
    const unreadCount = await notificationRepo.getUnreadCount(user.sub);

    return successResponse({
      notifications: result.items,
      unreadCount,
      cursor: result.cursor,
      hasMore: result.hasMore,
    });
  }),
};

