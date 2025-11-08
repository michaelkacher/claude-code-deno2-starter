/**
 * GET /api/auth/me
 * Get current authenticated user
 */

import { Handlers } from "$fresh/server.ts";
import { createLogger } from '../../../../shared/lib/logger.ts';
import { UserRepository } from "../../../../shared/repositories/index.ts";
import {
    errorResponse,
    requireUser,
    successResponse,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const logger = createLogger('MeAPI');

export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    try {
      // Get user from auth middleware
      const authUser = requireUser(ctx);
      const userRepo = new UserRepository();

      // Fetch full user data from database
      const user = await userRepo.findById(authUser.sub);
      
      if (!user) {
        return errorResponse("USER_NOT_FOUND", "User not found", 404);
      }

      // Return user data (without sensitive fields)
      return successResponse({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      if (error.message === "Unauthorized") {
        return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
      }
      logger.error("/me error", { error });
      return errorResponse("SERVER_ERROR", "Failed to fetch user", 500);
    }
  },
};
