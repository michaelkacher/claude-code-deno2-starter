/**
 * GET /api/jobs/stats
 * Get job queue statistics
 */

import { Handlers } from "fresh";
import { JobRepository } from "../../../../shared/repositories/index.ts";
import {
    requireAdmin,
    successResponse,
    withErrorHandler,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (ctx) => {
    // Require admin role (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    const jobRepo = new JobRepository();
    const stats = await jobRepo.getStats();

    return successResponse(stats);
  }),
};
