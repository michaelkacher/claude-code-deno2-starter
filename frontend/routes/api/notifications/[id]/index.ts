/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */

import { Handlers } from "$fresh/server.ts";
import { NotificationRepository } from "../../../../../shared/repositories/index.ts";
import {
  requireUser,
  successResponse,
  withErrorHandler,
  type AppState,
} from "../../../../lib/fresh-helpers.ts";
import { BadRequestError, NotFoundError, AuthorizationError } from "../../../../lib/errors.ts";

export const handler: Handlers<unknown, AppState> = {
  DELETE: withErrorHandler(async (_req, ctx) => {
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

    if (notification.userId !== user.sub) {
      throw new AuthorizationError("Cannot delete another user's notification");
    }

    // Delete notification
    await notificationRepo.deleteNotification(user.sub, notificationId);

    return successResponse({ message: "Notification deleted" });
  }),
};
