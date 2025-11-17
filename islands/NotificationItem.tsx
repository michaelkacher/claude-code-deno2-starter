/**
 * Notification Item Component
 * Individual notification card - optimized for minimal re-renders
 */

import { useSignal } from '@preact/signals';
import { IS_BROWSER } from 'fresh/runtime';
import { memo } from 'preact/compat';
import type { Notification } from '../lib/store.ts';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItemComponent({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: NotificationItemProps) {
  const isDeleting = useSignal(false);
  const isMarkingRead = useSignal(false);

  // Debug logging
  if (IS_BROWSER) {
    console.log(`[NotificationItem] Rendering notification ${notification.id.slice(-4)}, read: ${notification.read}`);
  }

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

  const handleMarkAsRead = async () => {
    isMarkingRead.value = true;
    await onMarkAsRead(notification.id);
    isMarkingRead.value = false;
  };

  const handleDelete = async () => {
    isDeleting.value = true;
    await onDelete(notification.id);
  };

  const handleLinkClick = () => {
    if (!notification.read) {
      handleMarkAsRead();
    }
  };

  return (
    <div
      class={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ${
        !notification.read ? 'bg-blue-50 dark:bg-blue-900' : 'dark:bg-gray-800'
      } ${isDeleting.value ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}
      style={{ transition: 'all 0.2s ease-out' }}
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
              <h3 class={`text-base font-medium transition-colors duration-200 ${!notification.read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                {notification.title}
              </h3>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {notification.message}
              </p>
              <div class="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{formatDate(notification.createdAt)}</span>
                {notification.read && notification.readAt && (
                  <span class="flex items-center gap-1 transition-all duration-200">
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
                  onClick={handleMarkAsRead}
                  disabled={isMarkingRead.value}
                  class={`p-2 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-all duration-200 ${
                    isMarkingRead.value ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Mark as read"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting.value}
                class={`p-2 text-gray-400 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-all duration-200 ${
                  isDeleting.value ? 'opacity-50 cursor-not-allowed' : ''
                }`}
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
              onClick={handleLinkClick}
              class="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-400 transition-colors duration-200"
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
  );
}

// Memoize to prevent re-renders when props haven't changed
// The comparison function returns true when props are equal (skip re-render)
const NotificationItem = memo(NotificationItemComponent, (prevProps, nextProps) => {
  // Check if notification data is the same (ignore callback functions)
  const prevNotif = prevProps.notification;
  const nextNotif = nextProps.notification;
  
  const areEqual = (
    prevNotif.id === nextNotif.id &&
    prevNotif.read === nextNotif.read &&
    prevNotif.title === nextNotif.title &&
    prevNotif.message === nextNotif.message &&
    prevNotif.type === nextNotif.type &&
    prevNotif.link === nextNotif.link &&
    prevNotif.createdAt === nextNotif.createdAt &&
    prevNotif.readAt === nextNotif.readAt
  );
  
  if (IS_BROWSER && !areEqual) {
    console.log(`[NotificationItem memo] Props changed for ${nextNotif.id.slice(-4)}, will re-render`);
  }
  
  return areEqual;
});

export default NotificationItem;

