/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 */

import { Handlers } from "$fresh/server.ts";
import { createAccessToken, verifyToken } from "../../../../shared/lib/jwt.ts";
import { TokenRepository, UserRepository } from "../../../../shared/repositories/index.ts";
import {
    errorResponse,
    getCookie,
    successResponse,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Get refresh token from cookie
      const refreshToken = getCookie(req.headers, "refresh_token");
      
      if (!refreshToken) {
        return errorResponse("NO_REFRESH_TOKEN", "No refresh token provided", 401);
      }

      // Verify refresh token
      let payload;
      try {
        payload = await verifyToken(refreshToken);
      } catch {
        return errorResponse("INVALID_TOKEN", "Invalid or expired refresh token", 401);
      }

      const userId = payload.sub;
      const tokenId = payload.tokenId as string;

      const userRepo = new UserRepository();
      const tokenRepo = new TokenRepository();

      // Verify refresh token exists in database
      const isValid = await tokenRepo.verifyRefreshToken(userId, tokenId);
      if (!isValid) {
        return errorResponse("TOKEN_REVOKED", "Refresh token has been revoked", 401);
      }

      // Get user data
      const user = await userRepo.findById(userId);
      if (!user) {
        return errorResponse("USER_NOT_FOUND", "User not found", 404);
      }

      // Generate new access token
      const accessToken = await createAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      });

      return successResponse({
        access_token: accessToken,
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      return errorResponse("SERVER_ERROR", "Failed to refresh token", 500);
    }
  },
};
