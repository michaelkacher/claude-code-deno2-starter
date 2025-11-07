/**
 * POST /api/jobs/:id/retry
 * Retry a failed job
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
  async POST(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      // Get job ID from route params
      const jobId = ctx.params.id;

      const jobRepo = new JobRepository();

      // Get job to verify it exists and is failed
      const job = await jobRepo.getById(jobId);
      if (!job) {
        return errorResponse("NOT_FOUND", "Job not found", 404);
      }

      if (job.status !== "failed") {
        return errorResponse(
          "BAD_REQUEST",
          "Only failed jobs can be retried",
          400,
        );
      }

      // Retry job (resets to pending with incremented attempts)
      await jobRepo.retry(jobId);

      return successResponse({ message: "Job queued for retry" });
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("Retry job error:", error);
      return errorResponse("SERVER_ERROR", "Failed to retry job", 500);
    }
  },
};
