/**
 * POST /api/auth/logout
 * User logout endpoint - revokes refresh token and blacklists access token
 */

import { Handlers } from "$fresh/server.ts";
import { verifyToken } from "../../../../backend/lib/jwt.ts";
import { TokenRepository } from "../../../../backend/repositories/index.ts";
import {
    deleteCookie,
    errorResponse,
    getCookie,
    requireUser,
    type AppState
} from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Get user from auth middleware
      const user = requireUser(ctx);
      const tokenRepo = new TokenRepository();

      // Get refresh token from cookie
      const refreshToken = getCookie(req.headers, "refresh_token");
      
      if (refreshToken) {
        try {
          const refreshPayload = await verifyToken(refreshToken);
          const tokenId = refreshPayload.tokenId as string;
          
          // Revoke refresh token
          await tokenRepo.revokeRefreshToken(user.sub, tokenId);
        } catch {
          // Refresh token invalid or expired - ignore
        }
      }

      // Blacklist access token
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const accessToken = authHeader.substring(7);
        try {
          const accessPayload = await verifyToken(accessToken);
          const tokenId = accessPayload.jti as string;
          const expiresAt = accessPayload.exp;
          
          await tokenRepo.blacklistToken(tokenId, user.sub, expiresAt);
        } catch {
          // Access token invalid - ignore
        }
      }

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
    } catch (error) {
      if (error.message === "Unauthorized") {
        return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
      }
      console.error("Logout error:", error);
      return errorResponse("SERVER_ERROR", "Failed to logout", 500);
    }
  },
};
