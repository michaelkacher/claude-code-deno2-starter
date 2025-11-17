/**
 * GET /api/jobs - List jobs with optional filters
 * POST /api/jobs - Create a new background job
 */

import { Handlers } from "fresh";
import { z } from "zod";
import { JobStatus } from '@/lib/queue.ts";
import { JobRepository } from '@/repositories/index.ts";
import {
    parseJsonBody,
    requireAdmin,
    successResponse,
    withErrorHandler,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const CreateJobSchema = z.object({
  name: z.string().min(1).max(100),
  data: z.record(z.any()),
  options: z
    .object({
      priority: z.number().min(1).max(10).optional(),
      delay: z.number().min(0).optional(),
      maxRetries: z.number().min(0).optional(),
    })
    .optional(),
});

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (ctx) => {
    const req = ctx.req;
    // Require admin role (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const cursor = url.searchParams.get("cursor") || undefined;

    const jobRepo = new JobRepository();
    const result = await jobRepo.listJobs({
      status: status as JobStatus | undefined,
      limit,
      cursor,
    });

    return successResponse({
      jobs: result.items,
      cursor: result.cursor,
      hasMore: result.hasMore,
    });
  }),

  POST: withErrorHandler(async (ctx) => {
    const req = ctx.req;
    // Require admin role (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    // Parse and validate request body (throws ValidationError on invalid data)
    const body = await parseJsonBody(req, CreateJobSchema);

    const jobRepo = new JobRepository();

    // Create job
    const job = await jobRepo.create(body.name, body.data, body.options);

    return successResponse(job, 201);
  }),
};

