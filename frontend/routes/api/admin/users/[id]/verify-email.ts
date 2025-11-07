/**
 * POST /api/admin/users/[id]/verify-email
 * Admin-initiated email verification
 */

import { Handlers } from "$fresh/server.ts";
import { UserRepository } from "../../../../../../backend/repositories/index.ts";
import {
    errorResponse,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      const userId = ctx.params.id;
      const userRepo = new UserRepository();

      // Check if user exists
      const user = await userRepo.findById(userId);
      if (!user) {
        return errorResponse("USER_NOT_FOUND", "User not found", 404);
      }

      // Check if already verified
      if (user.emailVerified) {
        return errorResponse(
          "ALREADY_VERIFIED",
          "Email is already verified",
          400
        );
      }

      // Verify email
      await userRepo.verifyEmail(userId);

      return successResponse({
        message: "User email verified successfully",
      });
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("Verify email error:", error);
      return errorResponse("SERVER_ERROR", "Failed to verify email", 500);
    }
  },
};
