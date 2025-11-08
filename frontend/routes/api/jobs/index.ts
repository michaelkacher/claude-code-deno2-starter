/**
 * GET /api/jobs
 * List jobs with optional filters
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

      // Parse query parameters
      const url = new URL(req.url);
      const status = url.searchParams.get("status") || undefined;
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const cursor = url.searchParams.get("cursor") || undefined;

      const jobRepo = new JobRepository();
      const result = await jobRepo.listJobs({
        status: status as any,
        limit,
        cursor,
      });

      return successResponse({
        jobs: result.items,
        cursor: result.cursor,
        hasMore: result.hasMore,
      });
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("List jobs error:", error);
      return errorResponse("SERVER_ERROR", "Failed to list jobs", 500);
    }
  },
};
