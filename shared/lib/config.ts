/**
 * Shared Configuration
 * Centralized configuration for backend and frontend
 * 
 * To change token timing behavior, modify the values in this file.
 * All time values are in milliseconds for consistency across the codebase.
 */

/**
 * Token Configuration
 * All timing values in milliseconds for consistency
 * 
 * USAGE:
 * - Frontend: frontend/routes/lib/token-refresh.ts, frontend/lib/websocket.ts
 * - Backend: shared/lib/jwt.ts (token creation)
 * - WebSocket: shared/lib/notification-websocket.ts (connection timeout)
 * 
 * To change token refresh behavior:
 * 1. Update the constants below
 * 2. Ensure TOKEN_REFRESH_INTERVAL_MS is less than ACCESS_TOKEN_EXPIRY_MS
 * 3. Ensure TOKEN_REFRESH_CHECK_MS is reasonable for tab wake-up scenarios
 */
export const TokenConfig = {
  /**
   * Access token expiry time: 15 minutes
   * Used by JWT creation and frontend cookie expiry
   */
  ACCESS_TOKEN_EXPIRY_MS: 15 * 60 * 1000,

  /**
   * Refresh token expiry time: 30 days
   * Used by JWT creation for long-lived refresh tokens
   */
  REFRESH_TOKEN_EXPIRY_MS: 30 * 24 * 60 * 60 * 1000,

  /**
   * Token refresh check threshold: 5 minutes
   * When a token is older than this, trigger immediate refresh
   * Used by frontend on visibility change, focus, and page load
   */
  TOKEN_REFRESH_CHECK_MS: 5 * 60 * 1000,

  /**
   * Periodic token refresh interval: 7 minutes
   * Access tokens expire after 15 minutes, so 7 minutes provides an 8-minute buffer
   * This accounts for browser throttling, tab sleeping, and network delays
   */
  TOKEN_REFRESH_INTERVAL_MS: 7 * 60 * 1000,

  /**
   * WebSocket connection timeout: 5 minutes
   * Consider connection dead after this period of inactivity
   */
  WS_CONNECTION_TIMEOUT_MS: 5 * 60 * 1000,

  /**
   * Get access token expiry as string for JWT library (e.g., "15m")
   */
  getAccessTokenExpiry(): string {
    return '15m';
  },

  /**
   * Get refresh token expiry as string for JWT library (e.g., "30d")
   */
  getRefreshTokenExpiry(): string {
    return '30d';
  },
} as const;

/**
 * Export individual constants for convenience
 */
export const {
  ACCESS_TOKEN_EXPIRY_MS,
  TOKEN_REFRESH_CHECK_MS,
  TOKEN_REFRESH_INTERVAL_MS,
  WS_CONNECTION_TIMEOUT_MS,
} = TokenConfig;
