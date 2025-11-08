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
      document.cookie = \`auth_token=\${accessToken}; expires=\${expiresAt.toUTCString()}; path=/; SameSite=Strict\`;

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

    // Update the cookie (for middleware)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    document.cookie = \`auth_token=\${newAccessToken}; expires=\${expiresAt.toUTCString()}; path=/; SameSite=Strict\`;

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

  // Refresh immediately on page load if we have a token that's getting old
  const token = localStorage.getItem('access_token');
  if (token) {
    const tokenAge = getTokenAge(token);
    // Only refresh immediately if token is older than 10 minutes
    if (tokenAge > 10 * 60 * 1000) {
      console.debug('Token age on load:', Math.floor(tokenAge / 60000), 'minutes - refreshing');
      refreshAccessToken();
    }
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
