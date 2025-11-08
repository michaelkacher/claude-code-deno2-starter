/**
 * Centralized WebSocket Service
 *
 * Manages a single WebSocket connection for real-time notifications.
 * Uses global signals from store.ts for state management.
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import {
  accessToken,
  addNotification,
  clearAuth,
  isAuthenticated,
  markNotificationAsRead,
  notifications,
  setUnreadCount,
  setWsConnected,
  wsConnection,
} from './store.ts';

// ============================================================================
// Constants
// ============================================================================

const RECONNECT_DELAY_MS = 3000;
const PING_INTERVAL_MS = 30000;

// ============================================================================
// State
// ============================================================================

let reconnectTimeout: number | null = null;
let pingInterval: number | null = null;
let authSent = false;

// ============================================================================
// WebSocket Connection Management
// ============================================================================

/**
 * Connect to WebSocket server for real-time notifications
 */
export function connectWebSocket() {
  if (!IS_BROWSER) return;

  // Don't connect if not authenticated
  if (!isAuthenticated.value || !accessToken.value) {
    console.log('[WebSocket] Not authenticated, skipping connection');
    return;
  }

  // Don't reconnect if already connected
  if (wsConnection.value && wsConnection.value.readyState === WebSocket.OPEN) {
    console.log('[WebSocket] Already connected');
    return;
  }

  // Close existing connection if any
  if (wsConnection.value) {
    try {
      wsConnection.value.close();
    } catch (error) {
      console.error('[WebSocket] Error closing existing connection:', error);
    }
    wsConnection.value = null;
  }

  try {
    const token = accessToken.value;
    const wsUrl = window.location.origin
      .replace('http://', 'ws://')
      .replace('https://', 'wss://');

    const ws = new WebSocket(`${wsUrl}/api/notifications/ws?token=${encodeURIComponent(token || '')}`);
    authSent = false;

    ws.onopen = () => {
      console.log('[WebSocket] Connection opened, waiting for auth prompt...');
      console.log('[WebSocket] readyState:', ws.readyState);
    };

    ws.onmessage = (event) => {
      handleWebSocketMessage(event, ws, token);
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      console.error('[WebSocket] readyState:', ws.readyState);
      setWsConnected(false);

      // Stop reconnection if no longer authenticated
      if (!isAuthenticated.value) {
        cleanupWebSocket();
      }
    };

    ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      setWsConnected(false);

      // Clear ping interval
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }

      // Attempt reconnection if still authenticated
      if (isAuthenticated.value && accessToken.value) {
        scheduleReconnect();
      } else {
        cleanupWebSocket();
      }
    };

    wsConnection.value = ws;
  } catch (error) {
    console.error('[WebSocket] Connection error:', error);
    setWsConnected(false);
  }
}

/**
 * Handle incoming WebSocket messages
 */
function handleWebSocketMessage(event: MessageEvent, ws: WebSocket, token: string | null) {
  try {
    const data = JSON.parse(event.data);
    console.log('[WebSocket] Message received:', data);

    switch (data.type) {
      case 'auth_required':
        if (authSent) {
          console.log('[WebSocket] Ignoring duplicate auth_required');
          break;
        }
        console.log('[WebSocket] Auth required, sending token...');
        authSent = true;
        ws.send(JSON.stringify({
          type: 'auth',
          token: token,
        }));
        break;

      case 'connected':
        console.log('[WebSocket] Authenticated and connected');
        setWsConnected(true);

        // Clear any pending reconnection
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }

        // Start ping interval for keepalive
        if (pingInterval) {
          clearInterval(pingInterval);
        }
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, PING_INTERVAL_MS);
        break;

      case 'auth_failed':
        console.error('[WebSocket] Authentication failed');
        setWsConnected(false);
        cleanupWebSocket();
        // Token may be expired, clear auth
        clearAuth();
        break;

      case 'unread_count':
        setUnreadCount(data.unreadCount || 0);
        break;

      case 'notification_update':
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        }
        if (data.latestNotifications) {
          notifications.value = data.latestNotifications;
        }
        // Handle single notification update
        if (data.notification) {
          const index = notifications.value.findIndex(n => n.id === data.notification.id);
          if (index !== -1) {
            const updated = [...notifications.value];
            updated[index] = data.notification;
            notifications.value = updated;
          }
        }
        break;

      case 'notification':
      case 'new_notification':
        if (data.notification) {
          addNotification(data.notification);
        }
        break;

      case 'notification_read':
        if (data.notificationId) {
          markNotificationAsRead(data.notificationId);
        }
        break;

      case 'notification_deleted':
        if (data.notificationId) {
          notifications.value = notifications.value.filter(n => n.id !== data.notificationId);
          // Recalculate unread count
          const unread = notifications.value.filter(n => !n.read).length;
          setUnreadCount(unread);
        }
        break;

      case 'notifications_cleared':
        // All notifications marked as read
        notifications.value = notifications.value.map(n => ({ ...n, read: true }));
        setUnreadCount(0);
        break;

      case 'ping':
        // Respond to server heartbeat
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
        break;

      case 'pong':
        // Heartbeat response received
        break;

      default:
        console.log('[WebSocket] Unknown message type:', data.type);
    }
  } catch (error) {
    console.error('[WebSocket] Error parsing message:', error);
  }
}

/**
 * Schedule reconnection attempt
 */
function scheduleReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  reconnectTimeout = setTimeout(() => {
    console.log('[WebSocket] Attempting to reconnect...');
    connectWebSocket();
  }, RECONNECT_DELAY_MS);
}

/**
 * Cleanup WebSocket connection and timers
 */
export function cleanupWebSocket() {
  // Close WebSocket
  if (wsConnection.value) {
    try {
      wsConnection.value.close();
    } catch (error) {
      console.debug('[WebSocket] Error closing connection (non-critical):', error);
    }
    wsConnection.value = null;
  }

  // Clear reconnection timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  // Clear ping interval
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }

  // Update connection status
  setWsConnected(false);

  // Reset auth flag
  authSent = false;
}

/**
 * Disconnect WebSocket (does not attempt reconnection)
 */
export function disconnectWebSocket() {
  console.log('[WebSocket] Disconnecting...');
  cleanupWebSocket();
}

// ============================================================================
// Auto-connect on authentication
// ============================================================================

if (IS_BROWSER) {
  // Watch for authentication changes and connect/disconnect accordingly
  // This runs in the browser when the module is first loaded
  const checkAuth = () => {
    console.log('[WebSocket] Checking auth...', {
      isAuthenticated: isAuthenticated.value,
      hasConnection: !!wsConnection.value,
      accessToken: !!accessToken.value,
    });
    
    if (isAuthenticated.value && !wsConnection.value) {
      // User is authenticated but not connected
      const wsInitialized = sessionStorage.getItem('wsInitialized');
      console.log('[WebSocket] wsInitialized:', wsInitialized);
      // Always try to connect if not connected, regardless of wsInitialized flag
      console.log('[WebSocket] Auto-connecting...');
      sessionStorage.setItem('wsInitialized', 'true');
      connectWebSocket();
    } else if (!isAuthenticated.value && wsConnection.value) {
      // User is no longer authenticated, disconnect
      console.log('[WebSocket] Auth lost, disconnecting...');
      cleanupWebSocket();
      sessionStorage.removeItem('wsInitialized');
    }
  };

  // Check on module load
  console.log('[WebSocket] Module loaded, checking initial auth state...');
  checkAuth();

  // Subscribe to authentication changes
  isAuthenticated.subscribe(() => {
    console.log('[WebSocket] Auth state changed');
    checkAuth();
  });
}
