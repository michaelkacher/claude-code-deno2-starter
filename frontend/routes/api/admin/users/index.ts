/**
 * GET /api/admin/users
 * List all users with optional filtering
 *
 * REFACTORED: Uses UserManagementService and withErrorHandler pattern
 */

import { Handlers } from "fresh";
import { createLogger } from "../../../../../shared/lib/logger.ts";
import { UserManagementService } from "../../../../../shared/services/index.ts";
import {
    requireAdmin,
    successResponse,
    withErrorHandler,
    type AppState,
} from "../../../../lib/fresh-helpers.ts";

const logger = createLogger('AdminListUsersAPI');

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (ctx) => {
    const req = ctx.req;
    // Require admin access (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const roleParam = url.searchParams.get("role");
    const role = roleParam === "user" || roleParam === "admin" ? roleParam : undefined;

    const userMgmt = new UserManagementService();
    const result = await userMgmt.listUsers({ limit, ...(role && { role }) });

    logger.debug('Listed users', { count: result.users.length });

    return successResponse(result);
  }),
};
