/**
 * JWT Token Verification Utilities for Frontend
 * 
 * Provides client-side token validation by checking:
 * - Token structure
 * - Token expiration
 * - Token signature (by calling backend)
 */

/**
 * Decode JWT payload without verification
 * Used for checking expiration client-side
 */
export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    // Replace URL-safe characters
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') {
    return true;
  }
  
  // exp is in seconds, Date.now() is in milliseconds
  return payload.exp * 1000 < Date.now();
}

/**
 * Verify token with backend
 * This ensures the token is valid and hasn't been revoked
 */
export async function verifyTokenWithBackend(token: string): Promise<boolean> {
  try {
    const apiUrl = typeof window !== 'undefined'
      ? window.location.origin.replace(':3000', ':8000')
      : 'http://localhost:8000';
    
    const response = await fetch(`${apiUrl}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}

/**
 * Validate token structure
 */
export function isValidJwtStructure(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}
