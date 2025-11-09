/**
 * GET /api/auth/csrf-token
 * Get CSRF token for forms (if CSRF protection is enabled)
 */

import { Handlers } from "$fresh/server.ts";
import { successResponse, withErrorHandler, type AppState } from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler((_req, _ctx) => {
    // Generate a simple CSRF token
    // In production, you might want to store this in a session or use a more robust method
    const csrfToken = crypto.randomUUID();

    return successResponse({ csrfToken });
  }),
};
