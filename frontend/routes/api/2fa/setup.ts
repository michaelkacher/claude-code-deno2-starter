/**
 * POST /api/2fa/setup
 * Generate TOTP secret and QR code for 2FA setup
 *
 * REFACTORED: Uses TwoFactorService with new error handling pattern
 */

import { Handlers } from "$fresh/server.ts";
import { TwoFactorService } from "../../../../shared/services/index.ts";
import {
    requireUser,
    successResponse,
    withErrorHandler,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (_req, ctx) => {
    const user = requireUser(ctx);
    const twoFactorService = new TwoFactorService();

    const result = await twoFactorService.setup(user.sub);

    return successResponse(result);
  }),
};
