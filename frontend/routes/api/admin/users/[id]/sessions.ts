/**
 * DELETE /api/admin/users/[id]/sessions
 * Revoke all user's refresh tokens (logout all devices)
 */

import { Handlers } from "$fresh/server.ts";
import { TokenRepository } from "../../../../../../backend/repositories/index.ts";
import {
    errorResponse,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async DELETE(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      const userId = ctx.params.id;
      const tokenRepo = new TokenRepository();

      // Revoke all refresh tokens
      await tokenRepo.revokeAllUserRefreshTokens(userId);

      return successResponse({
        message: "All user sessions revoked successfully",
      });
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("Revoke sessions error:", error);
      return errorResponse("SERVER_ERROR", "Failed to revoke sessions", 500);
    }
  },
};
