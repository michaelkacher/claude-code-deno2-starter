/**
 * Request Body Size Limit Middleware
 * 
 * Protects against large payload attacks by limiting request body size
 * Prevents denial of service and memory exhaustion
 */

import { Context, Next } from 'hono';

interface BodySizeLimitOptions {
  maxSize: number; // Max size in bytes
  onLimitExceeded?: (c: Context) => Response;
}

/**
 * Create body size limit middleware
 * @param options Configuration options
 */
export function bodyLimit(options: BodySizeLimitOptions) {
  const { maxSize, onLimitExceeded } = options;
  
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header('content-length');
    
    // Check Content-Length header first (fast check)
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      
      if (size > maxSize) {
        if (onLimitExceeded) {
          return onLimitExceeded(c);
        }
        
        return c.json({
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: `Request body too large. Maximum size is ${formatBytes(maxSize)}`,
            maxSize,
          }
        }, 413);
      }
    }
    
    await next();
  };
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Pre-configured body size limits
 */
export const bodySizeLimits = {
  /**
   * JSON API - 1MB limit
   * Reasonable for most API requests
   */
  json: bodyLimit({
    maxSize: 1 * 1024 * 1024, // 1MB
  }),
  
  /**
   * File upload - 10MB limit
   * For image/document uploads
   */
  fileUpload: bodyLimit({
    maxSize: 10 * 1024 * 1024, // 10MB
  }),
  
  /**
   * Strict - 100KB limit
   * For authentication and sensitive endpoints
   */
  strict: bodyLimit({
    maxSize: 100 * 1024, // 100KB
  }),
  
  /**
   * Large - 50MB limit
   * For video or large file uploads
   */
  large: bodyLimit({
    maxSize: 50 * 1024 * 1024, // 50MB
  }),
};
