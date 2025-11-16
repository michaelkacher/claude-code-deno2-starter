/**
 * Fresh API Authentication Middleware
 * 
 * Verifies JWT tokens and attaches user to context state
 */

import type { FreshContext } from "fresh";
import { verifyToken } from "../../../shared/lib/jwt.ts";
import { createLogger } from "../../../shared/lib/logger.ts";
import type { AppState } from "../../lib/fresh-helpers.ts";

const logger = createLogger('APIMiddleware');

/**
 * Authentication middleware for Fresh API routes
 * Checks Authorization header and verifies JWT
 */
export async function handler(
  ctx: FreshContext<AppState>
): Promise<Response> {
  const req = ctx.req;
  // Get token from Authorization header
  const authHeader = req.headers.get("Authorization");
  // [API Middleware] Auth header received (value not logged for security)
  
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (!token) {
      logger.error("Token is empty after extraction");
    } else {
      try {
        const payload = await verifyToken(token);
        ctx.state.user = {
          sub: payload.sub as string,
          email: payload.email as string,
          role: payload.role as string,
          emailVerified: payload.emailVerified as boolean,
          iat: payload.iat as number,
          exp: payload.exp as number,
        };
      } catch (error) {
        // Token invalid or expired - continue without user
        // Routes can decide if auth is required
        logger.error("Invalid token", { error: error.message });
      }
    }
  } else {
    // [API Middleware] No Bearer token in Authorization header
  }
  
  // Continue to next handler
  return await ctx.next();
}
