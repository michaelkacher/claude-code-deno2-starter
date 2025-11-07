/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
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
  async GET(req, ctx) {
    try {
      // Require authentication
      const user = requireUser(ctx);

      const notificationRepo = new NotificationRepository();
      const count = await notificationRepo.getUnreadCount(user.sub);

      return successResponse({ count });
    } catch (error) {
      if (error.message === "Authentication required") {
        return errorResponse("UNAUTHORIZED", "Authentication required", 401);
      }
      console.error("Get unread count error:", error);
      return errorResponse(
        "SERVER_ERROR",
        "Failed to get unread count",
        500,
      );
    }
  },
};
