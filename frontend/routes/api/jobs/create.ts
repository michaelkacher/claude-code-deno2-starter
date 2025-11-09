/**
 * POST /api/jobs
 * Create a new background job
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { JobRepository } from "../../../../shared/repositories/index.ts";
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
  POST: withErrorHandler(async (req, ctx) => {
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
