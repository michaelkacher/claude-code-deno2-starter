/**
 * POST /api/2fa/verify
 * Verify TOTP or backup code during login
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { verifyTOTP } from "../../../../shared/lib/totp.ts";
import { UserRepository } from "../../../../shared/repositories/index.ts";
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
      // Require authentication
      const user = requireUser(ctx);

      // Parse and validate request body
      const body = await parseJsonBody(req, Verify2FASchema);

      const userRepo = new UserRepository();
      const dbUser = await userRepo.findById(user.sub);

      if (!dbUser) {
        return errorResponse("NOT_FOUND", "User not found", 404);
      }

      if (!dbUser.twoFactorEnabled || !dbUser.twoFactorSecret) {
        return errorResponse("NOT_ENABLED", "2FA is not enabled", 400);
      }

      let isValid = false;

      // Check if code is 6 digits (TOTP) or 8 chars (backup code)
      if (body.code.length === 6) {
        // Verify TOTP code
        isValid = await verifyTOTP(body.code, dbUser.twoFactorSecret);
      } else if (body.code.length === 8) {
        // Verify backup code
        const backupCodes = dbUser.twoFactorBackupCodes || [];
        if (backupCodes.includes(body.code)) {
          isValid = true;
          // Remove used backup code
          const remainingCodes = backupCodes.filter((c) => c !== body.code);
          await userRepo.update(user.sub, {
            twoFactorBackupCodes: remainingCodes,
          });
        }
      }

      if (!isValid) {
        return errorResponse("INVALID_CODE", "Invalid verification code", 400);
      }

      return successResponse({
        message: "2FA verification successful",
      });
    } catch (error) {
      if (error.message === "Authentication required") {
        return errorResponse("UNAUTHORIZED", "Authentication required", 401);
      }
      if (error.name === "ZodError") {
        return errorResponse("VALIDATION_ERROR", "Invalid request body", 400);
      }
      console.error("2FA verify error:", error);
      return errorResponse("SERVER_ERROR", "Failed to verify 2FA", 500);
    }
  },
};
