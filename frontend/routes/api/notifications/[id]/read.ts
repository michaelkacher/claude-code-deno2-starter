/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */

import { Handlers } from "$fresh/server.ts";
import { NotificationRepository } from "../../../../../shared/repositories/index.ts";
import {
  requireUser,
  successResponse,
  withErrorHandler,
  type AppState,
} from "../../../../lib/fresh-helpers.ts";
import { BadRequestError, NotFoundError } from "../../../../lib/errors.ts";

export const handler: Handlers<unknown, AppState> = {
  PATCH: withErrorHandler(async (_req, ctx) => {
    // Require authentication
    const user = requireUser(ctx);

    // Get notification ID from route params
    const notificationId = ctx.params.id;
    if (!notificationId) {
      throw new BadRequestError("Notification ID is required");
    }

    const notificationRepo = new NotificationRepository();

    // Get notification to verify ownership
    const notification = await notificationRepo.findById(user.sub, notificationId);
    if (!notification) {
      throw new NotFoundError("Notification not found", "notification", notificationId);
    }

    // Mark as read (userId is already verified by findById)
    await notificationRepo.markAsRead(user.sub, notificationId);

    return successResponse({ message: "Notification marked as read" });
  }),
};
