/**
 * POST /api/auth/signup
 * User registration endpoint
 */

import { Handlers } from "fresh";
import { z } from "zod";
import { AuthService } from '@/services/index.ts";
import {
    parseJsonBody,
    withErrorHandler,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    const req = ctx.req;
    // Parse and validate request body (Zod errors automatically handled)
    const { email, password, name } = await parseJsonBody(req, SignupSchema);

    const authService = new AuthService();

    // Create user account (service throws typed errors)
    const signupResult = await authService.signup(email, password, name);

    // TODO(@team): Send verification email
    // await sendVerificationEmail(signupResult.user.email, signupResult.verificationToken);

    // Return success (without sensitive data)
    return new Response(
      JSON.stringify({
        data: {
          user: signupResult.user,
          message: "Account created successfully. Please check your email to verify your account.",
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
};

