/**
 * GET /api/2fa/status
 * Check if user has 2FA enabled
 */

import { Handlers } from "$fresh/server.ts";
import {
    errorResponse,
    requireUser,
    successResponse,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    try {
      // Require authentication
      const user = requireUser(ctx);

      return successResponse({
        enabled: user.twoFactorEnabled || false,
      });
    } catch (error) {
      if (error.message === "Authentication required") {
        return errorResponse("UNAUTHORIZED", "Authentication required", 401);
      }
      console.error("2FA status error:", error);
      return errorResponse("SERVER_ERROR", "Failed to get 2FA status", 500);
    }
  },
};
