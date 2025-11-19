/**
 * POST /api/jobs/schedules/:name/disable
 * Disable a scheduled job
 */

import { BadRequestError, NotFoundError } from "@/lib/errors.ts";
import {
  requireAdmin,
  successResponse,
  withErrorHandler,
  type AppState,
} from "@/lib/fresh-helpers.ts";
import { scheduler } from "@/lib/scheduler.ts";
import { Handlers } from "fresh";

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    // Require admin role (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    // Get schedule name from route params
    const name = ctx.params['name'];
    if (!name) {
      throw new BadRequestError("Schedule name is required");
    }

    // Verify schedule exists
    const schedule = scheduler.getSchedule(name);
    if (!schedule) {
      throw new NotFoundError(undefined, 'Schedule', name);
    }

    await scheduler.disable(name);

    return successResponse({ name, enabled: false, message: "Schedule disabled" });
  }),
};
