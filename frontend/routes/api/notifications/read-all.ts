/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the current user
 */

import { Handlers } from "fresh";
import { NotificationRepository } from "../../../../shared/repositories/index.ts";
import {
    requireUser,
    successResponse,
    withErrorHandler,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    // Require authentication
    const user = requireUser(ctx);

    const notificationRepo = new NotificationRepository();
    await notificationRepo.markAllAsRead(user.sub);

    return successResponse({ message: "All notifications marked as read" });
  }),
};
