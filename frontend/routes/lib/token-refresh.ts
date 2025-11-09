/**
 * Token Refresh Module
 * Automatically refreshes access tokens before they expire
 */

import { Handlers } from "$fresh/server.ts";

// This is served as a JavaScript module
export const handler: Handlers = {
  GET(_req) {
    const script = `
// BroadcastChannel for cross-tab communication
let tokenChannel = null;
let refreshInProgress = false;

// Initialize BroadcastChannel if supported
if (typeof BroadcastChannel !== 'undefined') {
  tokenChannel = new BroadcastChannel('token_refresh');

  // Listen for token refresh events from other tabs
  tokenChannel.addEventListener('message', (event) => {
    if (event.data.type === 'TOKEN_REFRESHED') {
      // Another tab refreshed the token, update our storage
      const { accessToken } = event.data;
      localStorage.setItem('access_token', accessToken);

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      document.cookie = \`auth_token=\${accessToken}; expires=\${expiresAt.toUTCString()}; path=/; SameSite=Lax\`;

      console.debug('Token updated from another tab');
    } else if (event.data.type === 'REFRESH_STARTED') {
      // Another tab started refreshing
      refreshInProgress = true;
    } else if (event.data.type === 'REFRESH_COMPLETED') {
      // Another tab completed refresh
      refreshInProgress = false;
    }
  });
}

/**
 * Refresh the access token using the refresh token
 * Uses BroadcastChannel to coordinate across tabs
 */
export async function refreshAccessToken() {
  // If another tab is already refreshing, wait a bit and check again
  if (refreshInProgress) {
    console.debug('Token refresh already in progress in another tab, waiting...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    // After waiting, the token should be updated by the other tab
    return true;
  }

  try {
    // Notify other tabs that we're starting a refresh
    refreshInProgress = true;
    if (tokenChannel) {
      tokenChannel.postMessage({ type: 'REFRESH_STARTED' });
    }

    const response = await fetch('/api/auth/refresh', {
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

      refreshInProgress = false;
      if (tokenChannel) {
        tokenChannel.postMessage({ type: 'REFRESH_COMPLETED' });
      }
      return false;
    }

    const data = await response.json();
    const newAccessToken = data.data?.access_token || data.accessToken;

    if (!newAccessToken) {
      console.error('No access token in refresh response:', data);
      refreshInProgress = false;
      if (tokenChannel) {
        tokenChannel.postMessage({ type: 'REFRESH_COMPLETED' });
      }
      return false;
    }

    // Store the new access token
    localStorage.setItem('access_token', newAccessToken);

    // Update the cookie (for middleware) - MUST use SameSite=Lax to match login
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    document.cookie = \`auth_token=\${newAccessToken}; expires=\${expiresAt.toUTCString()}; path=/; SameSite=Lax\`;

    console.log('Access token refreshed successfully');

    // Notify other tabs about the new token
    if (tokenChannel) {
      tokenChannel.postMessage({
        type: 'TOKEN_REFRESHED',
        accessToken: newAccessToken
      });
    }

    refreshInProgress = false;
    if (tokenChannel) {
      tokenChannel.postMessage({ type: 'REFRESH_COMPLETED' });
    }

    return true;
  } catch (error) {
    console.error('Token refresh error:', error);
    refreshInProgress = false;
    if (tokenChannel) {
      tokenChannel.postMessage({ type: 'REFRESH_COMPLETED' });
    }
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
 * Refreshes the token every 10 minutes (5 minutes before the 15-minute expiry)
 * Reduces dependency on page visibility and user activity checks
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
        // If token is older than 8 minutes, refresh immediately
        if (tokenAge > 8 * 60 * 1000) {
          console.debug('Token age:', Math.floor(tokenAge / 60000), 'minutes - refreshing');
          refreshAccessToken();
        }
      }
    }
  });

  // Refresh immediately on page load if we have a token that's getting old
  const token = localStorage.getItem('access_token');
  if (token) {
    const tokenAge = getTokenAge(token);
    // Only refresh immediately if token is older than 8 minutes
    if (tokenAge > 8 * 60 * 1000) {
      console.debug('Token age on load:', Math.floor(tokenAge / 60000), 'minutes - refreshing');
      refreshAccessToken();
    }
  }

  // Set up periodic refresh (every 10 minutes for better reliability)
  setInterval(() => {
    const currentToken = localStorage.getItem('access_token');
    if (!currentToken) return;

    // Refresh regardless of visibility or activity to prevent expiration
    // The server-side refresh token is httpOnly and lasts 30 days
    console.debug('Periodic token refresh triggered');
    refreshAccessToken();
  }, 10 * 60 * 1000); // 10 minutes (5 minute buffer before 15 min expiry)
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
