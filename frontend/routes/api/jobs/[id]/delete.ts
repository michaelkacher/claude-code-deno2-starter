/**
 * DELETE /api/jobs/:id
 * Delete a job (only if completed or failed)
 */

import { Handlers } from "$fresh/server.ts";
import { JobRepository } from "../../../../../backend/repositories/index.ts";
import {
    errorResponse,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async DELETE(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      // Get job ID from route params
      const jobId = ctx.params.id;

      const jobRepo = new JobRepository();

      // Get job to verify it exists
      const job = await jobRepo.getById(jobId);
      if (!job) {
        return errorResponse("NOT_FOUND", "Job not found", 404);
      }

      // Only allow deletion of completed or failed jobs
      if (job.status === "pending" || job.status === "processing") {
        return errorResponse(
          "BAD_REQUEST",
          "Cannot delete pending or processing jobs",
          400,
        );
      }

      // Delete job
      await jobRepo.delete(jobId);

      return successResponse({ message: "Job deleted" });
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("Delete job error:", error);
      return errorResponse("SERVER_ERROR", "Failed to delete job", 500);
    }
  },
};
