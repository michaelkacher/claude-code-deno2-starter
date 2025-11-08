/**
 * GET /api/jobs/stats
 * Get job queue statistics
 */

import { Handlers } from "$fresh/server.ts";
import { JobRepository } from "../../../../shared/repositories/index.ts";
import {
    errorResponse,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      const jobRepo = new JobRepository();
      const stats = await jobRepo.getStats();

      return successResponse(stats);
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("Get job stats error:", error);
      return errorResponse("SERVER_ERROR", "Failed to get job stats", 500);
    }
  },
};
