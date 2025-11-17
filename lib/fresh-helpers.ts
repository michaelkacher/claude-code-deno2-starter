/**
 * Fresh API Helpers
 *
 * Utilities for Fresh API route handlers with consistent patterns
 */

import type { FreshContext } from "fresh";
import { ZodError } from "zod";
import { ErrorCode, ErrorMessages, ErrorStatusCodes } from '@/lib/error-codes.ts";
import { createLogger } from '@/lib/logger.ts";
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
} from "./errors.ts";

const logger = createLogger('APIHandler');

/**
 * Standardized API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Standardized API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  meta?: Record<string, unknown>;
}

/**
 * User data from auth middleware
 */
export interface AuthUser {
  sub: string;
  email: string;
  role: string;
  emailVerified: boolean;
  iat: number;
  exp: number;
}

/**
 * Fresh context state with auth user
 */
export interface AppState {
  user?: AuthUser;
  token?: string;
  userEmail?: string | null;
  userRole?: string | null;
  initialTheme?: string | null;
}

/**
 * Create success JSON response
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  meta?: Record<string, unknown>
): Response {
  const response: ApiResponse<T> = { data };
  if (meta) response.meta = meta;
  
  return new Response(JSON.stringify(response), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Create error JSON response
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown
): Response {
  const response: ApiResponse<never> = {
    error: { code, message, details },
  };
  
  return new Response(JSON.stringify(response), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Parse JSON body with error handling and optional Zod validation
 */
export async function parseJsonBody<T>(
  req: Request,
  schema?: { parse: (data: unknown) => T }
): Promise<T> {
  try {
    const data = await req.json();
    if (schema) {
      return schema.parse(data);
    }
    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      throw error;
    }
    throw new Error("Invalid JSON body");
  }
}

/**
 * Get user from context (requires auth middleware)
 * @throws AuthenticationError if user not authenticated
 */
export function requireUser(ctx: FreshContext<AppState>): AuthUser {
  const user = ctx.state.user;
  if (!user) {
    throw new AuthenticationError(ErrorCode.UNAUTHORIZED, undefined, 'missing_token');
  }
  return user;
}

/**
 * Check if user has admin role
 * @throws AuthenticationError if user not authenticated
 * @throws AuthorizationError if user is not an admin
 */
export function requireAdmin(ctx: FreshContext<AppState>): AuthUser {
  const user = requireUser(ctx);
  if (user.role !== "admin") {
    throw new AuthorizationError(
      'Admin access required',
      'admin',
      user.role
    );
  }
  return user;
}

/**
 * Extract query parameters
 */
export function getQueryParams(url: URL): Record<string, string> {
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

/**
 * Set cookie helper
 */
export function setCookie(
  headers: Headers,
  name: string,
  value: string,
  options: {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
    path?: string;
  } = {}
): void {
  const cookieParts = [`${name}=${value}`];
  
  if (options.maxAge) cookieParts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) cookieParts.push("HttpOnly");
  if (options.secure) cookieParts.push("Secure");
  if (options.sameSite) cookieParts.push(`SameSite=${options.sameSite}`);
  if (options.path) cookieParts.push(`Path=${options.path}`);
  
  headers.append("Set-Cookie", cookieParts.join("; "));
}

/**
 * Get cookie helper
 */
export function getCookie(headers: Headers, name: string): string | undefined {
  const cookies = headers.get("Cookie");
  if (!cookies) return undefined;
  
  const cookie = cookies.split(";").find((c) => c.trim().startsWith(`${name}=`));
  return cookie?.split("=")[1];
}

/**
 * Delete cookie helper
 */
export function deleteCookie(headers: Headers, name: string, path: string = "/"): void {
  headers.append(
    "Set-Cookie",
    `${name}=; Max-Age=0; Path=${path}; HttpOnly; SameSite=Lax`
  );
}

/**
 * Centralized Error Handler
 * Converts any error to a standardized API error response
 */
export function handleError(error: unknown): Response {
  // Handle AppError (our custom error classes)
  if (error instanceof AppError) {
    logger.error('Application error', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      context: error.context,
    });

    return errorResponse(
      error.code,
      error.message,
      error.statusCode,
      error instanceof ValidationError ? error.fields : undefined
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!fields[path]) {
        fields[path] = [];
      }
      fields[path]!.push(err.message);
    });

    logger.error('Validation error', { fields });

    return errorResponse(
      ErrorCode.VALIDATION_ERROR,
      ErrorMessages[ErrorCode.VALIDATION_ERROR],
      ErrorStatusCodes[ErrorCode.VALIDATION_ERROR],
      fields
    );
  }

  // Handle standard Error objects (unexpected errors)
  if (error instanceof Error) {
    logger.error('Unexpected error', {
      message: error.message,
      stack: error.stack,
    });

    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      ErrorMessages[ErrorCode.INTERNAL_ERROR],
      ErrorStatusCodes[ErrorCode.INTERNAL_ERROR]
    );
  }

  // Handle unknown errors
  logger.error('Unknown error', { error: String(error) });

  return errorResponse(
    ErrorCode.INTERNAL_ERROR,
    ErrorMessages[ErrorCode.INTERNAL_ERROR],
    ErrorStatusCodes[ErrorCode.INTERNAL_ERROR]
  );
}

/**
 * Higher-order function to wrap API handlers with error handling
 *
 * Usage:
 * ```typescript
 * export const handler: Handlers = {
 *   POST: withErrorHandler(async (req, ctx) => {
 *     // Your handler logic - just throw errors, they'll be caught and formatted
 *     const user = requireUser(ctx);
 *     const data = await parseJsonBody(req, LoginSchema);
 *     return successResponse({ ... });
 *   })
 * };
 * ```
 */
export function withErrorHandler<T extends AppState>(
  handler: (ctx: FreshContext<T>) => Promise<Response> | Response
) {
  return async (ctx: FreshContext<T>): Promise<Response> => {
    try {
      return await handler(ctx);
    } catch (error) {
      return handleError(error);
    }
  };
}

