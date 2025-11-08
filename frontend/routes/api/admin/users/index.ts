/**
 * GET /api/admin/users
 * List all users with optional filtering
 * 
 * REFACTORED: Uses UserManagementService to eliminate duplicate logic
 */

import { Handlers } from "$fresh/server.ts";
import { UserManagementService } from "../../../../../shared/services/index.ts";
import {
    errorResponse,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    try {
      requireAdmin(ctx);

      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get("limit") || "100");
      const role = url.searchParams.get("role") as "user" | "admin" | undefined;

      const userMgmt = new UserManagementService();
      const result = await userMgmt.listUsers({ limit, role });

      console.log('[Admin Users API] Returning users:', result.users.length);

      return successResponse(result);
    } catch (error) {
      if (error instanceof Error && error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("List users error:", error);
      return errorResponse("SERVER_ERROR", "Failed to list users", 500);
    }
  },
};
