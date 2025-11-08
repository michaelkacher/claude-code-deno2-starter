/**
 * GET /api/auth/csrf-token
 * Get CSRF token for forms (if CSRF protection is enabled)
 */

import { Handlers } from "$fresh/server.ts";
import { successResponse } from "../../../lib/fresh-helpers.ts";

export const handler: Handlers = {
  async GET(req) {
    // Generate a simple CSRF token
    // In production, you might want to store this in a session or use a more robust method
    const csrfToken = crypto.randomUUID();

    return successResponse({ csrfToken });
  },
};
