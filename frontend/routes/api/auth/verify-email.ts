/**
 * POST /api/auth/verify-email
 * Verify email address with token
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

const VerifyEmailSchema = z.object({
  token: z.string().uuid(),
});

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Parse and validate request body
      const body = await parseJsonBody(req);
      const { token } = VerifyEmailSchema.parse(body);

      const userRepo = new UserRepository();
      const tokenRepo = new TokenRepository();

      // Get verification token data
      const tokenData = await tokenRepo.getEmailVerificationToken(token);
      
      if (!tokenData) {
        return errorResponse(
          "INVALID_TOKEN",
          "Invalid or expired verification token",
          400
        );
      }

      // Get user
      const user = await userRepo.findById(tokenData.userId);
      
      if (!user) {
        return errorResponse("USER_NOT_FOUND", "User not found", 404);
      }

      // Check if already verified
      if (user.emailVerified) {
        return errorResponse(
          "ALREADY_VERIFIED",
          "Email is already verified",
          400
        );
      }

      // Verify email
      await userRepo.verifyEmail(user.id);

      // Delete used token
      await tokenRepo.deleteEmailVerificationToken(token);

      return successResponse({
        message: "Email verified successfully. You can now log in.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse(
          "VALIDATION_ERROR",
          error.errors[0].message,
          400
        );
      }
      console.error("Verify email error:", error);
      return errorResponse("SERVER_ERROR", "Failed to verify email", 500);
    }
  },
};
