/**
 * GET /api/jobs/:id - Get job details by ID
 * DELETE /api/jobs/:id - Delete a job (only if completed or failed)
 */

import { Handlers } from "$fresh/server.ts";
import { JobRepository } from "../../../../../shared/repositories/index.ts";
import {
  errorResponse,
  requireAdmin,
  successResponse,
  type AppState,
} from "../../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async GET(_req, ctx) {
    try {
      requireAdmin(ctx);

      const jobId = ctx.params.id;
      const jobRepo = new JobRepository();
      const job = await jobRepo.findById(jobId);

      if (!job) {
        return errorResponse("NOT_FOUND", "Job not found", 404);
      }

      return successResponse(job);
    } catch (error) {
      if (error instanceof Error && error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("Get job error:", error);
      return errorResponse("SERVER_ERROR", "Failed to get job", 500);
    }
  },

  async DELETE(_req, ctx) {
    try {
      requireAdmin(ctx);

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

      // Delete job
      await jobRepo.deleteJob(jobId);

      return successResponse({ message: "Job deleted" });
    } catch (error) {
      if (error instanceof Error && error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("Delete job error:", error);
      return errorResponse("SERVER_ERROR", "Failed to delete job", 500);
    }
  },
};
