/**
 * GET /api/auth/csrf-token
 * Get CSRF token for forms (if CSRF protection is enabled)
 */

import { successResponse, withErrorHandler, type AppState } from '@/lib/fresh-helpers.ts';
import { Handlers } from "fresh";

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (ctx) => {
    // Generate a simple CSRF token
    // In production, you might want to store this in a session or use a more robust method
    const csrfToken = crypto.randomUUID();
    
    console.log('[CSRF] Generated token:', csrfToken.substring(0, 8) + '...');

    return successResponse({ csrfToken });
  }),
};