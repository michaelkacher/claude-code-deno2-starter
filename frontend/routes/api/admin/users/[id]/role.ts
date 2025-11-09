/**
 * PATCH /api/admin/users/[id]/role
 * Update user's role
 *
 * REFACTORED: Uses UserManagementService and withErrorHandler pattern
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { UserManagementService } from "../../../../../../shared/services/index.ts";
import { BadRequestError } from "../../../../../lib/errors.ts";
import {
    parseJsonBody,
    requireAdmin,
    successResponse,
    withErrorHandler,
    type AppState,
} from "../../../../../lib/fresh-helpers.ts";

const UpdateRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

export const handler: Handlers<unknown, AppState> = {
  PATCH: withErrorHandler(async (req, ctx) => {
    // Require admin access (throws AuthorizationError if not admin)
    const admin = requireAdmin(ctx);
    const userId = ctx.params["id"];
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    // Parse and validate request body (Zod errors automatically handled)
    const { role } = await parseJsonBody(req, UpdateRoleSchema);

    const userMgmt = new UserManagementService();
    // Update role (throws NotFoundError if not found, ValidationError if self-demotion)
    await userMgmt.updateUserRole(userId, role, admin.sub);

    return successResponse({
      message: `User role updated to ${role}`,
    });
  }),
};
