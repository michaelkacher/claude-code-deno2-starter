/**
 * GET /api/auth/verify
 * Verify JWT token is valid (used by middleware)
 */

import { Handlers } from "$fresh/server.ts";
import { verifyToken } from "../../../../shared/lib/jwt.ts";
import {
    errorResponse,
    successResponse,
} from "../../../lib/fresh-helpers.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return errorResponse("UNAUTHORIZED", "No token provided", 401);
      }

      const token = authHeader.slice(7);

      // Verify token (this will throw if invalid)
      const payload = await verifyToken(token);

      return successResponse({
        valid: true,
        userId: payload.sub,
      });
    } catch (error) {
      return errorResponse("UNAUTHORIZED", "Invalid token", 401);
    }
  },
};
