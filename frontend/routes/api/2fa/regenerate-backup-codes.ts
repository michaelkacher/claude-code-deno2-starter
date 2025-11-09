/**
 * POST /api/2fa/regenerate-backup-codes
 * Generate new backup codes (requires password + current code)
 *
 * REFACTORED: Uses TwoFactorService with new error handling pattern
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { TwoFactorService } from "../../../../shared/services/index.ts";
import {
  parseJsonBody,
  requireUser,
  successResponse,
  withErrorHandler,
  type AppState,
} from "../../../lib/fresh-helpers.ts";

const RegenerateCodesSchema = z.object({
  password: z.string().min(1),
  code: z.string().length(6),
});

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (req, ctx) => {
    const user = requireUser(ctx);
    const { password, code } = await parseJsonBody(req, RegenerateCodesSchema);

    const twoFactorService = new TwoFactorService();
    const result = await twoFactorService.regenerateBackupCodes(
      user.sub,
      password,
      code
    );

    return successResponse({
      message: "Backup codes regenerated successfully",
      backupCodes: result.backupCodes,
    });
  }),
};
