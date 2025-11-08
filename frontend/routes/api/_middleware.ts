/**
 * Fresh API Authentication Middleware
 * 
 * Verifies JWT tokens and attaches user to context state
 */

import type { FreshContext } from "$fresh/server.ts";
import { verifyToken } from "../../../shared/lib/jwt.ts";
import type { AppState } from "../../lib/fresh-helpers.ts";

/**
 * Authentication middleware for Fresh API routes
 * Checks Authorization header and verifies JWT
 */
export async function handler(
  req: Request,
  ctx: FreshContext<AppState>
): Promise<Response> {
  // Get token from Authorization header
  const authHeader = req.headers.get("Authorization");
  console.log("🔍 [API Middleware] Auth header:", authHeader ? `"${authHeader.substring(0, 30)}..."` : "null");
  
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    console.log("🔐 [API Middleware] Extracted token:", token ? `"${token.substring(0, 20)}..."` : "undefined/empty");
    
    if (!token) {
      console.error("❌ [API Middleware] Token is empty after extraction");
    } else {
      try {
        const payload = await verifyToken(token);
        console.log("✅ [API Middleware] Token valid, user:", payload.sub, payload.email);
        
        // Attach user to context state
        ctx.state.user = {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
          emailVerified: payload.emailVerified,
          iat: payload.iat,
          exp: payload.exp,
        };
      } catch (error) {
        // Token invalid or expired - continue without user
        // Routes can decide if auth is required
        console.error("❌ [API Middleware] Invalid token:", error.message);
      }
    }
  } else {
    console.log("⚠️ [API Middleware] No Bearer token in Authorization header");
  }
  
  // Continue to next handler
  return await ctx.next();
}
