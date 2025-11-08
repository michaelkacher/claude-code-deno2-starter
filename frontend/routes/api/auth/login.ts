/**
 * POST /api/auth/login
 * User login endpoint
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { createLogger } from '../../../../shared/lib/logger.ts';
import { AuthService } from "../../../../shared/services/index.ts";
import {
  errorResponse,
  parseJsonBody,
  setCookie,
  type AppState
} from "../../../lib/fresh-helpers.ts";

const logger = createLogger('LoginAPI');

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Parse and validate request body
      const body = await parseJsonBody(req);
      const { email, password } = LoginSchema.parse(body);

      const authService = new AuthService();

      // Authenticate user
      let loginResult;
      try {
        loginResult = await authService.login(email, password);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "INVALID_CREDENTIALS") {
            return errorResponse("INVALID_CREDENTIALS", "Invalid email or password", 401);
          }
          if (error.message === "EMAIL_NOT_VERIFIED") {
            return errorResponse(
              "EMAIL_NOT_VERIFIED",
              "Please verify your email before logging in",
              403
            );
          }
        }
        throw error;
      }

      // Set refresh token as httpOnly cookie
      const headers = new Headers();
      setCookie(headers, "refresh_token", loginResult.refreshToken, {
        httpOnly: true,
        secure: Deno.env.get("DENO_ENV") === "production",
        sameSite: "Lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });

      // Return access token in response
      return new Response(
        JSON.stringify({
          data: {
            accessToken: loginResult.accessToken,
            user: loginResult.user,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...Object.fromEntries(headers.entries()),
          },
        }
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse(
          "VALIDATION_ERROR",
          error.errors[0].message,
          400
        );
      }
      logger.error("Login error", { error });
      return errorResponse("SERVER_ERROR", "Failed to log in", 500);
    }
  },
};
