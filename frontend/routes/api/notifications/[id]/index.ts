/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */

import { Handlers } from "$fresh/server.ts";
import { NotificationRepository } from "../../../../../backend/repositories/index.ts";
import {
    errorResponse,
    requireUser,
    successResponse,
    type AppState,
} from "../../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async DELETE(req, ctx) {
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
          "Cannot delete another user's notification",
          403,
        );
      }

      // Delete notification
      await notificationRepo.delete(notificationId);

      return successResponse({ message: "Notification deleted" });
    } catch (error) {
      if (error.message === "Authentication required") {
        return errorResponse("UNAUTHORIZED", "Authentication required", 401);
      }
      console.error("Delete notification error:", error);
      return errorResponse(
        "SERVER_ERROR",
        "Failed to delete notification",
        500,
      );
    }
  },
};
