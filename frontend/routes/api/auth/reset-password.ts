/**
 * POST /api/auth/reset-password
 * Complete password reset with token
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { AuthService } from "../../../../shared/services/index.ts";
import {
  parseJsonBody,
  withErrorHandler,
  type AppState,
} from "../../../lib/fresh-helpers.ts";

const ResetPasswordSchema = z.object({
  token: z.string().uuid(),
  newPassword: z.string().min(8),
});

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (req, _ctx) => {
    // Parse and validate request body (Zod errors automatically handled)
    const { token, newPassword } = await parseJsonBody(req, ResetPasswordSchema);

    const authService = new AuthService();

    // Reset password (service throws typed errors)
    await authService.resetPassword(token, newPassword);

    return new Response(
      JSON.stringify({
        data: {
          message: "Password reset successful. Please log in with your new password.",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
};
