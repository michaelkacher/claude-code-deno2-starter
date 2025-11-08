/**
 * PATCH /api/admin/users/[id]/role
 * Update user's role
 * 
 * REFACTORED: Uses UserManagementService to eliminate duplicate logic
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { createLogger } from "../../../../../../shared/lib/logger.ts";
import { UserManagementService } from "../../../../../../shared/services/index.ts";
import {
    errorResponse,
    parseJsonBody,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../../lib/fresh-helpers.ts";

const logger = createLogger('AdminUpdateRoleAPI');

const UpdateRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

export const handler: Handlers<unknown, AppState> = {
  async PATCH(req, ctx) {
    try {
      const admin = requireAdmin(ctx);
      const userId = ctx.params.id;

      const body = await parseJsonBody(req);
      const { role } = UpdateRoleSchema.parse(body);

      const userMgmt = new UserManagementService();
      await userMgmt.updateUserRole(userId, role, admin.sub);

      return successResponse({
        message: `User role updated to ${role}`,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Admin access required") {
          return errorResponse("FORBIDDEN", "Admin access required", 403);
        }
        if (error.message === "User not found") {
          return errorResponse("USER_NOT_FOUND", error.message, 404);
        }
        if (error.message.includes("Cannot demote")) {
          return errorResponse("CANNOT_DEMOTE_SELF", error.message, 400);
        }
      }
      if (error instanceof z.ZodError) {
        return errorResponse("VALIDATION_ERROR", error.errors[0].message, 400);
      }
      logger.error("Update role error", { error });
      return errorResponse("SERVER_ERROR", "Failed to update role", 500);
    }
  },
};
