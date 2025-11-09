/**
 * GET /api/jobs - List jobs with optional filters
 */

import { Handlers } from "$fresh/server.ts";
import { JobStatus } from "../../../../shared/lib/queue.ts";
import { JobRepository } from "../../../../shared/repositories/index.ts";
import {
  requireAdmin,
  successResponse,
  withErrorHandler,
  type AppState,
} from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (req, _ctx) => {
    // Require admin role (throws AuthorizationError if not admin)
    requireAdmin(_ctx);

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const cursor = url.searchParams.get("cursor") || undefined;

    const jobRepo = new JobRepository();
    const result = await jobRepo.listJobs({
      status: status as JobStatus | undefined,
      limit,
      cursor,
    });

    return successResponse({
      jobs: result.items,
      cursor: result.cursor,
      hasMore: result.hasMore,
    });
  }),
};
