/**
 * GET /api/2fa/status
 * Check if user has 2FA enabled
 *
 * REFACTORED: Uses TwoFactorService with new error handling pattern
 */

import { Handlers } from "fresh";
import { TwoFactorService } from '@/services/TwoFactorService.ts';

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (ctx) => {
    const user = requireUser(ctx);
    const twoFactorService = new TwoFactorService();

    const status = await twoFactorService.getStatus(user.sub);

    return successResponse(status);
  }),
};

