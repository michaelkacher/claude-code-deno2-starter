/**
 * POST /api/auth/forgot-password
 * Request password reset - sends reset email
 */

import { Handlers } from "fresh";
import { z } from "zod";
import { AuthService } from "../../../../shared/services/index.ts";
import {
    parseJsonBody,
    withErrorHandler,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    const req = ctx.req;
    // Parse and validate request body (Zod errors automatically handled)
    const { email } = await parseJsonBody(req, ForgotPasswordSchema);

    const authService = new AuthService();

    // Request password reset (service throws typed errors)
    const _resetToken = await authService.requestPasswordReset(email);

    // TODO(@team): Send password reset email
    // if (resetToken) {
    //   await sendPasswordResetEmail(email, resetToken);
    // }

    // Always return success (don't reveal if email exists)
    return new Response(
      JSON.stringify({
        data: {
          message: "If an account exists with this email, a password reset link will be sent.",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
};
