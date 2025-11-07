/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the current user
 */

import { Handlers } from "$fresh/server.ts";
import { NotificationRepository } from "../../../../backend/repositories/index.ts";
import {
    errorResponse,
    requireUser,
    successResponse,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Require authentication
      const user = requireUser(ctx);

      const notificationRepo = new NotificationRepository();
      await notificationRepo.markAllAsRead(user.sub);

      return successResponse({ message: "All notifications marked as read" });
    } catch (error) {
      if (error.message === "Authentication required") {
        return errorResponse("UNAUTHORIZED", "Authentication required", 401);
      }
      console.error("Mark all as read error:", error);
      return errorResponse(
        "SERVER_ERROR",
        "Failed to mark all notifications as read",
        500,
      );
    }
  },
};
