/**
 * GET /api/notifications
 * List user notifications with pagination
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

      // Parse query parameters
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const cursor = url.searchParams.get("cursor") || undefined;

      const notificationRepo = new NotificationRepository();
      const result = await notificationRepo.list(user.sub, { limit, cursor });

      return successResponse({
        notifications: result.notifications,
        cursor: result.cursor,
        hasMore: result.hasMore,
      });
    } catch (error) {
      if (error.message === "Authentication required") {
        return errorResponse("UNAUTHORIZED", "Authentication required", 401);
      }
      console.error("List notifications error:", error);
      return errorResponse(
        "SERVER_ERROR",
        "Failed to list notifications",
        500,
      );
    }
  },
};
