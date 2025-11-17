/**
 * POST /api/auth/reset-password
 * Complete password reset with token
 */

import { Handlers } from "fresh";
import { z } from "zod";
import { AuthService } from '@/services/auth.service.ts';

const ResetPasswordSchema = z.object({
  token: z.string().uuid(),
  newPassword: z.string().min(8),
});

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    const req = ctx.req;
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

