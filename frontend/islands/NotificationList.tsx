/**
 * Notification List Island
 *
 * MIGRATED TO PREACT SIGNALS - uses global state store
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useComputed, useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import {
    accessToken,
    isWsConnected,
    markAllNotificationsAsRead as markAllAsReadGlobal,
    markNotificationAsRead as markAsReadGlobal,
    notifications,
    removeNotification as removeNotificationGlobal,
    unreadCount,
} from '../lib/store.ts';

export default function NotificationList() {
  const isLoading = useSignal(true);
  const filter = useSignal<'all' | 'unread'>('all');

  // Filtered notifications based on current filter
  const filteredNotifications = useComputed(() =>
    filter.value === 'unread'
      ? notifications.value.filter((n) => !n.read)
      : notifications.value
  );

  // Fetch all notifications
  const fetchNotifications = async () => {
    if (!IS_BROWSER) return;

    const token = accessToken.value;
    if (!token) {
      isLoading.value = false;
      return;
    }

    isLoading.value = true;

    try {
      const apiUrl = window.location.origin;

      const response = await fetch(`${apiUrl}/api/notifications?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        notifications.value = data.data?.notifications || [];
        unreadCount.value = data.data?.unreadCount || 0;
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
      const apiUrl = window.location.origin;

      const response = await fetch(
        `${apiUrl}/api/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        markAsReadGlobal(notificationId);
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

    try {
      const apiUrl = window.location.origin;

      const response = await fetch(`${apiUrl}/api/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        markAllAsReadGlobal();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    if (!IS_BROWSER) return;

    const token = accessToken.value;
    if (!token) return;

    try {
      const apiUrl = window.location.origin;

      const response = await fetch(
        `${apiUrl}/api/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        removeNotificationGlobal(notificationId);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  useEffect(() => {
    if (!IS_BROWSER) return;
    fetchNotifications();
  }, []);

  if (!IS_BROWSER) return null;

  // Icon colors based on notification type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-600';
      case 'warning':
        return 'bg-yellow-100 text-yellow-600';
      case 'error':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  // Icon based on notification type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'warning':
        return (
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'error':
        return (
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Format date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  return (
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header with filters */}
  <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            {/* Connection Status */}
            <div class="flex items-center gap-2 text-sm">
              <span
                class={`w-2 h-2 rounded-full ${
                  isWsConnected.value ? 'bg-green-500' : 'bg-gray-400 animate-pulse'
                }`}
              />
              <span class="text-gray-500">
                {isWsConnected.value ? 'Real-time' : 'Reconnecting...'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => filter.value = 'all'}
              class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter.value === 'all'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All ({notifications.value.length})
            </button>
            <button
              type="button"
              onClick={() => filter.value = 'unread'}
              class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter.value === 'unread'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Unread ({unreadCount.value})
            </button>
          </div>

          {unreadCount.value > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              class="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications list */}
  <div class="divide-y divide-gray-200 dark:divide-gray-700">
        {isLoading.value ? (
          <div class="px-6 py-12 text-center">
            <div class="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="mt-4 text-gray-600 dark:text-gray-300">Loading notifications...</p>
          </div>
        ) : filteredNotifications.value.length === 0 ? (
          <div class="px-6 py-12 text-center">
            <svg
              class="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600"
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
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              {filter.value === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              {filter.value === 'unread'
                ? 'All caught up! You have no unread notifications.'
                : 'When you receive notifications, they will appear here.'}
            </p>
          </div>
        ) : (
          filteredNotifications.value.map((notification) => (
            <div
              key={notification.id}
              class={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                !notification.read ? 'bg-blue-50 dark:bg-blue-900' : 'dark:bg-gray-800'
              }`}
            >
              <div class="flex items-start gap-4">
                {/* Icon */}
                <div class={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(notification.type)}`}>
                  {getTypeIcon(notification.type)}
                </div>

                {/* Content */}
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                      <h3 class={`text-base font-medium ${!notification.read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {notification.title}
                      </h3>
                      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {notification.message}
                      </p>
                      <div class="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatDate(notification.createdAt)}</span>
                        {notification.read && notification.readAt && (
                          <span class="flex items-center gap-1">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                            Read
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div class="flex items-center gap-2">
                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(notification.id)}
                          class="p-2 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteNotification(notification.id)}
                        class="p-2 text-gray-400 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Link */}
                  {notification.link && (
                    <a
                      href={notification.link}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                      class="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-400"
                    >
                      View details
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
