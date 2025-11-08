/**
 * POST /api/admin/users/[id]/verify-email
 * Admin-initiated email verification
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
  async POST(_req, ctx) {
    try {
      requireAdmin(ctx);

      const userId = ctx.params.id;
      const userMgmt = new UserManagementService();

      await userMgmt.verifyUserEmail(userId);

      return successResponse({
        message: "User email verified successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Admin access required") {
          return errorResponse("FORBIDDEN", "Admin access required", 403);
        }
        if (error.message === "User not found") {
          return errorResponse("USER_NOT_FOUND", error.message, 404);
        }
        if (error.message === "Email is already verified") {
          return errorResponse("ALREADY_VERIFIED", error.message, 400);
        }
      }
      console.error("Verify email error:", error);
      return errorResponse("SERVER_ERROR", "Failed to verify email", 500);
    }
  },
};
