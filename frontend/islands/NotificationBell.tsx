import { IS_BROWSER } from '$fresh/runtime.ts';
import { useEffect, useRef, useState } from 'preact/hooks';

interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
  readAt?: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const apiUrl = IS_BROWSER
        ? window.location.origin.replace(':3000', ':8000')
        : 'http://localhost:8000';
      
      const token = IS_BROWSER ? localStorage.getItem('access_token') : null;
      if (!token) return;

      const response = await fetch(`${apiUrl}/api/notifications?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const apiUrl = IS_BROWSER
        ? window.location.origin.replace(':3000', ':8000')
        : 'http://localhost:8000';
      
      const token = IS_BROWSER ? localStorage.getItem('access_token') : null;
      if (!token) return;

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
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      const apiUrl = IS_BROWSER
        ? window.location.origin.replace(':3000', ':8000')
        : 'http://localhost:8000';
      
      const token = IS_BROWSER ? localStorage.getItem('access_token') : null;
      if (!token) return;

      const response = await fetch(`${apiUrl}/api/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const apiUrl = IS_BROWSER
        ? window.location.origin.replace(':3000', ':8000')
        : 'http://localhost:8000';
      
      const token = IS_BROWSER ? localStorage.getItem('access_token') : null;
      if (!token) return;

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
        // Update local state
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        // Decrement unread count if notification was unread
        const notification = notifications.find((n) => n.id === notificationId);
        if (notification && !notification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Connect to WebSocket for real-time updates
  const connectWebSocket = () => {
    if (!IS_BROWSER) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Create WebSocket connection with proper URL
    const wsUrl = window.location.origin
      .replace('http://', 'ws://')
      .replace('https://', 'wss://')
      .replace(':3000', ':8000');
    
    const ws = new WebSocket(`${wsUrl}/api/notifications/ws`);
    let authSent = false;

    ws.onopen = () => {
      console.log('[WebSocket] Connection opened, waiting for auth prompt...');
      // Server will send 'auth_required' message
      // We'll respond to that with our token
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WebSocket] Message:', data);

        switch (data.type) {
          case 'auth_required':
            if (authSent) {
              console.log('[WebSocket] Ignoring duplicate auth_required - already sent auth');
              break;
            }
            console.log('[WebSocket] Auth required, sending token...');
            authSent = true;
            // Send authentication
            ws.send(JSON.stringify({
              type: 'auth',
              token: token,
            }));
            break;

          case 'auth_failed':
            console.error('[WebSocket] Authentication failed - token may be expired');
            setIsConnected(false);
            ws.close();
            // Don't automatically redirect - the component will just not show
            // User can refresh or navigate to get redirected by middleware if truly logged out
            break;

          case 'connected':
            console.log('[WebSocket] Authenticated and connected');
            setIsConnected(true);
            // Fetch initial notifications after successful auth
            fetchNotifications();
            break;

          case 'unread_count':
            setUnreadCount(data.unreadCount);
            break;

          case 'notification_update':
            setUnreadCount(data.unreadCount);
            // If dropdown is open, refresh the list
            if (isOpen) {
              fetchNotifications();
            }
            break;

          case 'new_notification':
            // New notification received - add to list if dropdown is open
            if (isOpen) {
              fetchNotifications();
            } else {
              // Just update the count
              setUnreadCount((prev) => prev + 1);
            }
            break;

          case 'ping':
            // Respond to heartbeat
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);

      // Attempt to reconnect after 5 seconds
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        if (IS_BROWSER && localStorage.getItem('access_token')) {
          console.log('[WebSocket] Attempting to reconnect...');
          connectWebSocket();
        }
      }, 5000);
    };

    wsRef.current = ws;
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (!IS_BROWSER) return;

    // Don't connect if user is not logged in
    const token = localStorage.getItem('access_token');
    if (!token) return;

    connectWebSocket();

    return () => {
      // Cleanup: close WebSocket and clear reconnect timeout
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen && IS_BROWSER) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!IS_BROWSER) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  // Don't render on server
  if (!IS_BROWSER) return null;

  // Don't render if user is not logged in
  const token = localStorage.getItem('access_token');
  if (!token) return null;

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
        onClick={() => setIsOpen(!isOpen)}
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
            isConnected ? 'bg-green-500' : 'bg-gray-400 animate-pulse'
          }`}
          title={isConnected ? 'Connected (Real-time)' : 'Reconnecting...'}
        />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span class="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div class="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={isLoading}
                class="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div class="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
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
              notifications.map((notification) => (
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
                            setIsOpen(false);
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
          {notifications.length > 0 && (
            <div class="px-4 py-3 border-t border-gray-200 text-center">
              <a
                href="/notifications"
                class="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => setIsOpen(false)}
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
