/**
 * Storage Service
 * 
 * Provides a consistent, type-safe abstraction over browser localStorage
 * with error handling, SSR safety, and easy testability.
 * 
 * Benefits:
 * - Single source of truth for storage keys
 * - Consistent error handling
 * - SSR-safe (checks for browser environment)
 * - Easy to mock in tests
 * - Easy to migrate to different storage (cookies, IndexedDB, etc.)
 * 
 * @example
 * ```typescript
 * import { TokenStorage } from '../lib/storage.ts';
 * 
 * // Type-safe accessors
 * const token = TokenStorage.getAccessToken();
 * TokenStorage.setAccessToken('abc123');
 * TokenStorage.clearAuth();
 * ```
 */

/**
 * Base storage service with error handling and SSR safety
 */
export class StorageService {
  /**
   * Check if localStorage is available (browser environment and not disabled)
   */
  private static isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get item from localStorage
   * Returns null if key doesn't exist or storage is unavailable
   */
  static get(key: string): string | null {
    if (!this.isAvailable()) return null;
    
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Storage get error for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set item in localStorage
   * Returns true on success, false on error
   */
  static set(key: string, value: string): boolean {
    if (!this.isAvailable()) return false;
    
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Storage set error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   * Returns true on success, false on error
   */
  static remove(key: string): boolean {
    if (!this.isAvailable()) return false;
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Storage remove error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all items from localStorage
   * Returns true on success, false on error
   */
  static clear(): boolean {
    if (!this.isAvailable()) return false;
    
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  /**
   * Check if a key exists in localStorage
   */
  static has(key: string): boolean {
    return this.get(key) !== null;
  }
}

/**
 * Storage keys used by the application
 * Centralized to avoid typos and enable refactoring
 */
export const StorageKeys = {
  ACCESS_TOKEN: 'access_token',
  USER_EMAIL: 'user_email',
  USER_ROLE: 'user_role',
  EMAIL_VERIFIED: 'email_verified',
  THEME: 'theme',
} as const;

/**
 * Type-safe storage for authentication tokens and user data
 */
export const TokenStorage = {
  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return StorageService.get(StorageKeys.ACCESS_TOKEN);
  },

  /**
   * Set access token
   */
  setAccessToken(token: string): boolean {
    return StorageService.set(StorageKeys.ACCESS_TOKEN, token);
  },

  /**
   * Remove access token
   */
  removeAccessToken(): boolean {
    return StorageService.remove(StorageKeys.ACCESS_TOKEN);
  },

  /**
   * Check if user has a valid access token
   */
  hasAccessToken(): boolean {
    return StorageService.has(StorageKeys.ACCESS_TOKEN);
  },

  /**
   * Get user email
   */
  getUserEmail(): string | null {
    return StorageService.get(StorageKeys.USER_EMAIL);
  },

  /**
   * Set user email
   */
  setUserEmail(email: string): boolean {
    return StorageService.set(StorageKeys.USER_EMAIL, email);
  },

  /**
   * Get user role
   */
  getUserRole(): string | null {
    return StorageService.get(StorageKeys.USER_ROLE);
  },

  /**
   * Set user role
   */
  setUserRole(role: string): boolean {
    return StorageService.set(StorageKeys.USER_ROLE, role);
  },

  /**
   * Get email verification status
   */
  isEmailVerified(): boolean {
    return StorageService.get(StorageKeys.EMAIL_VERIFIED) === 'true';
  },

  /**
   * Set email verification status
   */
  setEmailVerified(verified: boolean): boolean {
    return StorageService.set(StorageKeys.EMAIL_VERIFIED, verified ? 'true' : 'false');
  },

  /**
   * Save complete user session data
   */
  setUserSession(data: {
    accessToken: string;
    email: string;
    role: string;
    emailVerified: boolean;
  }): boolean {
    const results = [
      this.setAccessToken(data.accessToken),
      this.setUserEmail(data.email),
      this.setUserRole(data.role),
      this.setEmailVerified(data.emailVerified),
    ];
    
    // Return true only if all operations succeeded
    return results.every(result => result === true);
  },

  /**
   * Clear all authentication data
   * Use this on logout
   */
  clearAuth(): boolean {
    const results = [
      StorageService.remove(StorageKeys.ACCESS_TOKEN),
      StorageService.remove(StorageKeys.USER_EMAIL),
      StorageService.remove(StorageKeys.USER_ROLE),
      StorageService.remove(StorageKeys.EMAIL_VERIFIED),
    ];
    
    // Return true only if all operations succeeded
    return results.every(result => result === true);
  },
};

/**
 * Type-safe storage for theme preferences
 */
export const ThemeStorage = {
  /**
   * Get current theme
   */
  getTheme(): 'light' | 'dark' | null {
    const theme = StorageService.get(StorageKeys.THEME);
    if (theme === 'light' || theme === 'dark') {
      return theme;
    }
    return null;
  },

  /**
   * Set theme (saves to both localStorage and cookie for SSR)
   */
  setTheme(theme: 'light' | 'dark'): boolean {
    const success = StorageService.set(StorageKeys.THEME, theme);
    // Also save to cookie so server can read it for SSR
    if (success && typeof document !== 'undefined') {
      document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
    }
    return success;
  },

  /**
   * Remove theme preference (use system default)
   */
  clearTheme(): boolean {
    const success = StorageService.remove(StorageKeys.THEME);
    // Also clear cookie
    if (success && typeof document !== 'undefined') {
      document.cookie = 'theme=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
    }
    return success;
  },
};
