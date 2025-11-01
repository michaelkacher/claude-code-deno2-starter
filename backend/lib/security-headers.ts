/**
 * Security Headers Middleware
 * 
 * Implements security best practices through HTTP headers:
 * - Content Security Policy (CSP)
 * - X-Frame-Options (clickjacking protection)
 * - X-Content-Type-Options (MIME sniffing protection)
 * - Strict-Transport-Security (HTTPS enforcement)
 * - X-XSS-Protection (legacy XSS protection)
 * - Referrer-Policy (privacy)
 * - Permissions-Policy (browser feature access)
 */

import { Context, Next } from 'hono';
import { env } from '../config/env.ts';

interface SecurityHeadersOptions {
  contentSecurityPolicy?: string | false;
  strictTransportSecurity?: string | false;
  xFrameOptions?: string | false;
  xContentTypeOptions?: boolean;
  xXssProtection?: string | false;
  referrerPolicy?: string | false;
  permissionsPolicy?: string | false;
}

/**
 * Default Content Security Policy
 * Restrictive by default, allows same-origin and specific CDNs
 */
const DEFAULT_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net", // Note: unsafe-* needed for Fresh/Preact, jsdelivr for API docs
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://cdn.jsdelivr.net",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

/**
 * Development CSP - more permissive for hot reload
 */
const DEV_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' ws: wss: https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' ws: wss: https://cdn.jsdelivr.net",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
].join('; ');

/**
 * Create security headers middleware
 */
export function securityHeaders(options: SecurityHeadersOptions = {}) {
  const isDev = env.DENO_ENV === 'development';
  
  // Default options with environment-aware CSP
  const config: Required<SecurityHeadersOptions> = {
    contentSecurityPolicy: options.contentSecurityPolicy !== undefined 
      ? options.contentSecurityPolicy 
      : (isDev ? DEV_CSP : DEFAULT_CSP),
    strictTransportSecurity: options.strictTransportSecurity !== undefined
      ? options.strictTransportSecurity
      : (isDev ? false : 'max-age=31536000; includeSubDomains'),
    xFrameOptions: options.xFrameOptions !== undefined
      ? options.xFrameOptions
      : 'DENY',
    xContentTypeOptions: options.xContentTypeOptions !== undefined
      ? options.xContentTypeOptions
      : true,
    xXssProtection: options.xXssProtection !== undefined
      ? options.xXssProtection
      : '1; mode=block',
    referrerPolicy: options.referrerPolicy !== undefined
      ? options.referrerPolicy
      : 'strict-origin-when-cross-origin',
    permissionsPolicy: options.permissionsPolicy !== undefined
      ? options.permissionsPolicy
      : 'camera=(), microphone=(), geolocation=()',
  };

  return async (c: Context, next: Next) => {
    await next();
    
    // Content-Security-Policy
    if (config.contentSecurityPolicy) {
      c.header('Content-Security-Policy', config.contentSecurityPolicy);
    }
    
    // Strict-Transport-Security (HSTS) - only in production with HTTPS
    if (config.strictTransportSecurity && !isDev) {
      c.header('Strict-Transport-Security', config.strictTransportSecurity);
    }
    
    // X-Frame-Options (clickjacking protection)
    if (config.xFrameOptions) {
      c.header('X-Frame-Options', config.xFrameOptions);
    }
    
    // X-Content-Type-Options (MIME sniffing protection)
    if (config.xContentTypeOptions) {
      c.header('X-Content-Type-Options', 'nosniff');
    }
    
    // X-XSS-Protection (legacy XSS protection for older browsers)
    if (config.xXssProtection) {
      c.header('X-XSS-Protection', config.xXssProtection);
    }
    
    // Referrer-Policy (privacy)
    if (config.referrerPolicy) {
      c.header('Referrer-Policy', config.referrerPolicy);
    }
    
    // Permissions-Policy (browser feature access)
    if (config.permissionsPolicy) {
      c.header('Permissions-Policy', config.permissionsPolicy);
    }
    
    // Remove server identification
    c.header('X-Powered-By', '');
  };
}

/**
 * Pre-configured security header sets
 */
export const securityHeaderPresets = {
  /**
   * Strict security - maximum protection
   * Use for production APIs with no frontend
   */
  strict: securityHeaders({
    contentSecurityPolicy: "default-src 'none'; frame-ancestors 'none'",
    strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    xContentTypeOptions: true,
    xXssProtection: '1; mode=block',
    referrerPolicy: 'no-referrer',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=()',
  }),
  
  /**
   * Balanced security - reasonable defaults for most apps
   * Allows same-origin resources and common CDNs
   */
  balanced: securityHeaders(), // Uses defaults
  
  /**
   * Relaxed security - for development or less sensitive apps
   * More permissive CSP, no HSTS
   */
  relaxed: securityHeaders({
    contentSecurityPolicy: DEV_CSP,
    strictTransportSecurity: false,
    xFrameOptions: 'SAMEORIGIN',
    xContentTypeOptions: true,
    xXssProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: false,
  }),
};
