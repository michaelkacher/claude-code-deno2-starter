/**
 * GET /api/auth/verify
 * Verify JWT token is valid (used by middleware)
 */

import { ErrorCode } from '@/constants/errors.ts';
import { AuthenticationError } from '@/lib/errors.ts';
import { successResponse, withErrorHandler, type AppState } from '@/lib/fresh-helpers.ts';
import { verifyToken } from '@/lib/jwt.ts';
import { Handlers } from "fresh";

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (ctx) => {
    const req = ctx.req;
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

