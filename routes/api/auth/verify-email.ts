/**
 * POST /api/auth/verify-email
 * Verify email address with token
 */

import { Handlers } from "fresh";
import { z } from "zod";
import { parseJsonBody, requireUser, successResponse, errorResponse, withErrorHandler, type AppState } from '@/lib/fresh-helpers.ts';
import { setCookie } from 'jsr:@std/http/cookie';
import { AuthService } from '@/services/auth.service.ts';

const VerifyEmailSchema = z.object({
  token: z.string().uuid(),
});

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    const req = ctx.req;
    // Parse and validate request body (Zod errors automatically handled)
    const { token } = await parseJsonBody(req, VerifyEmailSchema);

    const authService = new AuthService();

    // Verify email (service throws typed errors)
    await authService.verifyEmail(token);

    return new Response(
      JSON.stringify({
        data: {
          message: "Email verified successfully. You can now log in.",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
};

