/**
 * POST /api/auth/resend-verification
 * Resend email verification link
 */

import { Handlers } from "fresh";
import { z } from "zod";
import { AuthService } from '@/services/index.ts";
import {
    parseJsonBody,
    withErrorHandler,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const ResendVerificationSchema = z.object({
  email: z.string().email(),
});

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    const req = ctx.req;
    // Parse and validate request body (Zod errors automatically handled)
    const { email } = await parseJsonBody(req, ResendVerificationSchema);

    const authService = new AuthService();

    // Resend verification email (service throws typed errors)
    const _verificationToken = await authService.resendVerification(email);

    // TODO(@team): Send verification email
    // await sendVerificationEmail(email, verificationToken);

    return new Response(
      JSON.stringify({
        data: {
          message: "If an account exists with this email, a verification link will be sent.",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
};

