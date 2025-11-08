/**
 * Fresh API Helpers
 * 
 * Utilities for Fresh API route handlers with consistent patterns
 */

import type { FreshContext } from "$fresh/server.ts";

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
 */
export function requireUser(ctx: FreshContext<AppState>): AuthUser {
  const user = ctx.state.user;
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Check if user has admin role
 */
export function requireAdmin(ctx: FreshContext<AppState>): AuthUser {
  const user = requireUser(ctx);
  if (user.role !== "admin") {
    throw new Error("Admin access required");
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
