/**
 * POST /api/auth/login
 * User login endpoint
 */

import { Handlers } from "fresh";
import { z } from "zod";
import { parseJsonBody, requireUser, successResponse, errorResponse, withErrorHandler, type AppState } from '@/lib/fresh-helpers.ts';
import { setCookie } from 'jsr:@std/http/cookie';
import { AuthService } from '@/services/auth.service.ts';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    console.log('[Login API] Received login request');
    const req = ctx.req;
    // Parse and validate request body (Zod errors automatically handled)
    const { email, password } = await parseJsonBody(req, LoginSchema);
    console.log('[Login API] Login attempt for:', email);

    const authService = new AuthService();

    // Authenticate user (service throws typed errors)
    const loginResult = await authService.login(email, password);

    // Set refresh token as httpOnly cookie
    const headers = new Headers();
    setCookie(headers, "refresh_token", loginResult.refreshToken, {
      httpOnly: true,
      secure: Deno.env.get("DENO_ENV") === "production",
      sameSite: "Lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    // Also set auth_token cookie for server-side middleware (15 minutes expiry)
    setCookie(headers, "auth_token", loginResult.accessToken, {
      httpOnly: false, // Allow client-side access for API calls
      secure: Deno.env.get("DENO_ENV") === "production",
      sameSite: "Lax",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    // Return access token in response
    return new Response(
      JSON.stringify({
        data: {
          accessToken: loginResult.accessToken,
          user: loginResult.user,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...Object.fromEntries(headers.entries()),
        },
      }
    );
  }),
};

