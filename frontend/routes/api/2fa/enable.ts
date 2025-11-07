/**
 * POST /api/2fa/enable
 * Enable 2FA after verifying TOTP code
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { verifyTOTP } from "../../../../backend/lib/totp.ts";
import { UserRepository } from "../../../../backend/repositories/index.ts";
import {
    errorResponse,
    parseJsonBody,
    requireUser,
    successResponse,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const Enable2FASchema = z.object({
  code: z.string().length(6),
});

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Require authentication
      const user = requireUser(ctx);

      // Parse and validate request body
      const body = await parseJsonBody(req, Enable2FASchema);

      const userRepo = new UserRepository();
      const dbUser = await userRepo.findById(user.sub);

      if (!dbUser) {
        return errorResponse("NOT_FOUND", "User not found", 404);
      }

      if (dbUser.twoFactorEnabled) {
        return errorResponse(
          "ALREADY_ENABLED",
          "Two-factor authentication is already enabled",
          400,
        );
      }

      if (!dbUser.twoFactorSecret) {
        return errorResponse(
          "NO_SECRET",
          "2FA not setup. Call /api/2fa/setup first",
          400,
        );
      }

      // Verify TOTP code
      const isValid = await verifyTOTP(body.code, dbUser.twoFactorSecret);
      if (!isValid) {
        return errorResponse("INVALID_CODE", "Invalid verification code", 400);
      }

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () =>
        crypto.randomUUID().slice(0, 8)
      );

      // Enable 2FA
      await userRepo.update(user.sub, {
        twoFactorEnabled: true,
        twoFactorBackupCodes: backupCodes,
      });

      return successResponse({
        message: "Two-factor authentication enabled successfully",
        backupCodes,
      });
    } catch (error) {
      if (error.message === "Authentication required") {
        return errorResponse("UNAUTHORIZED", "Authentication required", 401);
      }
      if (error.name === "ZodError") {
        return errorResponse("VALIDATION_ERROR", "Invalid request body", 400);
      }
      console.error("2FA enable error:", error);
      return errorResponse("SERVER_ERROR", "Failed to enable 2FA", 500);
    }
  },
};
