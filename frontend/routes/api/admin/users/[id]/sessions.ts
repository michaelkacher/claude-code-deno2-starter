/**
 * DELETE /api/admin/users/[id]/sessions
 * Revoke all user's refresh tokens (logout all devices)
 * 
 * REFACTORED: Uses UserManagementService to eliminate duplicate logic
 */

import { Handlers } from "$fresh/server.ts";
import { UserManagementService } from "../../../../../../shared/services/index.ts";
import {
    errorResponse,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async DELETE(_req, ctx) {
    try {
      requireAdmin(ctx);

      const userId = ctx.params.id;
      const userMgmt = new UserManagementService();

      await userMgmt.revokeAllUserSessions(userId);

      return successResponse({
        message: "All user sessions revoked successfully",
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("Revoke sessions error:", error);
      return errorResponse("SERVER_ERROR", "Failed to revoke sessions", 500);
    }
  },
};
