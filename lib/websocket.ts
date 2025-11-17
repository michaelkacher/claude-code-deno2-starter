/**
 * Centralized WebSocket Service
 *
 * Manages a single WebSocket connection for real-time updates.
 * Supports channel-based subscriptions for different features:
 * - Notifications (automatic)
 * - Job updates (admin dashboard)
 * - Future: analytics, chat, collaboration, etc.
 * 
 * Uses global signals from store.ts for state management.
 * 
 * **Race Condition Prevention:**
 * - Delayed initialization (100ms) ensures signals from localStorage are hydrated
 * - Debouncing (500ms) prevents rapid successive connection attempts
 * - Connection state guards prevent concurrent connection attempts
 * - Authentication state is validated before each connection attempt
 */

import { IS_BROWSER } from 'fresh/runtime';
import { ACCESS_TOKEN_EXPIRY_MS } from '@/lib/config.ts';
import {
    accessToken,
    addNotification,
    clearAuth,
    isAuthenticated,
    isLoggingIn,
    isLoggingOut,
    isPendingUpdate,
    markNotificationAsRead,
    notifications,
    removePendingUpdate,
    setUnreadCount,
    setWsConnected,
    wsConnection
} from './store.ts';

// ============================================================================
// Types
// ============================================================================

type ChannelHandler = (message: unknown) => void;
type ChannelName = 'jobs' | 'analytics' | 'chat' | string;

// ============================================================================
// Constants
// ============================================================================

const RECONNECT_DELAY_MS = 3000;
const PING_INTERVAL_MS = 60000; // Match server heartbeat interval (60s)
const DEBOUNCE_DELAY_MS = 500; // Debounce auth state changes
const INITIAL_LOAD_DELAY_MS = 100; // Delay on initial page load to ensure signals are hydrated

// ============================================================================
// State
// ============================================================================

let reconnectTimeout: number | null = null;
let pingInterval: number | null = null;
let authSent = false;
let debounceTimeout: number | null = null;
let isInitialized = false; // Track if module has completed initialization

// Channel subscription management
const channelHandlers = new Map<ChannelName, Set<ChannelHandler>>();
const subscribedChannels = new Set<ChannelName>();

// Connection state guards
enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
}

let connectionState: ConnectionState = ConnectionState.DISCONNECTED;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Decode JWT to check expiration (client-side only, no verification)
 */
function isTokenExpiringSoon(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    // Consider token as expiring soon if less than 2 minutes remaining
    const TWO_MINUTES = 2 * 60 * 1000;
    return (exp - now) < TWO_MINUTES;
  } catch (error) {
    console.error('[WebSocket] Error checking token expiration:', error);
    return true; // Assume expired if we can't parse
  }
}

/**
 * Check if token is already expired
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    return now >= exp;
  } catch (error) {
    console.error('[WebSocket] Error checking token expiration:', error);
    return true; // Assume expired if we can't parse
  }
}

/**
 * Refresh the access token
 */
async function refreshToken(): Promise<boolean> {
  try {
    console.log('[WebSocket] Refreshing token...');
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('[WebSocket] Token refresh failed:', response.status);
      if (response.status === 401 || response.status === 403) {
        // Refresh token is invalid/expired, clear auth
        clearAuth();
      }
      return false;
    }

    const data = await response.json();
    const newAccessToken = data.data?.access_token || data.accessToken;

    if (!newAccessToken) {
      console.error('[WebSocket] No access token in refresh response');
      return false;
    }

    // Update the token in storage (this will trigger signal updates)
    localStorage.setItem('access_token', newAccessToken);
    accessToken.value = newAccessToken;

    // Update the cookie for middleware
    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_MS);
    document.cookie = `auth_token=${newAccessToken}; expires=${expiresAt.toUTCString()}; path=/; SameSite=Lax`;

    console.log('[WebSocket] Token refreshed successfully');
    return true;
  } catch (error) {
    console.error('[WebSocket] Token refresh error:', error);
    return false;
  }
}

// ============================================================================
// WebSocket Connection Management
// ============================================================================

/**
 * Connect to WebSocket server for real-time notifications
 */
export async function connectWebSocket() {
  if (!IS_BROWSER) return;

  // CRITICAL: Don't connect if logout is in progress
  if (isLoggingOut.value) {
    console.log('[WebSocket] Logout in progress, skipping connection');
    connectionState = ConnectionState.DISCONNECTED;
    return;
  }

  // Connection state guard: prevent concurrent connection attempts
  if (connectionState === ConnectionState.CONNECTING || connectionState === ConnectionState.RECONNECTING) {
    console.log('[WebSocket] Connection already in progress, skipping...');
    return;
  }

  // Don't connect if not authenticated
  if (!isAuthenticated.value || !accessToken.value) {
    console.log('[WebSocket] Not authenticated, skipping connection');
    connectionState = ConnectionState.DISCONNECTED;
    return;
  }

  // Check if token is expiring soon and refresh if needed
  const currentToken = accessToken.value;
  // Temporarily disable token refresh check to debug WebSocket connection
  const skipRefresh = true;
  if (!skipRefresh && isTokenExpiringSoon(currentToken)) {
    console.log('[WebSocket] Token expiring soon, refreshing before connection...');
    const refreshed = await refreshToken();
    if (!refreshed) {
      console.error('[WebSocket] Failed to refresh token, cannot connect');
      connectionState = ConnectionState.DISCONNECTED;
      return;
    }
  }

  // Don't reconnect if already connected
  if (wsConnection.value && wsConnection.value.readyState === WebSocket.OPEN) {
    console.log('[WebSocket] Already connected');
    connectionState = ConnectionState.CONNECTED;
    return;
  }

  // Set connecting state
  connectionState = ConnectionState.CONNECTING;

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
    
    // WebSocket URL - use same origin, Vite will proxy /api/notifications/ws to Fresh on port 8000
    const wsUrl = window.location.origin.replace('http://', 'ws://').replace('https://', 'wss://');

    console.log('[WebSocket] Connecting to:', `${wsUrl}/api/notifications/ws`);
    console.log('[WebSocket] Token present:', !!token);
    console.log('[WebSocket] Token length:', token?.length || 0);

    const ws = new WebSocket(`${wsUrl}/api/notifications/ws?token=${encodeURIComponent(token || '')}`);
    authSent = false;

    ws.onopen = () => {
      console.log('[WebSocket] Connection opened, waiting for auth prompt...');
      console.log('[WebSocket] readyState:', ws.readyState);
      console.log('[WebSocket] URL:', ws.url);
    };

    ws.onmessage = (event) => {
      handleWebSocketMessage(event, ws, token);
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      console.error('[WebSocket] readyState:', ws.readyState);
      setWsConnected(false);
      connectionState = ConnectionState.DISCONNECTED;

      // Check if we should attempt to reconnect
      if (isAuthenticated.value && accessToken.value) {
        // Validate token before reconnecting
        const currentToken = accessToken.value;
        const isExpired = isTokenExpired(currentToken);
        
        if (isExpired) {
          console.log('[WebSocket] Token expired after error, attempting refresh...');
          refreshToken().then((success) => {
            if (!success) {
              console.log('[WebSocket] Token refresh failed, cleaning up...');
              cleanupWebSocket();
            }
            // If refresh succeeded, onclose handler will trigger reconnection
          });
        }
        // Otherwise, let onclose handler manage reconnection
      } else {
        cleanupWebSocket();
      }
    };

    ws.onclose = (event) => {
      console.log('[WebSocket] Disconnected', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      setWsConnected(false);
      connectionState = ConnectionState.DISCONNECTED;

      // Clear ping interval
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }

      // Attempt reconnection if still authenticated
      if (isAuthenticated.value && accessToken.value) {
        // Validate token is still valid before reconnecting
        const currentToken = accessToken.value;
        const isExpired = isTokenExpired(currentToken);
        
        if (isExpired) {
          console.log('[WebSocket] Token expired, attempting refresh before reconnect...');
          // Try to refresh token, then reconnect
          refreshToken().then((success) => {
            if (success) {
              console.log('[WebSocket] Token refreshed, reconnecting...');
              scheduleReconnect();
            } else {
              console.log('[WebSocket] Token refresh failed, cleaning up...');
              cleanupWebSocket();
            }
          });
        } else {
          scheduleReconnect();
        }
      } else {
        cleanupWebSocket();
      }
    };

    wsConnection.value = ws;
  } catch (error) {
    console.error('[WebSocket] Connection error:', error);
    setWsConnected(false);
    connectionState = ConnectionState.DISCONNECTED;
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
        console.log('[WebSocket] Token for auth:', token ? `${token.substring(0, 20)}...` : 'null');
        authSent = true;
        ws.send(JSON.stringify({
          type: 'auth',
          token: token,
        }));
        console.log('[WebSocket] Auth message sent');
        break;

      case 'connected':
        console.log('[WebSocket] Authenticated and connected');
        setWsConnected(true);
        connectionState = ConnectionState.CONNECTED;

        // Clear any pending reconnection
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }

        // Resubscribe to all active channels
        resubscribeToChannels();

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
        connectionState = ConnectionState.DISCONNECTED;
        cleanupWebSocket();
        
        // IMPORTANT: Don't clear auth during login/logout flows
        // During login: WebSocket might connect with a brand new token that hasn't fully propagated
        // During logout: We're already cleaning up auth state
        // Only clear auth if we're in a stable authenticated state and auth genuinely failed
        if (!isLoggingOut.value && !isLoggingIn.value) {
          console.log('[WebSocket] Auth failed in stable state, clearing auth');
          clearAuth();
        } else {
          console.log('[WebSocket] Auth failed during login/logout flow, skipping clearAuth');
        }
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
          // Skip if we already optimistically updated this
          if (!isPendingUpdate(`read:${data.notificationId}`)) {
            markNotificationAsRead(data.notificationId);
          } else {
            removePendingUpdate(`read:${data.notificationId}`);
          }
        }
        break;

      case 'notification_deleted':
        if (data.notificationId) {
          // Skip if we already optimistically updated this
          if (!isPendingUpdate(`delete:${data.notificationId}`)) {
            notifications.value = notifications.value.filter(n => n.id !== data.notificationId);
            // Recalculate unread count
            const unread = notifications.value.filter(n => !n.read).length;
            setUnreadCount(unread);
          } else {
            removePendingUpdate(`delete:${data.notificationId}`);
          }
        }
        break;

      case 'notifications_cleared':
        // All notifications marked as read
        // Skip if we already optimistically updated this
        if (!isPendingUpdate('clear:all')) {
          notifications.value = notifications.value.map(n => ({ ...n, read: true }));
          setUnreadCount(0);
        } else {
          removePendingUpdate('clear:all');
        }
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

      // Job-related messages (dispatched to channel subscribers)
      case 'jobs_subscribed':
        console.log('[WebSocket] Subscribed to jobs channel');
        dispatchToChannel('jobs', data);
        break;

      case 'job_update':
        dispatchToChannel('jobs', data);
        break;

      case 'job_stats_update':
        dispatchToChannel('jobs', data);
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

  connectionState = ConnectionState.RECONNECTING;

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

  // Clear debounce timeout
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
    debounceTimeout = null;
  }

  // Update connection status
  setWsConnected(false);
  connectionState = ConnectionState.DISCONNECTED;

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
// Channel Subscription System
// ============================================================================

/**
 * Subscribe to a specific channel for real-time updates
 * 
 * @param channel - Channel name (e.g., 'jobs', 'analytics', 'chat')
 * @param handler - Callback function to handle messages for this channel
 * @returns Unsubscribe function
 * 
 * @example
 * ```typescript
 * const unsubscribe = subscribeToChannel('jobs', (message) => {
 *   if (message.type === 'job_update') {
 *     console.log('Job updated:', message.job);
 *   }
 * });
 * 
 * // Later, cleanup:
 * unsubscribe();
 * ```
 */
export function subscribeToChannel(channel: ChannelName, handler: ChannelHandler): () => void {
  if (!IS_BROWSER) {
    return () => {}; // No-op for SSR
  }

  console.log('[WebSocket] Subscribing to channel:', channel);

  // Add handler to channel's handler set
  if (!channelHandlers.has(channel)) {
    channelHandlers.set(channel, new Set());
  }
  channelHandlers.get(channel)!.add(handler);

  // If this is the first subscriber to this channel, tell the server
  if (!subscribedChannels.has(channel)) {
    subscribedChannels.add(channel);
    
    // Send subscription message if connected
    const ws = wsConnection.value;
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Sending subscribe message for:', channel);
      ws.send(JSON.stringify({ type: `subscribe_${channel}` }));
    }
  }

  // Return unsubscribe function
  return () => {
    console.log('[WebSocket] Unsubscribing from channel:', channel);
    
    const handlers = channelHandlers.get(channel);
    if (handlers) {
      handlers.delete(handler);
      
      // If no more handlers for this channel, unsubscribe from server
      if (handlers.size === 0) {
        channelHandlers.delete(channel);
        subscribedChannels.delete(channel);
        
        const ws = wsConnection.value;
        if (ws && ws.readyState === WebSocket.OPEN) {
          console.log('[WebSocket] Sending unsubscribe message for:', channel);
          ws.send(JSON.stringify({ type: `unsubscribe_${channel}` }));
        }
      }
    }
  };
}

/**
 * Dispatch a message to all handlers subscribed to a channel
 */
function dispatchToChannel(channel: ChannelName, message: unknown) {
  const handlers = channelHandlers.get(channel);
  if (handlers) {
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error(`[WebSocket] Error in ${channel} channel handler:`, error);
      }
    });
  }
}

/**
 * Resubscribe to all active channels (called after reconnection)
 */
function resubscribeToChannels() {
  const ws = wsConnection.value;
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  subscribedChannels.forEach(channel => {
    console.log('[WebSocket] Resubscribing to channel:', channel);
    ws.send(JSON.stringify({ type: `subscribe_${channel}` }));
  });
}

// ============================================================================
// Auto-connect on authentication
// ============================================================================

if (IS_BROWSER) {
  /**
   * Debounced authentication check to prevent rapid successive connection attempts
   */
  const debouncedCheckAuth = () => {
    // Clear any pending debounce
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    debounceTimeout = setTimeout(() => {
      checkAuth();
    }, DEBOUNCE_DELAY_MS);
  };

  /**
   * Check authentication state and connect/disconnect accordingly
   */
  const checkAuth = () => {
    // Don't proceed if module hasn't initialized yet
    if (!isInitialized) {
      console.log('[WebSocket] Module not initialized yet, skipping auth check');
      return;
    }

    console.log('[WebSocket] Checking auth...', {
      isAuthenticated: isAuthenticated.value,
      hasConnection: !!wsConnection.value,
      accessToken: !!accessToken.value,
      connectionState,
    });
    
    if (isAuthenticated.value && !wsConnection.value && connectionState === ConnectionState.DISCONNECTED) {
      // User is authenticated but not connected
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

  /**
   * Initialize WebSocket module after signals are hydrated
   */
  const initializeWebSocket = () => {
    console.log('[WebSocket] Initializing module...');
    
    // Mark as initialized
    isInitialized = true;
    
    // Check initial auth state
    checkAuth();

    // Subscribe to authentication changes with debouncing
    isAuthenticated.subscribe(() => {
      console.log('[WebSocket] Auth state changed, debouncing check...');
      debouncedCheckAuth();
    });
  };

  // Delay initialization to ensure signals from localStorage are properly hydrated
  // This prevents race conditions during initial page load
  setTimeout(initializeWebSocket, INITIAL_LOAD_DELAY_MS);
}

