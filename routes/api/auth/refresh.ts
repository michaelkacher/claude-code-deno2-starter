/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 */

import { Handlers } from "fresh";
import { ErrorCode } from '@/constants/errors.ts';
import { AuthService } from '@/services/auth.service.ts';

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    const req = ctx.req;
    // Get refresh token from cookie
    const refreshToken = getCookie(req.headers, "refresh_token");

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

