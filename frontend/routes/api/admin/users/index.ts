/**
 * GET /api/admin/users
 * List all users with optional filtering
 */

import { Handlers } from "$fresh/server.ts";
import { UserRepository } from "../../../../../backend/repositories/index.ts";
import {
    errorResponse,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get("limit") || "100");
      const role = url.searchParams.get("role") || undefined;

      const userRepo = new UserRepository();

      // Get users (with in-memory filtering for role if needed)
      const result = await userRepo.listUsers({ limit });
      let users = result.items;

      // Filter by role if specified
      if (role) {
        users = users.filter((u) => u.role === role);
      }

      // Remove sensitive fields
      const sanitizedUsers = users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));

      return successResponse(sanitizedUsers);
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("List users error:", error);
      return errorResponse("SERVER_ERROR", "Failed to list users", 500);
    }
  },
};
