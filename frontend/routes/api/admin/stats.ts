/**
 * GET /api/admin/stats
 * Admin dashboard statistics
 *
 * REFACTORED: Uses withErrorHandler pattern
 */

import { Handlers } from "fresh";
import { UserRepository } from "../../../../shared/repositories/index.ts";
import {
    requireAdmin,
    successResponse,
    withErrorHandler,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (ctx) => {
    // Require admin access (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    const userRepo = new UserRepository();

    // Get user stats
    const stats = await userRepo.getStats();

    return successResponse({
      users: {
        total: stats.totalUsers,
        verified: stats.verifiedCount,
        unverified: stats.totalUsers - stats.verifiedCount,
        admins: stats.adminCount,
        with2FA: stats.twoFactorCount,
      },
      timestamp: new Date().toISOString(),
    });
  }),
};
