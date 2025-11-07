/**
 * POST /api/auth/login
 * User login endpoint
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { createAccessToken, createRefreshToken } from "../../../../backend/lib/jwt.ts";
import { verifyPassword } from "../../../../backend/lib/password.ts";
import { TokenRepository, UserRepository } from "../../../../backend/repositories/index.ts";
import {
    errorResponse,
    parseJsonBody,
    setCookie,
    type AppState
} from "../../../lib/fresh-helpers.ts";

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

      const userRepo = new UserRepository();
      const tokenRepo = new TokenRepository();

      // Find user by email
      const user = await userRepo.findByEmail(email);
      if (!user) {
        return errorResponse("INVALID_CREDENTIALS", "Invalid email or password", 401);
      }

      // Verify password
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return errorResponse("INVALID_CREDENTIALS", "Invalid email or password", 401);
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return errorResponse(
          "EMAIL_NOT_VERIFIED",
          "Please verify your email before logging in",
          403
        );
      }

      // Generate tokens
      const accessToken = await createAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      });

      const refreshTokenId = crypto.randomUUID();
      const refreshToken = await createRefreshToken({
        sub: user.id,
        tokenId: refreshTokenId,
      });

      // Store refresh token
      const expiresAt = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
      await tokenRepo.storeRefreshToken(user.id, refreshTokenId, expiresAt);

      // Set refresh token as httpOnly cookie
      const headers = new Headers();
      setCookie(headers, "refresh_token", refreshToken, {
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
            accessToken: accessToken,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              emailVerified: user.emailVerified,
            },
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
      console.error("Login error:", error);
      return errorResponse("SERVER_ERROR", "Failed to login", 500);
    }
  },
};
