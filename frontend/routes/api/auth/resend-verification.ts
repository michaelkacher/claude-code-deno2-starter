/**
 * POST /api/auth/resend-verification
 * Resend email verification link
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { TokenRepository, UserRepository } from "../../../../backend/repositories/index.ts";
import {
    errorResponse,
    parseJsonBody,
    successResponse,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const ResendVerificationSchema = z.object({
  email: z.string().email(),
});

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Parse and validate request body
      const body = await parseJsonBody(req);
      const { email } = ResendVerificationSchema.parse(body);

      const userRepo = new UserRepository();
      const tokenRepo = new TokenRepository();

      // Get user by email
      const user = await userRepo.findByEmail(email);
      
      // Don't reveal if email exists or not
      if (!user) {
        return successResponse({
          message: "If an account exists with this email, a verification link will be sent.",
        });
      }

      // Check if already verified
      if (user.emailVerified) {
        return errorResponse(
          "ALREADY_VERIFIED",
          "Email is already verified",
          400
        );
      }

      // Generate new verification token
      const verificationToken = crypto.randomUUID();
      const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

      // Store verification token
      await tokenRepo.storeEmailVerificationToken(
        verificationToken,
        user.id,
        user.email,
        expiresAt
      );

      // TODO: Send verification email
      // await sendVerificationEmail(user.email, verificationToken);

      console.log(`Verification token for ${email}: ${verificationToken}`);

      return successResponse({
        message: "If an account exists with this email, a verification link will be sent.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse(
          "VALIDATION_ERROR",
          error.errors[0].message,
          400
        );
      }
      console.error("Resend verification error:", error);
      return errorResponse("SERVER_ERROR", "Failed to resend verification", 500);
    }
  },
};
