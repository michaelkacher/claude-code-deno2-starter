/**
 * WebSocket Notification Handler
 * Manages real-time notification delivery via WebSocket connections
 */

import { NotificationService } from '../services/notifications.ts';
import { verifyToken } from './jwt.ts';
import { getKv } from './kv.ts';
import { createLogger } from './logger.ts';

const logger = createLogger('WebSocket');

interface WebSocketClient {
  socket: WebSocket;
  userId: string;
  isAdmin: boolean;
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
      logger.debug('Connection opened, waiting for auth');
      
      // Request authentication
      sendMessage(ws, {
        type: 'auth_required',
        message: 'Please send authentication token',
      });
    },

    async onMessage(event: MessageEvent, ws: WebSocket) {
      try {
        const data = JSON.parse(event.data as string);
        logger.debug('Received message', { type: data.type, authenticated });

        // Handle authentication message
        if (data.type === 'auth') {
          // Ignore auth attempts if already authenticated
          if (authenticated) {
            logger.debug('Ignoring duplicate auth attempt - already authenticated');
            return;
          }

          try {
            logger.debug('Verifying token');
            const payload = await verifyToken(data.token);
            userId = payload.sub;
            authenticated = true;

            // Check if user is admin
            const kv = await getKv();
            const userEntry = await kv.get(['users', userId]);
            const isAdmin = userEntry.value?.role === 'admin';

            logger.info('User authenticated', { userId, isAdmin });

            // Create client
            client = {
              socket: ws,
              userId,
              isAdmin,
              isAlive: true,
            };

            // Store client connection
            clients.set(userId, client);

            logger.debug('Sending connection confirmation', { userId });
            // Send connection confirmation
            sendMessage(ws, {
              type: 'connected',
              message: 'WebSocket connection established',
              timestamp: new Date().toISOString(),
            });

            // Send current unread count
            const unreadCount = await NotificationService.getUnreadCount(userId);
            sendMessage(ws, {
              type: 'unread_count',
              unreadCount,
            });

            // Start watching for notification changes (don't await - runs in background)
            watchNotifications(userId, ws).catch(error => {
              logger.error('Watch notifications failed', error, { userId });
            });

            // Start heartbeat
            startHeartbeat(client);
            logger.info('WebSocket setup complete', { userId });
          } catch (error) {
            logger.warn('Authentication failed', error);
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
        logger.error('Error parsing message', error);
      }
    },

    onClose() {
      if (userId) {
        logger.info('User disconnected', { userId });
        // Clear heartbeat interval if exists
        if (client?.heartbeatInterval) {
          clearInterval(client.heartbeatInterval);
        }
        clients.delete(userId);
      } else {
        logger.debug('Unauthenticated connection closed');
      }
    },

    onError(error: Event) {
      logger.error('WebSocket error', error);
      if (userId) {
        clients.delete(userId);
      }
    },
  };
}

/**
 * Watch for notification changes using Deno KV
 * 
 * Watches a signal key that gets updated whenever notifications are created/updated/deleted.
 * This works for notifications created through the API (same process).
 * 
 * Note: Test scripts that open their own KV connection won't trigger this watcher,
 * but in production all notifications are created via API so this works perfectly.
 */
async function watchNotifications(userId: string, socket: WebSocket) {
  const kv = await getKv();

  try {
    const signalKey: Deno.KvKey = ['notification_updates', userId];
    
    logger.debug('Setting up notification watcher', { userId });
    
    const watcher = kv.watch([signalKey]);
    let isFirstEvent = true;

    for await (const entries of watcher) {
      // Check if socket is still open
      if (socket.readyState !== WebSocket.OPEN) {
        logger.debug('Socket closed, stopping watcher', { userId });
        break;
      }

      // Skip the very first event (initial state when watch starts)
      if (isFirstEvent) {
        isFirstEvent = false;
        const signalEntry = entries[0];
        logger.debug('Skipping initial watcher state', { userId, initialValue: signalEntry.value });
        continue;
      }

      const signalEntry = entries[0];
      logger.debug('Watcher detected notification change', { userId, timestamp: signalEntry.value });
      
      await sendNotificationUpdate(userId, socket);
    }
  } catch (error) {
    logger.error('Watcher error', error, { userId });
  }
}

/**
 * Send notification update to client
 */
async function sendNotificationUpdate(userId: string, socket: WebSocket) {
  try {
    const unreadCount = await NotificationService.getUnreadCount(userId);
    const latestNotifications = await NotificationService.getUserNotifications(
      userId,
      { limit: 5 },
    );

    sendMessage(socket, {
      type: 'notification_update',
      unreadCount,
      latestNotifications,
      timestamp: new Date().toISOString(),
    });
    
    logger.debug('Sent notification update', { userId, unreadCount, count: latestNotifications.length });
  } catch (error) {
    logger.error('Error sending notification update', error, { userId });
  }
}

/**
 * Handle incoming messages from client
 */
function handleClientMessage(userId: string, data: any) {
  const client = clients.get(userId);
  
  switch (data.type) {
    case 'ping':
      // Client sent ping, respond with pong
      if (client) {
        sendMessage(client.socket, { type: 'pong' });
      }
      break;

    case 'pong':
      // Client responded to our ping - heartbeat is alive
      // isAlive is already set to true before this function is called
      break;

    case 'fetch_notifications':
      // Client requesting fresh data
      NotificationService.getUserNotifications(userId, {
        limit: data.limit || 10,
      }).then((notifications) => {
        if (client) {
          sendMessage(client.socket, {
            type: 'notifications_list',
            notifications,
          });
        }
      });
      break;

    case 'subscribe_jobs':
      // Client wants real-time job updates
      logger.info('User subscribed to job updates', { userId });
      if (client) {
        sendMessage(client.socket, {
          type: 'jobs_subscribed',
          message: 'Subscribed to job updates',
        });
      }
      break;

    case 'unsubscribe_jobs':
      // Client no longer wants job updates
      logger.info('User unsubscribed from job updates', { userId });
      break;

    default:
      logger.warn('Unknown message type', { userId, type: data.type });
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
      logger.warn('Client failed heartbeat', { userId: client.userId });
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
 * Broadcast job update to all connected admin clients
 */
export function broadcastJobUpdate(jobData: any) {
  clients.forEach((client) => {
    // Only send job updates to admin users
    if (client.isAdmin) {
      sendMessage(client.socket, {
        type: 'job_update',
        job: jobData,
        timestamp: new Date().toISOString(),
      });
    }
  });
}

/**
 * Broadcast job stats update to all connected admin clients
 */
export function broadcastJobStats(stats: any) {
  clients.forEach((client) => {
    // Only send job stats to admin users
    if (client.isAdmin) {
      sendMessage(client.socket, {
        type: 'job_stats_update',
        stats,
        timestamp: new Date().toISOString(),
      });
    }
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
