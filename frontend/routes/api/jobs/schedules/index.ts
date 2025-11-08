/**
 * GET /api/jobs/schedules
 * List all scheduled jobs
 */

import { Handlers } from "$fresh/server.ts";
import { scheduler } from "../../../../../shared/lib/scheduler.ts";
import {
    errorResponse,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      const schedules = scheduler.getSchedules();
      console.log('[Schedules API] Found schedules:', schedules.length);

      return successResponse({
        schedules: schedules.map((s) => ({
          name: s.name,
          cron: s.cron,
          enabled: s.enabled,
          timezone: s.timezone,
          nextRun: s.nextRun?.toISOString(),
          lastRun: s.lastRun?.toISOString(),
          runCount: s.runCount,
        })),
      });
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("List schedules error:", error);
      return errorResponse("SERVER_ERROR", "Failed to list schedules", 500);
    }
  },
};
