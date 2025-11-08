/**
 * GET /api/2fa/status
 * Check if user has 2FA enabled
 * 
 * REFACTORED: Uses TwoFactorService for consistency
 */

import { Handlers } from "$fresh/server.ts";
import { createLogger } from "../../../../shared/lib/logger.ts";
import { TwoFactorService } from "../../../../shared/services/index.ts";
import {
    errorResponse,
    requireUser,
    successResponse,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const logger = createLogger('Status2FAAPI');

export const handler: Handlers<unknown, AppState> = {
  async GET(_req, ctx) {
    try {
      const user = requireUser(ctx);
      const twoFactorService = new TwoFactorService();

      const status = await twoFactorService.getStatus(user.sub);

      return successResponse(status);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Authentication required") {
          return errorResponse("UNAUTHORIZED", "Authentication required", 401);
        }
        if (error.message === "User not found") {
          return errorResponse("NOT_FOUND", error.message, 404);
        }
      }
      logger.error("2FA status error", { error });
      return errorResponse("SERVER_ERROR", "Failed to get 2FA status", 500);
    }
  },
};
