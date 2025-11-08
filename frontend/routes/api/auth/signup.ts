/**
 * POST /api/auth/signup
 * User registration endpoint
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { AuthService } from "../../../../shared/services/index.ts";
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

      const authService = new AuthService();

      // Create user account
      let signupResult;
      try {
        signupResult = await authService.signup(email, password, name);
      } catch (error) {
        if (error instanceof Error && error.message === "EMAIL_EXISTS") {
          return errorResponse("EMAIL_EXISTS", "Email already registered", 409);
        }
        throw error;
      }

      // TODO: Send verification email
      // await sendVerificationEmail(signupResult.user.email, signupResult.verificationToken);

      // Return success (without sensitive data)
      return successResponse(
        {
          user: signupResult.user,
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
