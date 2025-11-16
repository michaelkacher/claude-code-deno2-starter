/**
 * POST /api/auth/logout
 * User logout endpoint - revokes refresh token and blacklists access token
 */

import { Handlers } from "fresh";
import { AuthService } from "../../../../shared/services/index.ts";
import {
    deleteCookie,
    getCookie,
    requireUser,
    withErrorHandler,
    type AppState
} from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    const req = ctx.req;
    // Get user from auth middleware (throws AuthenticationError if not authenticated)
    const user = requireUser(ctx);
    const authService = new AuthService();

    // Get refresh token from cookie
    const refreshToken = getCookie(req.headers, "refresh_token");

    // Get access token from header
    const authHeader = req.headers.get("Authorization");
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : undefined;

    // Logout and revoke tokens
    await authService.logout(user.sub, refreshToken, accessToken);

    // Delete refresh token cookie
    const headers = new Headers();
    deleteCookie(headers, "refresh_token");

    return new Response(
      JSON.stringify({
        data: {
          message: "Logged out successfully",
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
