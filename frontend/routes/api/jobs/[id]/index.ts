/**
 * GET /api/jobs/:id - Get job details by ID
 */

import { Handlers } from "$fresh/server.ts";
import { JobRepository } from "../../../../../shared/repositories/index.ts";
import {
  requireAdmin,
  successResponse,
  withErrorHandler,
  type AppState,
} from "../../../../lib/fresh-helpers.ts";
import { BadRequestError, NotFoundError } from "../../../../lib/errors.ts";

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (_req, ctx) => {
    // Require admin role (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    // Get job ID from route params
    const jobId = ctx.params['id'];
    if (!jobId) {
      throw new BadRequestError("Job ID is required");
    }

    const jobRepo = new JobRepository();
    const job = await jobRepo.findById(jobId);

    if (!job) {
      throw new NotFoundError(undefined, 'Job', jobId);
    }

    return successResponse(job);
  }),
};
