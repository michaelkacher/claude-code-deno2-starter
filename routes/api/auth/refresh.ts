/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 */

import { ErrorCode } from '@/lib/error-codes.ts';
import { AuthenticationError } from '@/lib/errors.ts';
import { successResponse, withErrorHandler, type AppState } from '@/lib/fresh-helpers.ts';
import { AuthService } from '@/services/auth.service.ts';
import type { FreshContext } from "fresh";
import { getCookies } from 'jsr:@std/http/cookie';

export const handler = {
  POST: withErrorHandler(async (ctx: FreshContext<AppState>) => {
    const req = ctx.req;
    // Get refresh token from cookie
    const cookies = getCookies(req.headers);
    const refreshToken = cookies.refresh_token;

    if (!refreshToken) {
      throw new AuthenticationError(ErrorCode.UNAUTHORIZED, "No refresh token provided", 'missing_token');
    }

    const authService = new AuthService();

    // Refresh access token (service throws typed errors)
    const result = await authService.refreshAccessToken(refreshToken);

    return successResponse({
      access_token: result.accessToken,
    });
  }),
};

