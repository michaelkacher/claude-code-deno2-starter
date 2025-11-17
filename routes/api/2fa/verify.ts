/**
 * POST /api/2fa/verify
 * Verify TOTP or backup code during login
 *
 * REFACTORED: Uses TwoFactorService with new error handling pattern
 */

import { Handlers } from "fresh";
import { z } from "zod";
import { TwoFactorService } from '';

const Verify2FASchema = z.object({
  code: z.string().min(6).max(8),
});

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    const req = ctx.req;
    const user = requireUser(ctx);
    const { code } = await parseJsonBody(req, Verify2FASchema);

    const twoFactorService = new TwoFactorService();
    const result = await twoFactorService.verify(user.sub, code);

    if (!result.isValid) {
      throw new ValidationError("Invalid verification code", { code: ["Invalid verification code"] });
    }

    return successResponse({
      message: "2FA verification successful",
      remainingBackupCodes: result.remainingBackupCodes,
    });
  }),
};

