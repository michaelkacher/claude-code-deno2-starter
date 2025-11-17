/**
 * Client-side token storage utility
 * 
 * Provides a safe abstraction over localStorage for storing authentication tokens.
 * This file is safe to import in islands and client-side code.
 */

/**
 * Client-side token storage utility
 * Provides a safe abstraction over localStorage for storing authentication tokens
 */
export const TokenStorage = {
  /**
   * Get the access token from localStorage
   */
  getAccessToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('access_token');
  },

  /**
   * Set the access token in localStorage
   */
  setAccessToken(token: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('access_token', token);
  },

  /**
   * Remove the access token from localStorage
   */
  removeAccessToken(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('access_token');
  },

  /**
   * Get user email from localStorage
   */
  getUserEmail(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('user_email');
  },

  /**
   * Get user role from localStorage
   */
  getUserRole(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('user_role');
  },

  /**
   * Check if email is verified
   */
  isEmailVerified(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem('email_verified') === 'true';
  },

  /**
   * Set complete user session data
   */
  setUserSession(data: {
    accessToken: string;
    email: string;
    role: string;
    emailVerified: boolean;
  }): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('user_email', data.email);
    localStorage.setItem('user_role', data.role);
    localStorage.setItem('email_verified', String(data.emailVerified));
  },

  /**
   * Clear all authentication data
   */
  clearAuth(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    localStorage.removeItem('email_verified');
  },
};
