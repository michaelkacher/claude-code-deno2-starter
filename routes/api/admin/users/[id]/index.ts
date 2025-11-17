/**
 * DELETE /api/admin/users/[id]
 * Delete user account
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
  DELETE: withErrorHandler(async (ctx) => {
    // Require admin access (throws AuthorizationError if not admin)
    const admin = requireAdmin(ctx);
    const userId = ctx.params["id"];
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const userMgmt = new UserManagementService();
    // Delete user (throws NotFoundError if not found, ValidationError if self-delete)
    await userMgmt.deleteUser(userId, admin.sub);

    return successResponse({
      message: "User deleted successfully",
    });
  }),
};
