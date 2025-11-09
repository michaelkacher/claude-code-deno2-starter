/**
 * DELETE /api/jobs/:id
 * Delete a job (only if completed or failed)
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
  DELETE: withErrorHandler(async (_req, ctx) => {
    // Require admin role (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    // Get job ID from route params
    const jobId = ctx.params['id'];
    if (!jobId) {
      throw new BadRequestError("Job ID is required");
    }

    const jobRepo = new JobRepository();

    // Get job to verify it exists
    const job = await jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError(undefined, 'Job', jobId);
    }

    // Only allow deletion of completed or failed jobs
    if (job.status === "pending" || job.status === "running") {
      throw new BadRequestError("Cannot delete pending or running jobs");
    }

    // Delete job using the queue system
    const queue = await import("../../../../../shared/lib/queue.ts");
    await queue.queue.delete(jobId);

    return successResponse({ message: "Job deleted" });
  }),
};
