/**
 * POST /api/jobs/schedules/:name/enable
 * Enable a scheduled job
 */

import { Handlers } from "$fresh/server.ts";
import { scheduler } from "../../../../../../backend/lib/scheduler.ts";
import {
    errorResponse,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      const name = ctx.params.name;

      scheduler.enable(name);

      return successResponse({ name, enabled: true, message: "Schedule enabled" });
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("Enable schedule error:", error);
      return errorResponse("SERVER_ERROR", "Failed to enable schedule", 500);
    }
  },
};
