/**
 * POST /api/jobs/:id/retry
 * Retry a failed job
 */

import { Handlers } from "$fresh/server.ts";
import { JobRepository } from "../../../../../shared/repositories/index.ts";
import {
  requireAdmin,
  successResponse,
  withErrorHandler,
  type AppState,
} from "../../../../lib/fresh-helpers.ts";
import { NotFoundError, BadRequestError } from "../../../../lib/errors.ts";

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (_req, ctx) => {
    // Require admin role (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    // Get job ID from route params
    const jobId = ctx.params['id'];
    if (!jobId) {
      throw new BadRequestError("Job ID is required");
    }

    const jobRepo = new JobRepository();

    // Get job to verify it exists and is failed
    const job = await jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError(undefined, 'Job', jobId);
    }

    if (job.status !== "failed") {
      throw new BadRequestError("Only failed jobs can be retried");
    }

    // Retry job using the queue system
    const queue = await import("../../../../../shared/lib/queue.ts");
    await queue.queue.retry(jobId);

    return successResponse({ message: "Job queued for retry" });
  }),
};
