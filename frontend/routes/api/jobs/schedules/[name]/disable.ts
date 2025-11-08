/**
 * POST /api/jobs/schedules/:name/disable
 * Disable a scheduled job
 */

import { Handlers } from "$fresh/server.ts";
import { createLogger } from '../../../../../../shared/lib/logger.ts';
import { scheduler } from "../../../../../../shared/lib/scheduler.ts";
import {
    errorResponse,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../../lib/fresh-helpers.ts";

const logger = createLogger('DisableScheduleAPI');

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      const name = ctx.params.name;

      scheduler.disable(name);

      return successResponse({ name, enabled: false, message: "Schedule disabled" });
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      logger.error("Disable schedule error", { error });
      return errorResponse("SERVER_ERROR", "Failed to disable schedule", 500);
    }
  },
};
