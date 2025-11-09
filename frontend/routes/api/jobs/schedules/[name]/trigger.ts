/**
 * POST /api/jobs/schedules/:name/trigger
 * Manually trigger a scheduled job
 */

import { Handlers } from "$fresh/server.ts";
import { scheduler } from "../../../../../../shared/lib/scheduler.ts";
import {
  requireAdmin,
  successResponse,
  withErrorHandler,
  type AppState,
} from "../../../../../lib/fresh-helpers.ts";
import { BadRequestError, NotFoundError } from "../../../../../lib/errors.ts";

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (_req, ctx) => {
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

    await scheduler.trigger(name);

    return successResponse({ name, message: "Schedule triggered successfully" });
  }),
};
