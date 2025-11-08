/**
 * POST /api/auth/resend-verification
 * Resend email verification link
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { AuthService } from "../../../../shared/services/index.ts";
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

      const authService = new AuthService();

      // Resend verification email
      let verificationToken;
      try {
        verificationToken = await authService.resendVerification(email);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "USER_NOT_FOUND") {
            // Don't reveal if email exists or not
            return successResponse({
              message: "If an account exists with this email, a verification link will be sent.",
            });
          }
          if (error.message === "EMAIL_ALREADY_VERIFIED") {
            return errorResponse(
              "ALREADY_VERIFIED",
              "Email is already verified",
              400
            );
          }
        }
        throw error;
      }

      // TODO: Send verification email
      // await sendVerificationEmail(email, verificationToken);

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
