/**
 * WebSocket Notification Handler
 * Manages real-time notification delivery via WebSocket connections
 */

import { NotificationService } from '../services/notifications.ts';
import { verifyToken } from './jwt.ts';
import { getKv } from './kv.ts';

interface WebSocketClient {
  socket: WebSocket;
  userId: string;
  isAlive: boolean;
  heartbeatInterval?: number;
}

// Track active WebSocket connections by user ID
const clients = new Map<string, WebSocketClient>();

/**
 * Set up WebSocket connection - returns event handlers for Hono
 * Authentication happens AFTER connection via message
 */
export function setupWebSocketConnection() {
  let authenticated = false;
  let userId: string | null = null;
  let client: WebSocketClient | null = null;

  return {
    onOpen(_event: Event, ws: WebSocket) {
      console.log('[WebSocket] Connection opened, waiting for auth...');
      
      // Request authentication
      sendMessage(ws, {
        type: 'auth_required',
        message: 'Please send authentication token',
      });
    },

    async onMessage(event: MessageEvent, ws: WebSocket) {
      try {
        const data = JSON.parse(event.data as string);
        console.log(`[WebSocket] Received message type: ${data.type}, authenticated: ${authenticated}`);

        // Handle authentication message
        if (data.type === 'auth') {
          // Ignore auth attempts if already authenticated
          if (authenticated) {
            console.log('[WebSocket] Ignoring duplicate auth attempt - already authenticated');
            return;
          }

          try {
            console.log('[WebSocket] Verifying token...');
            const payload = await verifyToken(data.token);
            userId = payload.sub;
            authenticated = true;

            console.log(`[WebSocket] User ${userId} authenticated`);

            // Create client
            client = {
              socket: ws,
              userId,
              isAlive: true,
            };

            // Store client connection
            clients.set(userId, client);

            console.log('[WebSocket] Sending connection confirmation...');
            // Send connection confirmation
            sendMessage(ws, {
              type: 'connected',
              message: 'WebSocket connection established',
              timestamp: new Date().toISOString(),
            });

            console.log('[WebSocket] Fetching unread count...');
            // Send current unread count
            const unreadCount = await NotificationService.getUnreadCount(userId);
            sendMessage(ws, {
              type: 'unread_count',
              unreadCount,
            });

            console.log('[WebSocket] Starting notification watcher...');
            // Start watching for notification changes
            watchNotifications(userId, ws);

            console.log('[WebSocket] Starting heartbeat...');
            // Start heartbeat
            startHeartbeat(client);
            console.log('[WebSocket] Setup complete!');
          } catch (error) {
            // Don't log full error for expired/invalid tokens - this is expected
            console.log('[WebSocket] Authentication failed: Invalid or expired token', error);
            sendMessage(ws, {
              type: 'auth_failed',
              message: 'Invalid or expired token',
            });
            ws.close();
            return;
          }
        } else if (authenticated && userId) {
          // Handle regular messages
          handleClientMessage(userId, data);

          // Reset heartbeat on any message
          if (client) {
            client.isAlive = true;
          }
        } else {
          // Not authenticated and not auth message
          sendMessage(ws, {
            type: 'error',
            message: 'Authentication required',
          });
          ws.close();
        }
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    },

    onClose() {
      if (userId) {
        console.log(`[WebSocket] User ${userId} disconnected`);
        // Clear heartbeat interval if exists
        if (client?.heartbeatInterval) {
          clearInterval(client.heartbeatInterval);
        }
        clients.delete(userId);
      } else {
        console.log('[WebSocket] Unauthenticated connection closed');
      }
    },

    onError(error: Event) {
      console.error('[WebSocket] Error:', error);
      if (userId) {
        clients.delete(userId);
      }
    },
  };
}

/**
 * Watch for notification changes using Deno KV
 */
async function watchNotifications(userId: string, socket: WebSocket) {
  const kv = await getKv();

  try {
    // Watch for changes to user's notifications
    const watcher = kv.watch([['notifications', userId]]);

    for await (const _entries of watcher) {
      // Check if socket is still open
      if (socket.readyState !== WebSocket.OPEN) {
        break;
      }

      // Fetch updated notification data
      const unreadCount = await NotificationService.getUnreadCount(userId);
      const latestNotifications = await NotificationService.getUserNotifications(
        userId,
        { limit: 5 },
      );

      // Send update to client
      sendMessage(socket, {
        type: 'notification_update',
        unreadCount,
        latestNotifications,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error(`[WebSocket] Watcher error for user ${userId}:`, error);
  }
}

/**
 * Handle incoming messages from client
 */
function handleClientMessage(userId: string, data: any) {
  switch (data.type) {
    case 'ping':
      const client = clients.get(userId);
      if (client) {
        sendMessage(client.socket, { type: 'pong' });
      }
      break;

    case 'fetch_notifications':
      // Client requesting fresh data
      NotificationService.getUserNotifications(userId, {
        limit: data.limit || 10,
      }).then((notifications) => {
        const client = clients.get(userId);
        if (client) {
          sendMessage(client.socket, {
            type: 'notifications_list',
            notifications,
          });
        }
      });
      break;

    default:
      console.log(`[WebSocket] Unknown message type from ${userId}:`, data.type);
  }
}

/**
 * Send message to WebSocket client
 */
function sendMessage(socket: WebSocket, data: any) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

/**
 * Start heartbeat to detect dead connections
 */
function startHeartbeat(client: WebSocketClient) {
  const interval = setInterval(() => {
    if (!client.isAlive) {
      console.log(`[WebSocket] Client ${client.userId} failed heartbeat`);
      client.socket.close();
      clients.delete(client.userId);
      clearInterval(interval);
      return;
    }

    // Mark as not alive and send ping
    client.isAlive = false;
    sendMessage(client.socket, { type: 'ping' });
  }, 30000); // Ping every 30 seconds

  // Store interval reference for cleanup in onClose
  client.heartbeatInterval = interval;
}

/**
 * Broadcast notification to a specific user (if connected)
 */
export function notifyUser(userId: string, notification: any) {
  const client = clients.get(userId);
  if (client && client.socket.readyState === WebSocket.OPEN) {
    sendMessage(client.socket, {
      type: 'new_notification',
      notification,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Broadcast to all connected clients
 */
export function broadcast(message: any) {
  clients.forEach((client) => {
    sendMessage(client.socket, message);
  });
}

/**
 * Get connection statistics
 */
export function getConnectionStats() {
  return {
    totalConnections: clients.size,
    connectedUsers: Array.from(clients.keys()),
  };
}

/**
 * Disconnect a specific user
 */
export function disconnectUser(userId: string) {
  const client = clients.get(userId);
  if (client) {
    client.socket.close();
    clients.delete(userId);
  }
}

/**
 * Disconnect all users
 */
export function disconnectAll() {
  clients.forEach((client) => {
    client.socket.close();
  });
  clients.clear();
}
