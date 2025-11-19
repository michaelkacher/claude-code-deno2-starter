/**
 * POST /api/jobs/:id/retry
 * Retry a failed job
 */

import { BadRequestError, NotFoundError } from "@/lib/errors.ts";
import {
  requireAdmin,
  successResponse,
  withErrorHandler,
  type AppState,
} from "@/lib/fresh-helpers.ts";
import { JobRepository } from "@/repositories/index.ts";
import { Handlers } from "fresh";

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
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
    const queue = await import("@/lib/queue.ts");
    await queue.queue.retry(jobId);

    return successResponse({ message: "Job queued for retry" });
  }),
};
