/**
 * GET /api/auth/me
 * Get current authenticated user
 */

import { Handlers } from "fresh";
import { UserRepository } from '@/repositories/index.ts";
import { NotFoundError } from "../../../lib/errors.ts";
import {
    requireUser,
    successResponse,
    withErrorHandler,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (ctx) => {
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

