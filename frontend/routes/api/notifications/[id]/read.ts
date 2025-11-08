/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */

import { Handlers } from "$fresh/server.ts";
import { NotificationRepository } from "../../../../../shared/repositories/index.ts";
import {
    errorResponse,
    requireUser,
    successResponse,
    type AppState,
} from "../../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async PATCH(req, ctx) {
    try {
      // Require authentication
      const user = requireUser(ctx);

      // Get notification ID from route params
      const notificationId = ctx.params.id;

      const notificationRepo = new NotificationRepository();

      // Get notification to verify ownership
      const notification = await notificationRepo.getById(notificationId);
      if (!notification) {
        return errorResponse("NOT_FOUND", "Notification not found", 404);
      }

      if (notification.userId !== user.sub) {
        return errorResponse(
          "FORBIDDEN",
          "Cannot mark another user's notification",
          403,
        );
      }

      // Mark as read
      await notificationRepo.markAsRead(notificationId);

      return successResponse({ message: "Notification marked as read" });
    } catch (error) {
      if (error.message === "Authentication required") {
        return errorResponse("UNAUTHORIZED", "Authentication required", 401);
      }
      console.error("Mark as read error:", error);
      return errorResponse(
        "SERVER_ERROR",
        "Failed to mark notification as read",
        500,
      );
    }
  },
};
