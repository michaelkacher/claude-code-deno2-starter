/**
 * GET /api/admin/users/[id]
 * Get detailed user information
 *
 * REFACTORED: Uses UserManagementService and withErrorHandler pattern
 */

import { Handlers } from "fresh";
import { UserManagementService } from "../../../../../shared/services/index.ts";
import { BadRequestError } from "../../../../lib/errors.ts";
import {
    requireAdmin,
    successResponse,
    withErrorHandler,
    type AppState,
} from "../../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (ctx) => {
    // Require admin access (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    const userId = ctx.params["id"];
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const userMgmt = new UserManagementService();

    // Get user details (throws NotFoundError if user not found)
    const user = await userMgmt.getUserDetails(userId);

    return successResponse(user);
  }),
};
