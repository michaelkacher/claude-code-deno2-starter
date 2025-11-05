/**
 * Cache Control Middleware
 * Adds appropriate Cache-Control headers to API responses
 */

import { Context, Next } from 'hono';

export interface CacheOptions {
  /**
   * Cache duration in seconds
   */
  maxAge: number;
  
  /**
   * Whether the response can be cached by CDNs/proxies (public) or only by browsers (private)
   */
  visibility?: 'public' | 'private';
  
  /**
   * Whether to require revalidation with the server before using cached response
   */
  mustRevalidate?: boolean;
  
  /**
   * Whether to allow stale responses while revalidating in background
   */
  staleWhileRevalidate?: number;
}

/**
 * Create cache control middleware with specified options
 */
export function cacheControl(options: CacheOptions) {
  return async (c: Context, next: Next) => {
    await next();
    
    // Only add cache headers to successful responses
    if (c.res.status >= 200 && c.res.status < 300) {
      const directives: string[] = [];
      
      // Visibility
      directives.push(options.visibility || 'private');
      
      // Max age
      directives.push(`max-age=${options.maxAge}`);
      
      // Revalidation
      if (options.mustRevalidate) {
        directives.push('must-revalidate');
      }
      
      // Stale while revalidate
      if (options.staleWhileRevalidate) {
        directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
      }
      
      c.header('Cache-Control', directives.join(', '));
    }
  };
}

/**
 * Prevent caching for sensitive endpoints
 */
export function noCache() {
  return async (c: Context, next: Next) => {
    await next();
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
  };
}

/**
 * Preset cache strategies
 */
export const cacheStrategies = {
  /**
   * Static content that rarely changes (OpenAPI spec, docs)
   * Cache for 1 hour
   */
  static: () => cacheControl({
    maxAge: 3600,
    visibility: 'public',
    staleWhileRevalidate: 86400, // Allow stale for 1 day while revalidating
  }),
  
  /**
   * User-specific data (profile, notifications)
   * Cache for 5 minutes, must revalidate
   */
  userProfile: () => cacheControl({
    maxAge: 300,
    visibility: 'private',
    mustRevalidate: true,
  }),
  
  /**
   * Admin data that changes occasionally (user lists, stats)
   * Cache for 30 seconds
   */
  adminData: () => cacheControl({
    maxAge: 30,
    visibility: 'private',
    mustRevalidate: true,
  }),
  
  /**
   * Frequently changing data (job status, realtime updates)
   * Cache for 10 seconds
   */
  dynamic: () => cacheControl({
    maxAge: 10,
    visibility: 'private',
  }),
  
  /**
   * Sensitive operations (auth, mutations)
   * Never cache
   */
  noCache,
};
