/**
 * POST /api/2fa/enable
 * Enable 2FA after verifying TOTP code
 * 
 * REFACTORED: Uses TwoFactorService to eliminate duplicate logic
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { createLogger } from "../../../../shared/lib/logger.ts";
import { TwoFactorService } from "../../../../shared/services/index.ts";
import {
    errorResponse,
    parseJsonBody,
    requireUser,
    successResponse,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const logger = createLogger('Enable2FAAPI');

const Enable2FASchema = z.object({
  code: z.string().length(6),
});

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      const user = requireUser(ctx);
      const rawBody = await parseJsonBody(req);
      const body = Enable2FASchema.parse(rawBody);
      
      const twoFactorService = new TwoFactorService();
      const result = await twoFactorService.enable(user.sub, body.code);

      return successResponse({
        message: "Two-factor authentication enabled successfully",
        backupCodes: result.backupCodes,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Authentication required") {
          return errorResponse("UNAUTHORIZED", "Authentication required", 401);
        }
        if (error.message === "Two-factor authentication is already enabled") {
          return errorResponse("ALREADY_ENABLED", error.message, 400);
        }
        if (error.message === "2FA not setup. Call setup() first") {
          return errorResponse("NO_SECRET", error.message, 400);
        }
        if (error.message === "Invalid verification code") {
          return errorResponse("INVALID_CODE", error.message, 400);
        }
        if (error.message === "User not found") {
          return errorResponse("NOT_FOUND", error.message, 404);
        }
      }
      if (error instanceof z.ZodError) {
        return errorResponse("VALIDATION_ERROR", "Invalid request body", 400);
      }
      logger.error("2FA enable error", { error });
      return errorResponse("SERVER_ERROR", "Failed to enable 2FA", 500);
    }
  },
};
