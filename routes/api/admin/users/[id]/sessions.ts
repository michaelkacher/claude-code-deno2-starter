/**
 * DELETE /api/admin/users/[id]/sessions
 * Revoke all user's refresh tokens (logout all devices)
 *
 * REFACTORED: Uses UserManagementService and withErrorHandler pattern
 */

import { BadRequestError } from "@/lib/errors.ts";
import {
  requireAdmin,
  successResponse,
  withErrorHandler,
  type AppState,
} from "@/lib/fresh-helpers.ts";
import { UserManagementService } from "@/services/index.ts";
import { Handlers } from "fresh";

export const handler: Handlers<unknown, AppState> = {
  DELETE: withErrorHandler(async (ctx) => {
    // Require admin access (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    const userId = ctx.params["id"];
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const userMgmt = new UserManagementService();

    // Revoke sessions (service throws typed errors)
    await userMgmt.revokeAllUserSessions(userId);

    return successResponse({
      message: "All user sessions revoked successfully",
    });
  }),
};
