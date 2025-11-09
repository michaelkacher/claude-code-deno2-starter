/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 */

import { Handlers } from "$fresh/server.ts";
import { AuthService } from "../../../../shared/services/index.ts";
import {
  getCookie,
  successResponse,
  withErrorHandler,
  type AppState,
} from "../../../lib/fresh-helpers.ts";
import { AuthenticationError } from "../../../lib/errors.ts";
import { ErrorCode } from "../../../../shared/lib/error-codes.ts";

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (req, _ctx) => {
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
