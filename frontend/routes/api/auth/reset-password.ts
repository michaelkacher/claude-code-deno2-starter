/**
 * POST /api/auth/reset-password
 * Complete password reset with token
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { TokenRepository, UserRepository } from "../../../../shared/repositories/index.ts";
import {
    errorResponse,
    parseJsonBody,
    successResponse,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const ResetPasswordSchema = z.object({
  token: z.string().uuid(),
  newPassword: z.string().min(8),
});

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Parse and validate request body
      const body = await parseJsonBody(req);
      const { token, newPassword } = ResetPasswordSchema.parse(body);

      const userRepo = new UserRepository();
      const tokenRepo = new TokenRepository();

      // Verify reset token
      const tokenData = await tokenRepo.getPasswordResetToken(token);
      
      if (!tokenData) {
        return errorResponse(
          "INVALID_TOKEN",
          "Invalid or expired reset token",
          400
        );
      }

      // Update password (automatically hashed by repository)
      await userRepo.updatePassword(tokenData.userId, newPassword);

      // Delete used token
      await tokenRepo.deletePasswordResetToken(token);

      // Revoke all existing sessions for security
      await tokenRepo.revokeAllUserRefreshTokens(tokenData.userId);

      return successResponse({
        message: "Password reset successful. Please log in with your new password.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse(
          "VALIDATION_ERROR",
          error.errors[0].message,
          400
        );
      }
      console.error("Reset password error:", error);
      return errorResponse("SERVER_ERROR", "Failed to reset password", 500);
    }
  },
};
