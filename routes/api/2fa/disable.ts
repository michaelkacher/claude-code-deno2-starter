/**
 * POST /api/2fa/disable
 * Disable 2FA with password and current code verification
 *
 * REFACTORED: Uses TwoFactorService with new error handling pattern
 */

import { Handlers } from "fresh";
import { z } from "zod";
import { TwoFactorService } from '';

const Disable2FASchema = z.object({
  password: z.string().min(1),
  code: z.string().min(6).max(8),
});

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    const req = ctx.req;
    const user = requireUser(ctx);
    const { password, code } = await parseJsonBody(req, Disable2FASchema);

    const twoFactorService = new TwoFactorService();
    await twoFactorService.disable(user.sub, password, code);

    return successResponse({
      message: "Two-factor authentication disabled successfully",
    });
  }),
};

