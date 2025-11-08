/**
 * POST /api/auth/verify-email
 * Verify email address with token
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

const logger = createLogger('VerifyEmailAPI');

const VerifyEmailSchema = z.object({
  token: z.string().uuid(),
});

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Parse and validate request body
      const body = await parseJsonBody(req);
      const { token } = VerifyEmailSchema.parse(body);

      const authService = new AuthService();

      // Verify email
      try {
        await authService.verifyEmail(token);
      } catch (error) {
        if (error instanceof Error && error.message === "INVALID_TOKEN") {
          return errorResponse(
            "INVALID_TOKEN",
            "Invalid or expired verification token",
            400
          );
        }
        throw error;
      }

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
      logger.error("Verify email error", { error });
      return errorResponse("SERVER_ERROR", "Failed to verify email", 500);
    }
  },
};
