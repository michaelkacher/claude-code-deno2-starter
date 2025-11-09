/**
 * Notification Bell Island
 * Real-time notifications dropdown
 *
 * MIGRATED TO PREACT SIGNALS - uses global state store
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import {
  accessToken,
  isWsConnected,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  notifications,
  removeNotification,
  unreadCount
} from '../lib/store.ts';

export default function NotificationBell() {
  // Local UI state
  const isOpen = useSignal(false);
  const isLoading = useSignal(false);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!IS_BROWSER) return;

    const token = accessToken.value;
    if (!token) return;

    isLoading.value = true;

    try {
      const response = await fetch(`/api/notifications?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        notifications.value = data.notifications || [];
        unreadCount.value = data.unreadCount || 0;
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      isLoading.value = false;
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!IS_BROWSER) return;

    const token = accessToken.value;
    if (!token) return;

    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        // Update global state
        markNotificationAsRead(notificationId);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!IS_BROWSER) return;

    const token = accessToken.value;
    if (!token) return;

    isLoading.value = true;

    try {
      const response = await fetch(`/api/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        // Update global state
        markAllNotificationsAsRead();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      isLoading.value = false;
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    if (!IS_BROWSER) return;

    const token = accessToken.value;
    if (!token) return;

    try {
      const response = await fetch(
        `/api/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        // Update global state
        removeNotification(notificationId);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen.value && IS_BROWSER) {
      fetchNotifications();
    }
  }, [isOpen.value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!IS_BROWSER) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-dropdown')) {
        isOpen.value = false;
      }
    };

    if (isOpen.value) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen.value]);

  // Don't render on server
  if (!IS_BROWSER) return null;

  // Don't render if user is not logged in
  if (!accessToken.value) return null;

  // Icon colors based on notification type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  // Icon based on notification type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div class="notification-dropdown relative">
      {/* Bell Icon with Badge */}
      <button
        type="button"
        onClick={() => isOpen.value = !isOpen.value}
        class="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
        aria-label="Notifications"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* WebSocket Connection Status Indicator */}
        <span
          class={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
            isWsConnected.value ? 'bg-green-500' : 'bg-gray-400 animate-pulse'
          }`}
          title={isWsConnected.value ? 'Connected (Real-time)' : 'Reconnecting...'}
        />

        {/* Unread Count Badge */}
        {unreadCount.value > 0 && (
          <span class="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount.value > 9 ? '9+' : unreadCount.value}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen.value && (
        <div class="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
            {notifications.value.length > 0 && unreadCount.value > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={isLoading.value}
                class="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div class="max-h-96 overflow-y-auto">
            {notifications.value.length === 0 ? (
              <div class="px-4 py-8 text-center text-gray-500">
                <svg
                  class="w-12 h-12 mx-auto mb-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.value.map((notification) => (
                <div
                  key={notification.id}
                  class={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div class="flex items-start gap-3">
                    {/* Type Icon */}
                    <div
                      class={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(
                        notification.type
                      )} bg-opacity-10`}
                    >
                      <span class={`text-lg ${getTypeColor(notification.type)}`}>
                        {getTypeIcon(notification.type)}
                      </span>
                    </div>

                    {/* Content */}
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-2">
                        <h4
                          class={`text-sm font-medium ${
                            !notification.read
                              ? 'text-gray-900'
                              : 'text-gray-700'
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => deleteNotification(notification.id)}
                          class="text-gray-400 hover:text-gray-600 flex-shrink-0"
                          aria-label="Delete notification"
                        >
                          <svg
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <p class="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div class="flex items-center justify-between mt-2">
                        <span class="text-xs text-gray-500">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification.id)}
                            class="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                      {notification.link && (
                        <a
                          href={notification.link}
                          class="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                          onClick={() => {
                            markAsRead(notification.id);
                            isOpen.value = false;
                          }}
                        >
                          View details →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.value.length > 0 && (
            <div class="px-4 py-3 border-t border-gray-200 text-center">
              <a
                href="/notifications"
                class="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => isOpen.value = false}
              >
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
