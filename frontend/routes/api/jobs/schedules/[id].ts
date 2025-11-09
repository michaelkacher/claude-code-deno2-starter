/**
 * DELETE /api/jobs/schedules/:id - Delete a scheduled job
 * PATCH /api/jobs/schedules/:id - Update a scheduled job (enable/disable)
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { scheduler } from "../../../../../shared/lib/scheduler.ts";
import { NotFoundError } from "../../../../lib/errors.ts";
import {
    parseJsonBody,
    requireAdmin,
    successResponse,
    withErrorHandler,
    type AppState,
} from "../../../../lib/fresh-helpers.ts";

const UpdateScheduleSchema = z.object({
  enabled: z.boolean(),
});

export const handler: Handlers<unknown, AppState> = {
  DELETE: withErrorHandler(async (_req, ctx) => {
    // Require admin role (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    const scheduleName = ctx.params.id;

    // Check if schedule exists
    const schedule = scheduler.getSchedule(scheduleName);
    if (!schedule) {
      throw new NotFoundError(`Schedule '${scheduleName}' not found`);
    }

    // Remove the schedule with persistence
    await scheduler.unscheduleAndDelete(scheduleName);

    return successResponse({
      message: `Schedule '${scheduleName}' deleted successfully`,
    });
  }),

  PATCH: withErrorHandler(async (req, ctx) => {
    // Require admin role (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    const scheduleName = ctx.params.id;

    // Check if schedule exists
    const schedule = scheduler.getSchedule(scheduleName);
    if (!schedule) {
      throw new NotFoundError(`Schedule '${scheduleName}' not found`);
    }

    // Parse and validate request body (throws ValidationError on invalid data)
    const body = await parseJsonBody(req, UpdateScheduleSchema);

    // Update the schedule's enabled state
    if (body.enabled) {
      scheduler.enable(scheduleName);
    } else {
      scheduler.disable(scheduleName);
    }

    // Get updated schedule
    const updatedSchedule = scheduler.getSchedule(scheduleName);

    return successResponse({
      message: `Schedule '${scheduleName}' updated successfully`,
      schedule: {
        name: updatedSchedule!.name,
        cron: updatedSchedule!.cron,
        enabled: updatedSchedule!.enabled,
        timezone: updatedSchedule!.timezone,
        nextRun: updatedSchedule!.nextRun?.toISOString(),
        lastRun: updatedSchedule!.lastRun?.toISOString(),
        runCount: updatedSchedule!.runCount,
      },
    });
  }),
};
