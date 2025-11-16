/**
 * POST /api/jobs/schedules/:name/enable
 * Enable a scheduled job
 */

import { Handlers } from "fresh";
import { scheduler } from "../../../../../../shared/lib/scheduler.ts";
import { BadRequestError, NotFoundError } from "../../../../../lib/errors.ts";
import {
    requireAdmin,
    successResponse,
    withErrorHandler,
    type AppState,
} from "../../../../../lib/fresh-helpers.ts";

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

    await scheduler.enable(name);

    return successResponse({ name, enabled: true, message: "Schedule enabled" });
  }),
};
