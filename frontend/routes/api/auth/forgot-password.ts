/**
 * POST /api/auth/forgot-password
 * Request password reset - sends reset email
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { createLogger } from '../../../../shared/lib/logger.ts';
import { AuthService } from "../../../../shared/services/index.ts";
import {
  errorResponse,
  parseJsonBody,
  successResponse,
  type AppState,
} from "../../../lib/fresh-helpers.ts";

const logger = createLogger('ForgotPasswordAPI');

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Parse and validate request body
      const body = await parseJsonBody(req);
      const { email } = ForgotPasswordSchema.parse(body);

      const authService = new AuthService();

      // Request password reset
      const resetToken = await authService.requestPasswordReset(email);

      // TODO: Send password reset email
      // if (resetToken) {
      //   await sendPasswordResetEmail(email, resetToken);
      // }

      if (resetToken) {
        logger.info('Password reset requested', { email });
      }

      // Always return success (don't reveal if email exists)
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
      logger.error("Forgot password error", { error });
      return errorResponse("SERVER_ERROR", "Failed to process request", 500);
    }
  },
};
