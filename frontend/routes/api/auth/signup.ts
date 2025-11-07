/**
 * POST /api/auth/signup
 * User registration endpoint
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { TokenRepository, UserRepository } from "../../../../shared/repositories/index.ts";
import {
    errorResponse,
    parseJsonBody,
    successResponse,
    type AppState,
} from "../../../lib/fresh-helpers.ts";

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      // Parse and validate request body
      const body = await parseJsonBody(req);
      const { email, password, name } = SignupSchema.parse(body);

      const userRepo = new UserRepository();
      const tokenRepo = new TokenRepository();

      // Check if email already exists
      const existingUser = await userRepo.findByEmail(email);
      if (existingUser) {
        return errorResponse("EMAIL_EXISTS", "Email already registered", 409);
      }

      // Create user (password is automatically hashed by repository)
      const user = await userRepo.create({
        email,
        password,
        name,
        role: "user",
        emailVerified: false,
        twoFactorEnabled: false,
      });

      // Generate email verification token
      const verificationToken = crypto.randomUUID();
      const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

      await tokenRepo.storeEmailVerificationToken(
        verificationToken,
        user.id,
        user.email,
        expiresAt
      );

      // TODO: Send verification email
      // await sendVerificationEmail(user.email, verificationToken);

      // Return success (without sensitive data)
      return successResponse(
        {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
          },
          message: "Account created successfully. Please check your email to verify your account.",
        },
        201
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse(
          "VALIDATION_ERROR",
          error.errors[0].message,
          400
        );
      }
      console.error("Signup error:", error);
      return errorResponse("SERVER_ERROR", "Failed to create account", 500);
    }
  },
};
