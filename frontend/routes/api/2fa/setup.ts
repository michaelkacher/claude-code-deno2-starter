/**
 * POST /api/2fa/setup
 * Generate TOTP secret and QR code for 2FA setup
 * 
 * REFACTORED: Uses TwoFactorService to eliminate duplicate logic
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

const logger = createLogger('Setup2FAAPI');

export const handler: Handlers<unknown, AppState> = {
  async POST(_req, ctx) {
    try {
      const user = requireUser(ctx);
      const twoFactorService = new TwoFactorService();

      const result = await twoFactorService.setup(user.sub);

      return successResponse(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Authentication required") {
          return errorResponse("UNAUTHORIZED", "Authentication required", 401);
        }
        if (error.message === "Two-factor authentication is already enabled") {
          return errorResponse("ALREADY_ENABLED", error.message, 400);
        }
        if (error.message === "User not found") {
          return errorResponse("NOT_FOUND", error.message, 404);
        }
      }
      logger.error("2FA setup error", { error });
      return errorResponse("SERVER_ERROR", "Failed to setup 2FA", 500);
    }
  },
};
