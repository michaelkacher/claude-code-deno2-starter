/**
 * Rate Limiting Middleware
 * 
 * Protects endpoints from brute force attacks by limiting
 * the number of requests from a single IP address
 */

import { Context, Next } from 'hono';
import { getKv } from './kv.ts';

interface RateLimitOptions {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Maximum requests per window
  keyPrefix?: string;  // Prefix for KV keys
  message?: string;  // Custom error message
}

/**
 * Create a rate limiter middleware
 * @param options Rate limit configuration
 */
export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyPrefix = 'ratelimit',
    message = 'Too many requests, please try again later'
  } = options;

  return async (c: Context, next: Next) => {
    const kv = await getKv();
    
    // Get client IP (works with proxies)
    const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() 
      || c.req.header('x-real-ip')
      || 'unknown';
    
    // Create unique key for this IP and endpoint
    const key = ['ratelimit', keyPrefix, ip];
    
    // Get current request count
    const entry = await kv.get<{ count: number; resetAt: number }>(key);
    const now = Date.now();
    
    if (entry.value) {
      const { count, resetAt } = entry.value;
      
      // Check if window has expired
      if (now > resetAt) {
        // Reset the counter
        await kv.set(key, { count: 1, resetAt: now + windowMs }, {
          expireIn: windowMs
        });
        await next();
        return;
      }
      
      // Check if limit exceeded
      if (count >= maxRequests) {
        const retryAfter = Math.ceil((resetAt - now) / 1000);
        return c.json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message,
            retryAfter
          }
        }, 429, {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(resetAt).toISOString()
        });
      }
      
      // Increment counter
      await kv.set(key, { count: count + 1, resetAt }, {
        expireIn: Math.ceil((resetAt - now) / 1000) * 1000
      });
      
      // Add rate limit headers
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', (maxRequests - count - 1).toString());
      c.header('X-RateLimit-Reset', new Date(resetAt).toISOString());
    } else {
      // First request in window
      await kv.set(key, { count: 1, resetAt: now + windowMs }, {
        expireIn: windowMs
      });
      
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', (maxRequests - 1).toString());
      c.header('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
    }
    
    await next();
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */

// Check if in development mode (more lenient limits)
const isDevelopment = Deno.env.get('DENO_ENV') === 'development';

export const rateLimiters = {
  // Strict limit for auth endpoints (5 attempts per 15 minutes in prod, 50 in dev)
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: isDevelopment ? 50 : 5,
    keyPrefix: 'auth',
    message: 'Too many login attempts. Please try again in 15 minutes.'
  }),
  
  // Moderate limit for signup (3 per hour in prod, 20 in dev)
  signup: createRateLimiter({
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: isDevelopment ? 20 : 3,
    keyPrefix: 'signup',
    message: 'Too many signup attempts. Please try again later.'
  }),
  
  // Lenient limit for general API (100 per 15 minutes in prod, 1000 in dev)
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: isDevelopment ? 1000 : 100,
    keyPrefix: 'api',
    message: 'API rate limit exceeded. Please slow down your requests.'
  }),
  
  // Strict limit for email verification (3 per hour in prod, 20 in dev)
  emailVerification: createRateLimiter({
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: isDevelopment ? 20 : 3,
    keyPrefix: 'email-verification',
    message: 'Too many verification email requests. Please try again later.'
  }),
  
  // Strict limit for password reset (3 per hour in prod, 20 in dev)
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: isDevelopment ? 20 : 3,
    keyPrefix: 'password-reset',
    message: 'Too many password reset requests. Please try again later.'
  })
};
