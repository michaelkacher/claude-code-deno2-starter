/**
 * DELETE /api/admin/users/[id]
 * Delete user account
 */

import { Handlers } from "$fresh/server.ts";
import { UserRepository } from "../../../../../../backend/repositories/index.ts";
import {
    errorResponse,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async DELETE(req, ctx) {
    try {
      // Require admin role
      const admin = requireAdmin(ctx);

      const userId = ctx.params.id;

      // Prevent self-deletion
      if (userId === admin.sub) {
        return errorResponse(
          "CANNOT_DELETE_SELF",
          "Cannot delete your own account",
          400
        );
      }

      const userRepo = new UserRepository();

      // Check if user exists
      const user = await userRepo.findById(userId);
      if (!user) {
        return errorResponse("USER_NOT_FOUND", "User not found", 404);
      }

      // Delete user (also removes email index)
      await userRepo.deleteUser(userId);

      return successResponse({
        message: "User deleted successfully",
      });
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("Delete user error:", error);
      return errorResponse("SERVER_ERROR", "Failed to delete user", 500);
    }
  },
};
