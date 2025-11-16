/**
 * POST /api/2fa/enable
 * Enable 2FA after verifying TOTP code
 *
 * REFACTORED: Uses TwoFactorService with new error handling pattern
 */

import { Handlers } from "fresh";
import { z } from "zod";
import { TwoFactorService } from "../../../../shared/services/index.ts";
import {
    parseJsonBody,
    requireUser,
    successResponse,
    withErrorHandler,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const Enable2FASchema = z.object({
  code: z.string().length(6),
});

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    const req = ctx.req;
    const user = requireUser(ctx);
    const { code } = await parseJsonBody(req, Enable2FASchema);

    const twoFactorService = new TwoFactorService();
    const result = await twoFactorService.enable(user.sub, code);

    return successResponse({
      message: "Two-factor authentication enabled successfully",
      backupCodes: result.backupCodes,
    });
  }),
};
