/**
 * POST /api/2fa/disable
 * Disable 2FA with password and current code verification
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { verifyPassword } from "../../../../shared/lib/password.ts";
import { UserRepository } from "../../../../shared/repositories/index.ts";
import {
    errorResponse,
    parseJsonBody,
    requireUser,
    successResponse,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const Disable2FASchema = z.object({
  password: z.string().min(1),
  code: z.string().min(6).max(8),
});

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Require authentication
      const user = requireUser(ctx);

      // Parse and validate request body
      const body = await parseJsonBody(req, Disable2FASchema);

      const userRepo = new UserRepository();
      const dbUser = await userRepo.findById(user.sub);

      if (!dbUser) {
        return errorResponse("NOT_FOUND", "User not found", 404);
      }

      if (!dbUser.twoFactorEnabled) {
        return errorResponse("NOT_ENABLED", "2FA is not enabled", 400);
      }

      // Verify password
      const isPasswordValid = await verifyPassword(
        body.password,
        dbUser.password,
      );
      if (!isPasswordValid) {
        return errorResponse("INVALID_PASSWORD", "Invalid password", 400);
      }

      // Verify 2FA code
      let isCodeValid = false;
      if (body.code.length === 6 && dbUser.twoFactorSecret) {
        isCodeValid = await verifyTOTP(body.code, dbUser.twoFactorSecret);
      } else if (body.code.length === 8) {
        const backupCodes = dbUser.twoFactorBackupCodes || [];
        isCodeValid = backupCodes.includes(body.code);
      }

      if (!isCodeValid) {
        return errorResponse("INVALID_CODE", "Invalid verification code", 400);
      }

      // Disable 2FA
      await userRepo.update(user.sub, {
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
        twoFactorBackupCodes: [],
      });

      return successResponse({
        message: "Two-factor authentication disabled successfully",
      });
    } catch (error) {
      if (error.message === "Authentication required") {
        return errorResponse("UNAUTHORIZED", "Authentication required", 401);
      }
      if (error.name === "ZodError") {
        return errorResponse("VALIDATION_ERROR", "Invalid request body", 400);
      }
      console.error("2FA disable error:", error);
      return errorResponse("SERVER_ERROR", "Failed to disable 2FA", 500);
    }
  },
};
