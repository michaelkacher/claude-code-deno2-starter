/**
 * Token Refresh Module
 * Automatically refreshes access tokens before they expire
 */

import { Handlers } from "$fresh/server.ts";

// This is served as a JavaScript module
export const handler: Handlers = {
  GET(_req) {
    const script = `
/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken() {
  try {
    const response = await fetch('http://localhost:8000/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Include httpOnly refresh token cookie
    });

    if (!response.ok) {
      console.error('Token refresh failed:', response.status);
      // If refresh fails, redirect to login
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('access_token');
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login?reason=session_expired';
      }
      return false;
    }

    const data = await response.json();
    
    // Store the new access token
    localStorage.setItem('access_token', data.accessToken);
    
    // Update the cookie (for middleware)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    document.cookie = \`auth_token=\${data.accessToken}; expires=\${expiresAt.toUTCString()}; path=/; SameSite=Strict\`;
    
    console.log('Access token refreshed successfully');
    return true;
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
}

/**
 * Decode JWT to get token age (without verification)
 */
function getTokenAge(token) {
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
 * Refreshes the token every 13 minutes (2 minutes before the 15-minute expiry)
 * Only refreshes when page is visible and user is active
 */
export function setupAutoRefresh() {
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

  // Refresh immediately on page load if we have a token
  const token = localStorage.getItem('access_token');
  if (token) {
    refreshAccessToken();
  }

  // Set up periodic refresh (every 13 minutes)
  setInterval(() => {
    const currentToken = localStorage.getItem('access_token');
    if (!currentToken) return;

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

    refreshAccessToken();
  }, 13 * 60 * 1000); // 13 minutes
}

// Auto-initialize if this script is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setupAutoRefresh();
  });
}
`;

    return new Response(script, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
      },
    });
  },
};
