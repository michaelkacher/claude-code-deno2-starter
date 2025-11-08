/**
 * DELETE /api/admin/users/[id]
 * Delete user account
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
      const admin = requireAdmin(ctx);
      const userId = ctx.params.id;

      const userMgmt = new UserManagementService();
      await userMgmt.deleteUser(userId, admin.sub);

      return successResponse({
        message: "User deleted successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Admin access required") {
          return errorResponse("FORBIDDEN", "Admin access required", 403);
        }
        if (error.message === "User not found") {
          return errorResponse("USER_NOT_FOUND", error.message, 404);
        }
        if (error.message.includes("Cannot delete")) {
          return errorResponse("CANNOT_DELETE_SELF", error.message, 400);
        }
      }
      console.error("Delete user error:", error);
      return errorResponse("SERVER_ERROR", "Failed to delete user", 500);
    }
  },
};
