/**
 * POST /api/2fa/regenerate-backup-codes
 * Generate new backup codes (requires password + current code)
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

const RegenerateCodesSchema = z.object({
  password: z.string().min(1),
  code: z.string().length(6),
});

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      const user = requireUser(ctx);
      const body = await parseJsonBody(req);
      const validatedBody = RegenerateCodesSchema.parse(body);

      const twoFactorService = new TwoFactorService();
      const result = await twoFactorService.regenerateBackupCodes(
        user.sub,
        validatedBody.password,
        validatedBody.code
      );

      return successResponse({
        message: "Backup codes regenerated successfully",
        backupCodes: result.backupCodes,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Authentication required") {
        return errorResponse("UNAUTHORIZED", "Authentication required", 401);
      }
      if (error instanceof Error && error.message === "2FA is not enabled") {
        return errorResponse("NOT_ENABLED", error.message, 400);
      }
      if (error instanceof Error && error.message === "Invalid password") {
        return errorResponse("INVALID_PASSWORD", error.message, 400);
      }
      if (error instanceof Error && error.message === "Invalid verification code") {
        return errorResponse("INVALID_CODE", error.message, 400);
      }
      if (error instanceof Error && error.message === "User not found") {
        return errorResponse("NOT_FOUND", error.message, 404);
      }
      if (error instanceof z.ZodError) {
        return errorResponse("VALIDATION_ERROR", "Invalid request body", 400);
      }
      console.error("Regenerate backup codes error:", error);
      return errorResponse(
        "SERVER_ERROR",
        "Failed to regenerate backup codes",
        500,
      );
    }
  },
};
