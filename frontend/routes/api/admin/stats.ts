/**
 * GET /api/admin/stats
 * Admin dashboard statistics
 */

import { Handlers } from "$fresh/server.ts";
import { UserRepository } from "../../../../shared/repositories/index.ts";
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

      const userRepo = new UserRepository();

      // Get user stats
      const stats = await userRepo.getStats();

      return successResponse({
        users: {
          total: stats.totalUsers,
          verified: stats.verifiedCount,
          unverified: stats.unverifiedCount,
          admins: stats.adminCount,
          with2FA: stats.twoFactorEnabledCount,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("Get stats error:", error);
      return errorResponse("SERVER_ERROR", "Failed to get stats", 500);
    }
  },
};
