/**
 * POST /api/auth/forgot-password
 * Request password reset - sends reset email
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

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Parse and validate request body
      const body = await parseJsonBody(req);
      const { email } = ForgotPasswordSchema.parse(body);

      const userRepo = new UserRepository();
      const tokenRepo = new TokenRepository();

      // Check if user exists
      const user = await userRepo.findByEmail(email);
      
      // Always return success (don't reveal if email exists)
      if (!user) {
        return successResponse({
          message: "If an account exists with this email, a password reset link will be sent.",
        });
      }

      // Generate password reset token
      const resetToken = crypto.randomUUID();
      const expiresAt = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour

      // Store reset token
      await tokenRepo.storePasswordResetToken(
        resetToken,
        user.id,
        user.email,
        expiresAt
      );

      // TODO: Send password reset email
      // await sendPasswordResetEmail(user.email, resetToken);

      console.log(`Password reset token for ${email}: ${resetToken}`);

      return successResponse({
        message: "If an account exists with this email, a password reset link will be sent.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse(
          "VALIDATION_ERROR",
          error.errors[0].message,
          400
        );
      }
      console.error("Forgot password error:", error);
      return errorResponse("SERVER_ERROR", "Failed to process request", 500);
    }
  },
};
