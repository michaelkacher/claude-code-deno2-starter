/**
 * GET /api/jobs/:id
 * Get job details by ID
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
  async GET(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      // Get job ID from route params
      const jobId = ctx.params.id;

      const jobRepo = new JobRepository();
      const job = await jobRepo.findById(jobId);

      if (!job) {
        return errorResponse("NOT_FOUND", "Job not found", 404);
      }

      return successResponse(job);
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("Get job error:", error);
      return errorResponse("SERVER_ERROR", "Failed to get job", 500);
    }
  },
};
