/**
 * POST /api/admin/users/[id]/verify-email
 * Admin-initiated email verification
 *
 * REFACTORED: Uses UserManagementService and withErrorHandler pattern
 */

import { Handlers } from "fresh";
import { UserManagementService } from "../../../../../../shared/services/index.ts";
import { BadRequestError } from "../../../../../lib/errors.ts";
import {
    requireAdmin,
    successResponse,
    withErrorHandler,
    type AppState,
} from "../../../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    // Require admin access (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    const userId = ctx.params["id"];
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const userMgmt = new UserManagementService();

    // Verify email (throws NotFoundError if not found, ValidationError if already verified)
    await userMgmt.verifyUserEmail(userId);

    return successResponse({
      message: "User email verified successfully",
    });
  }),
};
