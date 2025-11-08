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
    errorResponse,
    parseJsonBody,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../lib/fresh-helpers.ts";

const logger = createLogger('SchedulesAPI');

const CreateScheduleSchema = z.object({
  name: z.string().min(1).max(100),
  cron: z.string().min(1),
  jobName: z.string().min(1),
  jobData: z.record(z.any()),
  enabled: z.boolean().optional(),
  timezone: z.string().optional(),
});

export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      const schedules = scheduler.getSchedules();
      logger.debug('Listed schedules', { count: schedules.length });

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
      if (error instanceof Error && error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      logger.error("List schedules error", { error });
      return errorResponse("SERVER_ERROR", "Failed to list schedules", 500);
    }
  },

  async POST(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      // Parse and validate request body
      const body = await parseJsonBody(req);
      const validatedBody = CreateScheduleSchema.parse(body);

      // Check if schedule with this name already exists
      const existing = scheduler.getSchedule(validatedBody.name);
      if (existing) {
        return errorResponse(
          "CONFLICT",
          "A schedule with this name already exists",
          409,
        );
      }

      // Create the scheduled job handler
      // This handler will enqueue a job when the schedule triggers
      const handler = async () => {
        logger.info('Schedule triggered', { 
          scheduleName: validatedBody.name, 
          jobName: validatedBody.jobName 
        });
        await queue.add(validatedBody.jobName, validatedBody.jobData);
      };

      // Register the schedule
      scheduler.schedule(
        validatedBody.name,
        validatedBody.cron,
        handler,
        {
          timezone: validatedBody.timezone,
          enabled: validatedBody.enabled,
        },
      );

      const schedule = scheduler.getSchedule(validatedBody.name);

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
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Admin access required") {
          return errorResponse("FORBIDDEN", "Admin access required", 403);
        }
        if (error.name === "ZodError") {
          return errorResponse("VALIDATION_ERROR", "Invalid request body", 400);
        }
      }
      logger.error("Create schedule error", { error });
      return errorResponse("SERVER_ERROR", "Failed to create schedule", 500);
    }
  },
};
