/**
 * Token Refresh Utility
 * 
 * Automatically refreshes access tokens before they expire
 * Uses refresh token stored in httpOnly cookie
 */

/**
 * Refresh the access token using the refresh token
 * @returns New access token or null if refresh failed
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const apiUrl = typeof window !== 'undefined'
      ? window.location.origin.replace(':3000', ':8000')
      : 'http://localhost:8000';
    
    const response = await fetch(`${apiUrl}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Include httpOnly cookie with refresh token
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.data.accessToken;

    // Update localStorage
    localStorage.setItem('access_token', newAccessToken);

    // Update cookie for server-side auth check (15 minutes expiry)
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 15);
    document.cookie = `auth_token=${newAccessToken}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;

    return newAccessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}

/**
 * Decode JWT to get expiration time (without verification)
 */
function getTokenAge(token: string): number {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return Infinity;
    
    const payload = JSON.parse(atob(parts[1]));
    const issued = payload.iat * 1000; // Convert to milliseconds
    return Date.now() - issued;
  } catch {
    return Infinity;
  }
}

/**
 * Setup automatic token refresh
 * Refreshes token 2 minutes before it expires (15min - 2min = 13min)
 * Only refreshes when page is visible and user is active
 */
export function setupAutoRefresh() {
  if (typeof window === 'undefined') return;

  let lastActivity = Date.now();
  let isPageVisible = !document.hidden;

  // Track user activity
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(eventType => {
    document.addEventListener(eventType, () => {
      lastActivity = Date.now();
    }, { passive: true });
  });

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    
    if (isPageVisible) {
      // Page became visible - check if we need immediate refresh
      const token = localStorage.getItem('access_token');
      if (token) {
        const tokenAge = getTokenAge(token);
        // If token is older than 12 minutes, refresh immediately
        if (tokenAge > 12 * 60 * 1000) {
          console.debug('Token age:', Math.floor(tokenAge / 60000), 'minutes - refreshing');
          refreshAccessToken();
        }
      }
    }
  });

  // Refresh every 13 minutes (2 minutes before 15min expiry)
  const refreshInterval = 13 * 60 * 1000;

  const intervalId = setInterval(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      clearInterval(intervalId);
      return;
    }

    // Only refresh if page is visible AND user was active in last 5 minutes
    const timeSinceActivity = Date.now() - lastActivity;
    const isUserActive = timeSinceActivity < 5 * 60 * 1000;

    if (!isPageVisible) {
      console.debug('Token refresh skipped - page not visible');
      return;
    }

    if (!isUserActive) {
      console.debug('Token refresh skipped - user inactive for', Math.floor(timeSinceActivity / 60000), 'minutes');
      return;
    }

    const newToken = await refreshAccessToken();
    if (!newToken) {
      // Refresh failed, user needs to log in again
      clearInterval(intervalId);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_role');
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
      window.location.href = '/login?reason=expired';
    }
  }, refreshInterval);

  // Also refresh on page load if token exists
  const token = localStorage.getItem('access_token');
  if (token) {
    refreshAccessToken();
  }

  return intervalId;
}
