/**
 * POST /api/2fa/setup
 * Generate TOTP secret and QR code for 2FA setup
 *
 * REFACTORED: Uses TwoFactorService with new error handling pattern
 */

import { Handlers } from "fresh";
import { TwoFactorService } from '@/services/TwoFactorService.ts';

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    const user = requireUser(ctx);
    const twoFactorService = new TwoFactorService();

    const result = await twoFactorService.setup(user.sub);

    return successResponse(result);
  }),
};

