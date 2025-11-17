/**
 * POST /api/notifications
 * Create a notification (admin only)
 */

import { Handlers } from "fresh";
import { z } from "zod";
import { notifyUser } from '@/lib/notification-websocket.ts";
import { NotificationRepository } from '@/repositories/index.ts";
import {
    parseJsonBody,
    requireAdmin,
    successResponse,
    withErrorHandler,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const CreateNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["info", "success", "warning", "error"]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
});

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    const req = ctx.req;
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
  }),
};

