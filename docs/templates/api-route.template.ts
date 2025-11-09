/**
 * API Route Template with Error Handling
 *
 * This template demonstrates the standard pattern for API routes
 * using the new error handling standardization.
 *
 * Instructions:
 * 1. Copy to frontend/routes/api/[your-path]/[file].ts
 * 2. Replace placeholders: [Resource], [resource]
 * 3. Implement business logic
 * 4. Add validation schema if needed
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod"; // If validation needed
import {
  successResponse,
  withErrorHandler,
  requireUser,      // For authenticated routes
  requireAdmin,     // For admin-only routes
  parseJsonBody,    // For POST/PUT/PATCH with validation
  type AppState,
} from "../../../lib/fresh-helpers.ts";
import {
  NotFoundError,
  BadRequestError,
  // Other error types as needed:
  // ValidationError, ConflictError, AuthorizationError
} from "../../../lib/errors.ts";
// Import your service or repository
// import { [Resource]Service } from "../../../../shared/services/index.ts";

// Optional: Zod validation schema
const Create[Resource]Schema = z.object({
  name: z.string().min(1).max(100),
  // Add other fields
});

/**
 * Example: Simple GET endpoint
 */
export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (_req, ctx) => {
    // For authenticated routes
    const user = requireUser(ctx);

    // For admin-only routes
    // const admin = requireAdmin(ctx);

    // Get data from service/repository
    // const service = new [Resource]Service();
    // const data = await service.list();

    const data = { message: "Hello World" };

    return successResponse(data);
  }),
};

/**
 * Example: POST endpoint with validation
 */
/*
export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (req, ctx) => {
    // Require authentication
    const user = requireUser(ctx);

    // Parse and validate request body (Zod errors automatically handled)
    const body = await parseJsonBody(req, Create[Resource]Schema);

    // Business logic - throw typed errors
    const service = new [Resource]Service();
    const result = await service.create(body);

    return successResponse(result, 201);
  }),
};
*/

/**
 * Example: Route with dynamic parameter [id]
 */
/*
export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (_req, ctx) => {
    // Require authentication
    const user = requireUser(ctx);

    // Validate route parameter
    const resourceId = ctx.params.id;
    if (!resourceId) {
      throw new BadRequestError("[Resource] ID is required");
    }

    // Get resource
    const service = new [Resource]Service();
    const resource = await service.findById(resourceId);

    // Check if exists
    if (!resource) {
      throw new NotFoundError(undefined, '[Resource]', resourceId);
    }

    // Authorization check (optional)
    if (resource.ownerId !== user.sub) {
      throw new AuthorizationError("You can only access your own [resources]");
    }

    return successResponse(resource);
  }),

  DELETE: withErrorHandler(async (_req, ctx) => {
    // Require admin
    const admin = requireAdmin(ctx);

    // Validate route parameter
    const resourceId = ctx.params.id;
    if (!resourceId) {
      throw new BadRequestError("[Resource] ID is required");
    }

    // Delete resource (service throws NotFoundError if not exists)
    const service = new [Resource]Service();
    await service.delete(resourceId);

    return successResponse({ message: "[Resource] deleted" });
  }),
};
*/

/**
 * Example: PATCH/PUT endpoint
 */
/*
const Update[Resource]Schema = z.object({
  name: z.string().min(1).max(100).optional(),
  // Add other fields
});

export const handler: Handlers<unknown, AppState> = {
  PATCH: withErrorHandler(async (req, ctx) => {
    const user = requireUser(ctx);

    const resourceId = ctx.params.id;
    if (!resourceId) {
      throw new BadRequestError("[Resource] ID is required");
    }

    // Parse and validate
    const updates = await parseJsonBody(req, Update[Resource]Schema);

    // Update
    const service = new [Resource]Service();
    const updated = await service.update(resourceId, updates);

    return successResponse(updated);
  }),
};
*/

/**
 * Example: Route with cookie handling (login/logout)
 */
/*
import { setCookie, deleteCookie } from "../../../lib/fresh-helpers.ts";

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (req, _ctx) => {
    const { email, password } = await parseJsonBody(req, LoginSchema);

    const authService = new AuthService();
    const result = await authService.login(email, password);

    // Set cookie
    const headers = new Headers();
    setCookie(headers, "refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: Deno.env.get("DENO_ENV") === "production",
      sameSite: "Lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    // Return response with cookie
    return new Response(
      JSON.stringify({ data: result }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...Object.fromEntries(headers.entries()),
        },
      }
    );
  }),
};
*/

/**
 * Key Points:
 *
 * 1. ALWAYS use withErrorHandler() wrapper
 * 2. ALWAYS throw typed errors (NotFoundError, BadRequestError, etc.)
 * 3. NEVER use try-catch blocks
 * 4. NEVER call errorResponse() directly
 * 5. Let services throw their own typed errors
 * 6. Zod validation errors are automatically handled
 * 7. Use requireUser() or requireAdmin() for auth (they throw automatically)
 * 8. Prefix unused parameters with underscore (_req, _ctx)
 */
