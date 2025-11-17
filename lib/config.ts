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

/**
 * Site Configuration
 */
export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  external?: boolean;
  adminOnly?: boolean;
  requiresAuth?: boolean;
}

export interface SiteConfig {
  site: {
    name: string;
    description: string;
    url: string;
    logo?: string;
  };
  navigation: {
    primary: NavigationItem[];
    mobile: NavigationItem[];
    footer?: NavigationItem[];
  };
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };
  features: {
    enableNotifications: boolean;
    enableTwoFactor: boolean;
    enableFileUpload: boolean;
    enableAdminPanel: boolean;
    enableDarkMode: boolean;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  social?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    discord?: string;
  };
}

export const siteConfig: SiteConfig = {
  site: {
    name: "Deno 2 Starter",
    description: "A modern full-stack web application starter",
    url: "http://localhost:5173",
  },
  navigation: {
    primary: [
      { label: "Home", href: "/", icon: "🏠" },
      { label: "Admin", href: "/admin", icon: "⚙️", adminOnly: true, requiresAuth: true },
    ],
    mobile: [
      { label: "Home", href: "/", icon: "🏠" },
      { label: "Admin", href: "/admin", icon: "⚙️", adminOnly: true, requiresAuth: true },
    ],
  },
  theme: {
    primary: "#2563eb",
    secondary: "#64748b",
    accent: "#7c3aed",
    background: "#ffffff",
    surface: "#f8fafc",
  },
  features: {
    enableNotifications: true,
    enableTwoFactor: true,
    enableFileUpload: true,
    enableAdminPanel: true,
    enableDarkMode: true,
  },
  api: {
    baseUrl: "/api",
    timeout: 10000,
    retries: 3,
  },
};

// Helper functions for accessing config
export const getSiteName = () => siteConfig.site.name;
export const getSiteUrl = () => siteConfig.site.url;
export const getNavigationItems = () => siteConfig.navigation.primary;
export const getMobileNavigationItems = () => siteConfig.navigation.mobile;
export const getTheme = () => siteConfig.theme;
export const getFeatures = () => siteConfig.features;
export const getApiConfig = () => siteConfig.api;
