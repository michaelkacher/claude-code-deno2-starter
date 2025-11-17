/**
 * Notification List Island
 *
 * MIGRATED TO PREACT SIGNALS - uses global state store
 * OPTIMIZED: Uses separate NotificationItem components to prevent list flicker
 */

import { useComputed, useSignal } from '@preact/signals';
import { IS_BROWSER } from 'fresh/runtime';
import { useCallback, useEffect } from 'preact/hooks';
import {
    accessToken,
    addPendingUpdate,
    isWsConnected,
    markAllNotificationsAsRead as markAllAsReadGlobal,
    markNotificationAsRead as markAsReadGlobal,
    notifications,
    removeNotification as removeNotificationGlobal,
    unreadCount,
} from '../lib/store.ts';
import NotificationItem from './NotificationItem.tsx';

export default function NotificationList() {
  const isLoading = useSignal(true);
  const isInitialLoad = useSignal(true); // Track if this is the first load
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
      isInitialLoad.value = false;
      return;
    }

    // Only show loading spinner on initial load, not on refetches
    if (isInitialLoad.value) {
      isLoading.value = true;
    }

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
      isInitialLoad.value = false;
    }
  };

  // Mark notification as read - wrapped in useCallback to prevent re-creation
  // Note: We access signals directly inside, so no dependencies needed
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!IS_BROWSER) return;

    const token = accessToken.value;
    if (!token) return;

    // Mark as pending to prevent WebSocket echo
    addPendingUpdate(`read:${notificationId}`);
    
    // Optimistically update UI first
    markAsReadGlobal(notificationId);

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

      if (!response.ok) {
        console.error('Failed to mark notification as read:', response.status);
        // Don't refetch - WebSocket will sync if needed
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Don't refetch - WebSocket will sync if needed
    }
  }, []); // Empty deps because we're using signals which don't need to be tracked

  // Mark all as read - wrapped in useCallback
  const markAllAsRead = useCallback(async () => {
    if (!IS_BROWSER) return;

    const token = accessToken.value;
    if (!token) return;

    // Mark as pending to prevent WebSocket echo
    addPendingUpdate('clear:all');
    
    // Optimistically update UI first
    markAllAsReadGlobal();

    try {
      const apiUrl = window.location.origin;

      const response = await fetch(`${apiUrl}/api/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Failed to mark all as read:', response.status);
        // Don't refetch - WebSocket will sync if needed
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Don't refetch - WebSocket will sync if needed
    }
  }, []); // Empty deps because we're using signals

  // Delete notification - wrapped in useCallback
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!IS_BROWSER) return;

    const token = accessToken.value;
    if (!token) return;

    // Mark as pending to prevent WebSocket echo
    addPendingUpdate(`delete:${notificationId}`);
    
    // Optimistically update UI first
    removeNotificationGlobal(notificationId);

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

      if (!response.ok) {
        console.error('Failed to delete notification:', response.status);
        // Don't refetch - WebSocket will sync if needed
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Don't refetch - WebSocket will sync if needed
    }
  }, []); // Empty deps because we're using signals

  useEffect(() => {
    if (!IS_BROWSER) return;
    fetchNotifications();
  }, []);

  if (!IS_BROWSER) return null;

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
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))
        )}
      </div>
    </div>
  );
}

