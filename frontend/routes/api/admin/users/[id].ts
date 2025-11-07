/**
 * GET /api/admin/users/[id]
 * Get detailed user information
 */

import { Handlers } from "$fresh/server.ts";
import { TokenRepository, UserRepository } from "../../../../../backend/repositories/index.ts";
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

      const userId = ctx.params.id;
      const userRepo = new UserRepository();
      const tokenRepo = new TokenRepository();

      // Get user
      const user = await userRepo.findById(userId);
      if (!user) {
        return errorResponse("USER_NOT_FOUND", "User not found", 404);
      }

      // Get user's refresh tokens
      const tokens = await tokenRepo.listUserRefreshTokens(userId);

      // Return user data (mask sensitive fields)
      return successResponse({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorSecret: user.twoFactorSecret ? "***MASKED***" : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        activeSessions: tokens.length,
      });
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("Get user error:", error);
      return errorResponse("SERVER_ERROR", "Failed to get user", 500);
    }
  },
};
