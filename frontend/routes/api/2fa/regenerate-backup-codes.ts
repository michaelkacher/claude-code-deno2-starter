/**
 * POST /api/2fa/regenerate-backup-codes
 * Generate new backup codes (requires password + current code)
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { UserRepository } from "../../../../shared/repositories/index.ts";
import { AuthService } from "../../../../shared/services/index.ts";
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
      // Require authentication
      const user = requireUser(ctx);

      // Parse and validate request body
      const body = await parseJsonBody(req);
      const validatedBody = RegenerateCodesSchema.parse(body);

      const authService = new AuthService();
      const userRepo = new UserRepository();
      const dbUser = await userRepo.findById(user.sub);

      if (!dbUser) {
        return errorResponse("NOT_FOUND", "User not found", 404);
      }

      if (!dbUser.twoFactorEnabled || !dbUser.twoFactorSecret) {
        return errorResponse("NOT_ENABLED", "2FA is not enabled", 400);
      }

      // Verify password using AuthService
      const isPasswordValid = await authService.verifyUserPassword(
        user.sub,
        validatedBody.password
      );
      if (!isPasswordValid) {
        return errorResponse("INVALID_PASSWORD", "Invalid password", 400);
      }

      // Verify TOTP code
      const { verifyTOTP } = await import("../../../../shared/lib/2fa.ts");
      const isCodeValid = await verifyTOTP(validatedBody.code, dbUser.twoFactorSecret);
      if (!isCodeValid) {
        return errorResponse("INVALID_CODE", "Invalid verification code", 400);
      }

      // Generate new backup codes
      const backupCodes = Array.from({ length: 10 }, () =>
        crypto.randomUUID().slice(0, 8)
      );

      // Update backup codes
      await userRepo.update(user.sub, {
        twoFactorBackupCodes: backupCodes,
      });

      return successResponse({
        message: "Backup codes regenerated successfully",
        backupCodes,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Authentication required") {
        return errorResponse("UNAUTHORIZED", "Authentication required", 401);
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
