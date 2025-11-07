/**
 * PATCH /api/admin/users/[id]/role
 * Update user's role
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { UserRepository } from "../../../../../../backend/repositories/index.ts";
import {
    errorResponse,
    parseJsonBody,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../../lib/fresh-helpers.ts";

const UpdateRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

export const handler: Handlers<unknown, AppState> = {
  async PATCH(req, ctx) {
    try {
      // Require admin role
      const admin = requireAdmin(ctx);

      const userId = ctx.params.id;
      const body = await parseJsonBody(req);
      const { role } = UpdateRoleSchema.parse(body);

      // Prevent self-demotion
      if (userId === admin.sub && role === "user") {
        return errorResponse(
          "CANNOT_DEMOTE_SELF",
          "Cannot demote yourself from admin",
          400
        );
      }

      const userRepo = new UserRepository();

      // Check if user exists
      const user = await userRepo.findById(userId);
      if (!user) {
        return errorResponse("USER_NOT_FOUND", "User not found", 404);
      }

      // Update role
      await userRepo.update(userId, { role });

      return successResponse({
        message: `User role updated to ${role}`,
      });
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      if (error instanceof z.ZodError) {
        return errorResponse("VALIDATION_ERROR", error.errors[0].message, 400);
      }
      console.error("Update role error:", error);
      return errorResponse("SERVER_ERROR", "Failed to update role", 500);
    }
  },
};
