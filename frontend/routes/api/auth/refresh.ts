/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 */

import { Handlers } from "$fresh/server.ts";
import { createLogger } from '../../../../shared/lib/logger.ts';
import { AuthService } from "../../../../shared/services/index.ts";
import {
    errorResponse,
    getCookie,
    successResponse,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const logger = createLogger('RefreshTokenAPI');

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Get refresh token from cookie
      const refreshToken = getCookie(req.headers, "refresh_token");
      
      if (!refreshToken) {
        return errorResponse("NO_REFRESH_TOKEN", "No refresh token provided", 401);
      }

      const authService = new AuthService();

      // Refresh access token
      let result;
      try {
        result = await authService.refreshAccessToken(refreshToken);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "INVALID_TOKEN") {
            return errorResponse("INVALID_TOKEN", "Invalid or expired refresh token", 401);
          }
          if (error.message === "TOKEN_REVOKED") {
            return errorResponse("TOKEN_REVOKED", "Refresh token has been revoked", 401);
          }
          if (error.message === "USER_NOT_FOUND") {
            return errorResponse("USER_NOT_FOUND", "User not found", 404);
          }
        }
        throw error;
      }

      return successResponse({
        access_token: result.accessToken,
      });
    } catch (error) {
      logger.error("Token refresh error", { error });
      return errorResponse("SERVER_ERROR", "Failed to refresh token", 500);
    }
  },
};
