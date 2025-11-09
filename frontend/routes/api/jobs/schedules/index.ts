/**
 * GET /api/jobs/schedules - List all scheduled jobs
 * POST /api/jobs/schedules - Create a new scheduled job
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { createLogger } from '../../../../../shared/lib/logger.ts';
import { queue } from "../../../../../shared/lib/queue.ts";
import { scheduler } from "../../../../../shared/lib/scheduler.ts";
import {
  parseJsonBody,
  requireAdmin,
  successResponse,
  withErrorHandler,
  type AppState,
} from "../../../../lib/fresh-helpers.ts";
import { ConflictError } from "../../../../lib/errors.ts";

const CreateScheduleSchema = z.object({
  name: z.string().min(1).max(100),
  cron: z.string().min(1),
  jobName: z.string().min(1),
  jobData: z.record(z.any()),
  enabled: z.boolean().optional(),
  timezone: z.string().optional(),
});

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler((_req, ctx) => {
    // Require admin role (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    const schedules = scheduler.getSchedules();

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
  }),

  POST: withErrorHandler(async (req, ctx) => {
    // Require admin role (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    // Parse and validate request body (throws ValidationError on invalid data)
    const body = await parseJsonBody(req, CreateScheduleSchema);

    // Check if schedule with this name already exists
    const existing = scheduler.getSchedule(body.name);
    if (existing) {
      throw new ConflictError("A schedule with this name already exists");
    }

    // Create the scheduled job handler
    // This handler will enqueue a job when the schedule triggers
    const logger = createLogger('SchedulesAPI');
    const handler = async () => {
      logger.info('Schedule triggered', {
        scheduleName: body.name,
        jobName: body.jobName
      });
      await queue.add(body.jobName, body.jobData);
    };

    // Register the schedule
    scheduler.schedule(
      body.name,
      body.cron,
      handler,
      {
        timezone: body.timezone,
        enabled: body.enabled,
      },
    );

    const schedule = scheduler.getSchedule(body.name);

    return successResponse({
      message: "Schedule created successfully",
      schedule: {
        name: schedule!.name,
        cron: schedule!.cron,
        enabled: schedule!.enabled,
        timezone: schedule!.timezone,
        nextRun: schedule!.nextRun?.toISOString(),
        runCount: schedule!.runCount,
      },
    }, 201);
  }),
};
