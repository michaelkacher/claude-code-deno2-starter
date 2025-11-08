/**
 * GET /api/admin/users
 * List all users with optional filtering
 * 
 * REFACTORED: Uses UserManagementService to eliminate duplicate logic
 */

import { Handlers } from "$fresh/server.ts";
import { createLogger } from "../../../../../shared/lib/logger.ts";
import { UserManagementService } from "../../../../../shared/services/index.ts";
import {
    errorResponse,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../lib/fresh-helpers.ts";

const logger = createLogger('AdminListUsersAPI');

export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    try {
      requireAdmin(ctx);

      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get("limit") || "100");
      const role = url.searchParams.get("role") as "user" | "admin" | undefined;

      const userMgmt = new UserManagementService();
      const result = await userMgmt.listUsers({ limit, role });

      logger.debug('Listed users', { count: result.users.length });

      return successResponse(result);
    } catch (error) {
      if (error instanceof Error && error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      logger.error("List users error", { error });
      return errorResponse("SERVER_ERROR", "Failed to list users", 500);
    }
  },
};
