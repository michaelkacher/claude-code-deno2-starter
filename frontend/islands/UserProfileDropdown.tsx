/**
 * User Profile Dropdown Island
 * Integrates user authentication, notifications, and profile management
 *
 * MIGRATED TO PREACT SIGNALS - uses global state store
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useComputed, useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import { isTokenExpired } from '../lib/jwt.ts';
import { TokenStorage } from '../lib/storage.ts';
import {
  accessToken,
  clearAuth,
  isWsConnected,
  markNotificationAsRead,
  notifications,
  setAccessToken,
  setUser,
  unreadCount,
  user
} from '../lib/store.ts';
import { cleanupWebSocket } from '../lib/websocket.ts';

interface UserProfileDropdownProps {
  initialEmail?: string | null;
  initialRole?: string | null;
}

export default function UserProfileDropdown({ initialEmail, initialRole }: UserProfileDropdownProps) {
  // Local UI state (only for dropdown open/close and loading states)
  const isDropdownOpen = useSignal(false);
  const isNotificationsLoading = useSignal(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tokenCheckIntervalRef = useRef<number | null>(null);

  // Initialize user from props if not already set
  useEffect(() => {
    if (!IS_BROWSER) return;

    // If we have initial props but no user in store, set it
    if ((initialEmail || initialRole) && !user.value) {
      setUser({
        email: initialEmail || '',
        role: initialRole || 'user',
      });
    }

    // Get token from cookie (source of truth for middleware)
    const cookieToken = document.cookie
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('auth_token='))
      ?.split('=')[1];

    // Sync cookie token to localStorage and store
    if (cookieToken) {
      setAccessToken(cookieToken);
      TokenStorage.setAccessToken(cookieToken);
    } else {
      // If no cookie token but we have localStorage token, check if it's valid
      const storedToken = TokenStorage.getAccessToken();
      if (storedToken && !accessToken.value) {
        setAccessToken(storedToken);
      }
    }
  }, []);

  // Auto-logout when token expires
  const handleTokenExpiry = () => {
    if (!IS_BROWSER) return;

    console.log('🔒 [Auth] Token expired, logging out automatically');

    // Clean up WebSocket connections
    cleanupWebSocket();

    // Clear all auth data
    TokenStorage.clearAuth();
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict';

    // Clear global state
    clearAuth();

    // Redirect to login with reason
    window.location.href = '/login?reason=expired';
  };

  // Check authentication status and setup periodic token check
  useEffect(() => {
    if (!IS_BROWSER) return;

    const token = accessToken.value;

    // If user is authenticated, check token validity
    if (token && user.value) {
      // Only do client-side expiry check if we don't have server-validated props
      // If initialEmail or initialRole exists, the middleware already validated the token
      const middlewareValidated = !!(initialEmail || initialRole);
      
      // Check if token is already expired (only if not middleware-validated)
      if (!middlewareValidated && isTokenExpired(token)) {
        console.log('🔒 [Auth] Token already expired on mount');
        handleTokenExpiry();
        return;
      }

      // Fetch initial notifications
      fetchNotifications();

      // Set up periodic token expiry check (every 30 seconds)
      tokenCheckIntervalRef.current = setInterval(() => {
        const currentToken = accessToken.value;
        if (!currentToken || isTokenExpired(currentToken)) {
          handleTokenExpiry();
          // Clear the interval
          if (tokenCheckIntervalRef.current) {
            clearInterval(tokenCheckIntervalRef.current);
            tokenCheckIntervalRef.current = null;
          }
        }
      }, 30000); // Check every 30 seconds
    }

    // Cleanup on unmount
    return () => {
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
        tokenCheckIntervalRef.current = null;
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!IS_BROWSER) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        isDropdownOpen.value = false;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!IS_BROWSER) return;

    const token = accessToken.value;
    if (!token || !user.value) {
      return;
    }

    // Check if token is expired before making request
    if (isTokenExpired(token)) {
      console.log('🔒 [Auth] Token expired, skipping notification fetch');
      handleTokenExpiry();
      return;
    }

    // Don't show loading state if we already have notifications (prevents flicker on re-fetch)
    const shouldShowLoading = notifications.value.length === 0;
    if (shouldShowLoading) {
      isNotificationsLoading.value = true;
    }

    try {
      const response = await fetch(`/api/notifications?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        notifications.value = data.data?.notifications || [];
        unreadCount.value = data.data?.unreadCount || 0;
      } else if (response.status === 401) {
        console.log('🔒 [Auth] 401 response from notifications API, token invalid');
        handleLogout();
      } else {
        console.error('Error fetching notifications:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      if (shouldShowLoading) {
        isNotificationsLoading.value = false;
      }
    }
  };

  // Mark notification as read (using global store function)
  const markAsRead = async (notificationId: string) => {
    if (!IS_BROWSER) return;

    const token = accessToken.value;
    if (!token || !user.value) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        // Update global state
        markNotificationAsRead(notificationId);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (!IS_BROWSER) return;

    // Clean up WebSocket connections immediately
    cleanupWebSocket();

    try {
      await fetch(`/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear auth data
    TokenStorage.clearAuth();

    // Clear cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';

    // Clear global state
    clearAuth();

    // Redirect to home
    window.location.href = '/';
  };

  // Format time ago
  const timeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Computed display email
  const displayEmail = useComputed(() => user.value?.email || initialEmail || '');

  // Not logged in - show login button
  if (!displayEmail.value) {
    // On client, double-check localStorage before showing login button
    if (IS_BROWSER && TokenStorage.getUserEmail()) {
      // We have stored email, but state hasn't updated yet - show loading
      return (
        <div class="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
      );
    }

    return (
      <a
        href="/login"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Login
      </a>
    );
  }

  // Logged in - show profile dropdown
  return (
    <div class="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        type="button"
        onClick={() => isDropdownOpen.value = !isDropdownOpen.value}
  class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {/* Avatar with notification indicator */}
        <div class="relative">
          <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {displayEmail.value.charAt(0).toUpperCase()}
          </div>
          {/* Notification Badge - automatically shows/hides based on signal */}
          {unreadCount.value > 0 && (
            <div class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span class="text-xs text-white font-medium">
                {unreadCount.value > 9 ? '9+' : unreadCount.value}
              </span>
            </div>
          )}
          {/* Connection indicator - reactive to global signal */}
          {isWsConnected.value && (
            <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          )}
        </div>

        {/* Dropdown Arrow */}
        <svg
          class={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen.value ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen.value && (
  <div class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* User Info Header */}
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {displayEmail.value.charAt(0).toUpperCase()}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{displayEmail.value}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.value?.role || initialRole || 'user'}</p>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
              {unreadCount.value > 0 && (
                <span class="text-xs text-blue-600 dark:text-blue-300 font-medium">{unreadCount.value} unread</span>
              )}
            </div>

            {isNotificationsLoading.value ? (
              <div class="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} class="h-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
                ))}
              </div>
            ) : notifications.value.length > 0 ? (
              <div class="space-y-2 max-h-48 overflow-y-auto">
                {notifications.value.map((notification) => (
                  <div
                    key={notification.id}
                    class={`p-2 rounded cursor-pointer transition-colors ${
                      notification.read
                        ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                        : 'bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800 border-l-2 border-blue-500 dark:border-blue-400'
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      if (notification.link) {
                        isDropdownOpen.value = false;
                        window.location.href = notification.link;
                      }
                    }}
                  >
                    <div class="flex justify-between items-start">
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                          {notification.title}
                        </p>
                        <p class="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {notification.message}
                        </p>
                      </div>
                      <span class="text-xs text-gray-400 dark:text-gray-300 ml-2">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p class="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No notifications</p>
            )}

            {notifications.value.length > 0 && (
              <a
                href="/notifications"
                onClick={() => isDropdownOpen.value = false}
                class="block text-center text-xs text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-400 mt-2 py-1"
              >
                View all notifications
              </a>
            )}
          </div>

          {/* Actions */}
          <div class="px-4 py-3">
            <div class="space-y-1">
              {user.value?.role === 'admin' && (
                <a
                  href="/admin/users"
                  onClick={() => isDropdownOpen.value = false}
                  class="block w-full text-left px-3 py-2 text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900 rounded transition-colors"
                >
                  🛠️ Admin Panel
                </a>
              )}
              <a
                href="/profile"
                onClick={() => isDropdownOpen.value = false}
                class="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
              >
                👤 Profile Settings
              </a>
              <button
                type="button"
                onClick={handleLogout}
                class="block w-full text-left px-3 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
