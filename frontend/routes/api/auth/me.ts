/**
 * GET /api/auth/me
 * Get current authenticated user
 */

import { Handlers } from "$fresh/server.ts";
import { UserRepository } from "../../../../shared/repositories/index.ts";
import {
  requireUser,
  successResponse,
  withErrorHandler,
  type AppState,
} from "../../../lib/fresh-helpers.ts";
import { NotFoundError } from "../../../lib/errors.ts";

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (_req, ctx) => {
    // Get user from auth middleware (throws AuthenticationError if not authenticated)
    const authUser = requireUser(ctx);
    const userRepo = new UserRepository();

    // Fetch full user data from database
    const user = await userRepo.findById(authUser.sub);

    if (!user) {
      throw new NotFoundError(undefined, 'User', authUser.sub);
    }

    // Return user data (without sensitive fields)
    return successResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }),
};
