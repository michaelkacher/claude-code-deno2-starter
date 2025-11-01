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
 * Setup automatic token refresh
 * Refreshes the token every 13 minutes (2 minutes before the 15-minute expiry)
 */
export function setupAutoRefresh() {
  // Refresh immediately on page load if we have a token
  const token = localStorage.getItem('access_token');
  if (token) {
    refreshAccessToken();
  }

  // Set up periodic refresh (every 13 minutes)
  setInterval(() => {
    const currentToken = localStorage.getItem('access_token');
    if (currentToken) {
      refreshAccessToken();
    }
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
