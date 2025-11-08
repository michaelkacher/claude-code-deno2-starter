/**
 * POST /api/jobs/schedules/:name/trigger
 * Manually trigger a scheduled job
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

const logger = createLogger('TriggerScheduleAPI');

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      const name = ctx.params.name;

      await scheduler.trigger(name);

      return successResponse({ name, message: "Schedule triggered successfully" });
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      logger.error("Trigger schedule error", { error });
      return errorResponse(
        "TRIGGER_FAILED",
        error instanceof Error ? error.message : "Failed to trigger schedule",
        400
      );
    }
  },
};
