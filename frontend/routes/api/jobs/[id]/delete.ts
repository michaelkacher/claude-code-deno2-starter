/**
 * DELETE /api/jobs/:id
 * Delete a job (only if completed or failed)
 */

import { Handlers } from "$fresh/server.ts";
import { createLogger } from "../../../../../shared/lib/logger.ts";
import { JobRepository } from "../../../../../shared/repositories/index.ts";
import {
    errorResponse,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../lib/fresh-helpers.ts";

const logger = createLogger('DeleteJobAPI');

export const handler: Handlers<unknown, AppState> = {
  async DELETE(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      // Get job ID from route params
      const jobId = ctx.params.id;

      const jobRepo = new JobRepository();

      // Get job to verify it exists
      const job = await jobRepo.findById(jobId);
      if (!job) {
        return errorResponse("NOT_FOUND", "Job not found", 404);
      }

      // Only allow deletion of completed or failed jobs
      if (job.status === "pending" || job.status === "running") {
        return errorResponse(
          "BAD_REQUEST",
          "Cannot delete pending or running jobs",
          400,
        );
      }

      // Delete job using the queue system
      const queue = await import("../../../../../shared/lib/queue.ts");
      await queue.queue.delete(jobId);

      return successResponse({ message: "Job deleted" });
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      logger.error("Delete job error", { error });
      return errorResponse("SERVER_ERROR", "Failed to delete job", 500);
    }
  },
};
