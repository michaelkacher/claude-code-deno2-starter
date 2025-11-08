/**
 * POST /api/2fa/verify
 * Verify TOTP or backup code during login
 * 
 * REFACTORED: Uses TwoFactorService to eliminate duplicate logic
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { TwoFactorService } from "../../../../shared/services/index.ts";
import {
    errorResponse,
    parseJsonBody,
    requireUser,
    successResponse,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const Verify2FASchema = z.object({
  code: z.string().min(6).max(8),
});

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      const user = requireUser(ctx);
      const rawBody = await parseJsonBody(req);
      const body = Verify2FASchema.parse(rawBody);

      const twoFactorService = new TwoFactorService();
      const result = await twoFactorService.verify(user.sub, body.code);

      if (!result.isValid) {
        return errorResponse("INVALID_CODE", "Invalid verification code", 400);
      }

      return successResponse({
        message: "2FA verification successful",
        remainingBackupCodes: result.remainingBackupCodes,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Authentication required") {
          return errorResponse("UNAUTHORIZED", "Authentication required", 401);
        }
        if (error.message === "2FA is not enabled") {
          return errorResponse("NOT_ENABLED", error.message, 400);
        }
        if (error.message === "User not found") {
          return errorResponse("NOT_FOUND", error.message, 404);
        }
      }
      if (error instanceof z.ZodError) {
        return errorResponse("VALIDATION_ERROR", "Invalid request body", 400);
      }
      console.error("2FA verify error:", error);
      return errorResponse("SERVER_ERROR", "Failed to verify 2FA", 500);
    }
  },
};
