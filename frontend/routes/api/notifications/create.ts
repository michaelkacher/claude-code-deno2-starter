/**
 * POST /api/notifications
 * Create a notification (admin only)
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { notifyUser } from "../../../../shared/lib/notification-websocket.ts";
import { NotificationRepository } from "../../../../shared/repositories/index.ts";
import {
    errorResponse,
    parseJsonBody,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const CreateNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["info", "success", "warning", "error"]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
});

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      // Parse and validate request body
      const body = await parseJsonBody(req, CreateNotificationSchema);

      const notificationRepo = new NotificationRepository();

      // Create notification
      const notification = await notificationRepo.create(
        body.userId,
        body.type,
        body.title,
        body.message,
      );

      // Broadcast via WebSocket
      notifyUser(body.userId, notification);

      return successResponse(notification, 201);
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      if (error.name === "ZodError") {
        return errorResponse("VALIDATION_ERROR", "Invalid request body", 400);
      }
      console.error("Create notification error:", error);
      return errorResponse(
        "SERVER_ERROR",
        "Failed to create notification",
        500,
      );
    }
  },
};
