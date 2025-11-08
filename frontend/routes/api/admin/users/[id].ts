/**
 * GET /api/admin/users/[id]
 * Get detailed user information
 * 
 * REFACTORED: Uses UserManagementService to eliminate duplicate logic
 */

import { Handlers } from "$fresh/server.ts";
import { createLogger } from "../../../../../shared/lib/logger.ts";
import { UserManagementService } from "../../../../../shared/services/index.ts";
import {
    errorResponse,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../lib/fresh-helpers.ts";

const logger = createLogger('AdminGetUserAPI');

export const handler: Handlers<unknown, AppState> = {
  async GET(_req, ctx) {
    try {
      requireAdmin(ctx);

      const userId = ctx.params.id;
      const userMgmt = new UserManagementService();

      const user = await userMgmt.getUserDetails(userId);

      return successResponse(user);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Admin access required") {
          return errorResponse("FORBIDDEN", "Admin access required", 403);
        }
        if (error.message === "User not found") {
          return errorResponse("USER_NOT_FOUND", error.message, 404);
        }
      }
      logger.error("Get user error", { error });
      return errorResponse("SERVER_ERROR", "Failed to get user", 500);
    }
  },
};
