/**
 * POST /api/2fa/setup
 * Generate TOTP secret and QR code for 2FA setup
 */

import { Handlers } from "$fresh/server.ts";
import { generateQRCodeDataURL, generateQRCodeURL, generateSecret } from "../../../../shared/lib/totp.ts";
import { UserRepository } from "../../../../shared/repositories/index.ts";
import {
    errorResponse,
    requireUser,
    successResponse,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Require authentication
      const user = requireUser(ctx);

      const userRepo = new UserRepository();
      const dbUser = await userRepo.findById(user.sub);

      if (!dbUser) {
        return errorResponse("NOT_FOUND", "User not found", 404);
      }

      if (dbUser.twoFactorEnabled) {
        return errorResponse(
          "ALREADY_ENABLED",
          "Two-factor authentication is already enabled",
          400,
        );
      }

      // Generate new TOTP secret
      const secret = generateSecret();

      // Store secret temporarily (not enabled yet)
      await userRepo.update(user.sub, { twoFactorSecret: secret });

      // Generate QR code
      const issuer = "Deno Fresh App";
      const otpURL = generateQRCodeURL(secret, dbUser.email, issuer);
      const qrCodeURL = generateQRCodeDataURL(otpURL);

      return successResponse({
        secret,
        qrCodeURL,
      });
    } catch (error) {
      if (error.message === "Authentication required") {
        return errorResponse("UNAUTHORIZED", "Authentication required", 401);
      }
      console.error("2FA setup error:", error);
      return errorResponse("SERVER_ERROR", "Failed to setup 2FA", 500);
    }
  },
};
