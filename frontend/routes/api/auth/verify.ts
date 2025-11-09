/**
 * GET /api/auth/verify
 * Verify JWT token is valid (used by middleware)
 */

import { Handlers } from "$fresh/server.ts";
import { verifyToken } from "../../../../shared/lib/jwt.ts";
import {
  successResponse,
  withErrorHandler,
  type AppState,
} from "../../../lib/fresh-helpers.ts";
import { AuthenticationError } from "../../../lib/errors.ts";
import { ErrorCode } from "../../../../shared/lib/error-codes.ts";

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (req, _ctx) => {
    // Extract token from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError(ErrorCode.UNAUTHORIZED, "No token provided", 'missing_token');
    }

    const token = authHeader.slice(7);

    // Verify token (throws if invalid)
    const payload = await verifyToken(token);

    return successResponse({
      valid: true,
      userId: payload.sub,
    });
  }),
};
