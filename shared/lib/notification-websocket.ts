/**
 * WebSocket Notification Handler
 * Manages real-time notification delivery via WebSocket connections
 */

import { UserRepository } from '../repositories/index.ts';
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
  connectionId: string; // Unique ID for this connection
  connectedAt: number; // Timestamp when connected
  lastActivity: number; // Last time we received a message
}

// Configuration
const MAX_CONNECTIONS_PER_USER = 5; // Allow multiple devices/tabs
const CLEANUP_INTERVAL_MS = 60000; // Check for dead connections every 60s
const CONNECTION_TIMEOUT_MS = 300000; // Consider connection dead after 5min of inactivity
const MAX_TOTAL_CONNECTIONS = 1000; // Global limit to prevent abuse

// Track active WebSocket connections by user ID
// Changed to Map<userId, Map<connectionId, WebSocketClient>> to support multiple connections per user
const clients = new Map<string, Map<string, WebSocketClient>>();

// Track total connection count for global limit
let totalConnections = 0;

/**
 * Periodic cleanup of dead connections
 * Runs every 60 seconds to check for connections that haven't responded to heartbeat
 */
function startPeriodicCleanup() {
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [userId, userConnections] of clients.entries()) {
      for (const [connectionId, client] of userConnections.entries()) {
        const inactiveDuration = now - client.lastActivity;
        
        // Remove connections that are:
        // 1. Not alive (failed heartbeat)
        // 2. Inactive for too long
        // 3. Socket not in OPEN state
        if (
          !client.isAlive ||
          inactiveDuration > CONNECTION_TIMEOUT_MS ||
          client.socket.readyState !== WebSocket.OPEN
        ) {
          logger.warn('Cleaning up stale connection', {
            userId,
            connectionId,
            inactiveDuration,
            isAlive: client.isAlive,
            readyState: client.socket.readyState,
          });
          
          // Close socket if still open
          if (client.socket.readyState === WebSocket.OPEN) {
            client.socket.close();
          }
          
          // Clear heartbeat interval
          if (client.heartbeatInterval) {
            clearInterval(client.heartbeatInterval);
          }
          
          // Remove from map
          userConnections.delete(connectionId);
          totalConnections--;
          cleaned++;
        }
      }
      
      // Remove user entry if no connections left
      if (userConnections.size === 0) {
        clients.delete(userId);
      }
    }
    
    if (cleaned > 0) {
      logger.info('Periodic cleanup complete', {
        cleaned,
        totalConnections,
        activeUsers: clients.size,
      });
    }
  }, CLEANUP_INTERVAL_MS);
}

// Start periodic cleanup when module loads
startPeriodicCleanup();

/**
 * Set up WebSocket connection
 * Authentication happens AFTER connection via message
 */
export function setupWebSocketConnection() {
  let authenticated = false;
  let userId: string | null = null;
  let connectionId: string | null = null;
  let client: WebSocketClient | null = null;

  return {
    onOpen(_event: Event, ws: WebSocket) {
      // Check global connection limit
      if (totalConnections >= MAX_TOTAL_CONNECTIONS) {
        logger.warn('Global connection limit reached', { totalConnections });
        sendMessage(ws, {
          type: 'error',
          message: 'Server connection limit reached. Please try again later.',
        });
        ws.close();
        return;
      }
      
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
            const authenticatedUserId = payload['sub'] as string;
            userId = authenticatedUserId;
            authenticated = true;

            // Check if user is admin
            const userRepo = new UserRepository();
            const user = await userRepo.findById(authenticatedUserId);
            const isAdmin = user?.role === 'admin';

            logger.info('User authenticated', { userId: authenticatedUserId, isAdmin });

            // Check per-user connection limit
            const userConnections = clients.get(authenticatedUserId);
            if (userConnections && userConnections.size >= MAX_CONNECTIONS_PER_USER) {
              logger.warn('User connection limit reached', {
                userId: authenticatedUserId,
                currentConnections: userConnections.size,
                limit: MAX_CONNECTIONS_PER_USER,
              });
              
              // Close oldest connection to make room for new one
              const oldestConnection = Array.from(userConnections.values())
                .sort((a, b) => a.connectedAt - b.connectedAt)[0];
              
              if (oldestConnection) {
                logger.info('Closing oldest connection for user', {
                  userId,
                  oldConnectionId: oldestConnection.connectionId,
                });
                
                oldestConnection.socket.close();
                if (oldestConnection.heartbeatInterval) {
                  clearInterval(oldestConnection.heartbeatInterval);
                }
                userConnections.delete(oldestConnection.connectionId);
                totalConnections--;
              }
            }

            // Generate unique connection ID
            connectionId = crypto.randomUUID();
            const now = Date.now();

            // Create client
            const authenticatedClient: WebSocketClient = {
              socket: ws,
              userId: authenticatedUserId,
              isAdmin,
              isAlive: true,
              connectionId,
              connectedAt: now,
              lastActivity: now,
            };
            client = authenticatedClient;

            // Store client connection
            if (!clients.has(authenticatedUserId)) {
              clients.set(authenticatedUserId, new Map());
            }
            clients.get(authenticatedUserId)!.set(connectionId, authenticatedClient);
            totalConnections++;

            logger.debug('Sending connection confirmation', {
              userId: authenticatedUserId,
              connectionId,
              totalConnections,
            });
            
            // Send connection confirmation
            sendMessage(ws, {
              type: 'connected',
              message: 'WebSocket connection established',
              connectionId,
              timestamp: new Date().toISOString(),
            });

            // Send current unread count
            const unreadCount = await NotificationService.getUnreadCount(authenticatedUserId);
            sendMessage(ws, {
              type: 'unread_count',
              unreadCount,
            });

            // Start watching for notification changes (don't await - runs in background)
            watchNotifications(authenticatedUserId, connectionId, ws).catch(error => {
              logger.error('Watch notifications failed', error, { userId: authenticatedUserId, connectionId });
            });

            // Start heartbeat
            startHeartbeat(authenticatedClient);
            logger.info('WebSocket setup complete', { userId: authenticatedUserId });
          } catch (error) {
            logger.warn('Authentication failed', { error: error instanceof Error ? error.message : 'Unknown error' });
            sendMessage(ws, {
              type: 'auth_failed',
              message: 'Invalid or expired token',
            });
            ws.close();
            return;
          }
        } else if (authenticated && userId && connectionId) {
          // Handle regular messages
          handleClientMessage(userId, connectionId, data);

          // Update last activity and reset heartbeat on any message
          if (client) {
            client.isAlive = true;
            client.lastActivity = Date.now();
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
      if (userId && connectionId) {
        logger.info('User disconnected', { userId, connectionId });
        
        // Clear heartbeat interval if exists
        if (client?.heartbeatInterval) {
          clearInterval(client.heartbeatInterval);
        }
        
        // Remove this specific connection
        const userConnections = clients.get(userId);
        if (userConnections) {
          userConnections.delete(connectionId);
          totalConnections--;
          
          // Remove user entry if no connections left
          if (userConnections.size === 0) {
            clients.delete(userId);
          }
          
          logger.debug('Connection cleaned up', {
            userId,
            connectionId,
            remainingConnectionsForUser: userConnections.size,
            totalConnections,
          });
        }
      } else {
        logger.debug('Unauthenticated connection closed');
      }
    },

    onError(error: Event) {
      logger.error('WebSocket error', error);
      
      if (userId && connectionId) {
        // Clear heartbeat interval
        if (client?.heartbeatInterval) {
          clearInterval(client.heartbeatInterval);
        }
        
        // Remove this specific connection
        const userConnections = clients.get(userId);
        if (userConnections) {
          userConnections.delete(connectionId);
          totalConnections--;
          
          // Remove user entry if no connections left
          if (userConnections.size === 0) {
            clients.delete(userId);
          }
        }
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
async function watchNotifications(userId: string, connectionId: string, socket: WebSocket) {
  const kv = await getKv();

  try {
    const signalKey: Deno.KvKey = ['notification_updates', userId];
    
    logger.debug('Setting up notification watcher', { userId, connectionId });
    
    const watcher = kv.watch([signalKey]);
    let isFirstEvent = true;

    for await (const entries of watcher) {
      // Check if socket is still open and connection still exists
      const userConnections = clients.get(userId);
      const connection = userConnections?.get(connectionId);
      
      if (!connection || socket.readyState !== WebSocket.OPEN) {
        logger.debug('Socket closed or connection removed, stopping watcher', {
          userId,
          connectionId,
        });
        break;
      }

      // Skip the very first event (initial state when watch starts)
      if (isFirstEvent) {
        isFirstEvent = false;
        const signalEntry = entries[0];
        logger.debug('Skipping initial watcher state', {
          userId,
          connectionId,
          initialValue: signalEntry.value,
        });
        continue;
      }

      const signalEntry = entries[0];
      logger.debug('Watcher detected notification change', {
        userId,
        connectionId,
        timestamp: signalEntry.value,
      });
      
      // Update last activity
      if (connection) {
        connection.lastActivity = Date.now();
      }
      
      await sendNotificationUpdate(userId, socket);
    }
  } catch (error) {
    logger.error('Watcher error', error, { userId, connectionId });
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
function handleClientMessage(userId: string, connectionId: string, data: unknown) {
  const userConnections = clients.get(userId);
  const client = userConnections?.get(connectionId);
  
  if (!client) {
    logger.warn('Message from unknown connection', { userId, connectionId });
    return;
  }
  
  // Type guard for message data
  if (!data || typeof data !== 'object' || !('type' in data)) {
    logger.warn('Invalid message format', { userId, connectionId });
    return;
  }
  
  const messageData = data as { type: string; limit?: number };
  
  switch (messageData.type) {
    case 'ping':
      // Client sent ping, respond with pong
      sendMessage(client.socket, { type: 'pong' });
      break;

    case 'pong':
      // Client responded to our ping - heartbeat is alive
      // isAlive is already set to true before this function is called
      break;

    case 'fetch_notifications':
      // Client requesting fresh data
      NotificationService.getUserNotifications(userId, {
        limit: messageData.limit || 10,
      }).then((notifications) => {
        // Re-check client still exists
        const currentClient = clients.get(userId)?.get(connectionId);
        if (currentClient) {
          sendMessage(currentClient.socket, {
            type: 'notifications_list',
            notifications,
          });
        }
      });
      break;

    case 'subscribe_jobs':
      // Client wants real-time job updates
      logger.info('User subscribed to job updates', { userId, connectionId });
      sendMessage(client.socket, {
        type: 'jobs_subscribed',
        message: 'Subscribed to job updates',
      });
      break;

    case 'unsubscribe_jobs':
      // Client no longer wants job updates
      logger.info('User unsubscribed from job updates', { userId, connectionId });
      break;

    default:
      logger.warn('Unknown message type', { userId, connectionId, type: messageData.type });
  }
}

/**
 * Send message to WebSocket client
 */
function sendMessage(socket: WebSocket, data: unknown) {
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
      logger.warn('Client failed heartbeat', {
        userId: client.userId,
        connectionId: client.connectionId,
      });
      
      // Close socket
      client.socket.close();
      
      // Remove from clients map
      const userConnections = clients.get(client.userId);
      if (userConnections) {
        userConnections.delete(client.connectionId);
        totalConnections--;
        
        // Remove user entry if no connections left
        if (userConnections.size === 0) {
          clients.delete(client.userId);
        }
      }
      
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
 * Broadcast notification to a specific user (all their connections)
 */
export function notifyUser(userId: string, notification: unknown) {
  const userConnections = clients.get(userId);
  
  // Type guard for notification
  const notificationData = notification && typeof notification === 'object' && 'id' in notification
    ? (notification as { id: string })
    : null;
  
  logger.debug('notifyUser called', {
    userId,
    notificationId: notificationData?.id,
    hasConnections: !!userConnections,
    connectionCount: userConnections?.size || 0,
  });
  
  if (!userConnections) {
    logger.debug('No connections found for user', { userId });
    return;
  }
  
  const message = {
    type: 'new_notification',
    notification,
    timestamp: new Date().toISOString(),
  };
  
  let sentCount = 0;
  // Send to all of user's connections
  userConnections.forEach((client) => {
    if (client.socket.readyState === WebSocket.OPEN) {
      sendMessage(client.socket, message);
      sentCount++;
    }
  });
  
  logger.debug('Sent new_notification to connections', { sentCount });
}

/**
 * Send a custom message to a specific user (all their connections)
 * Use this when you need to send a message with a specific type/structure
 */
export function sendToUser(userId: string, message: unknown) {
  const userConnections = clients.get(userId);
  
  // Type guard for message
  if (!message || typeof message !== 'object') {
    logger.warn('Invalid message format in sendToUser', { userId });
    return;
  }
  
  const messageData = message as Record<string, unknown>;
  
  logger.debug('sendToUser called', {
    userId,
    messageType: messageData['type'],
    hasConnections: !!userConnections,
    connectionCount: userConnections?.size || 0,
  });
  
  if (!userConnections) {
    logger.debug('No connections found for user', { userId });
    return;
  }
  
  // Add timestamp if not present
  const messageWithTimestamp = {
    ...messageData,
    timestamp: messageData['timestamp'] || new Date().toISOString(),
  };
  
  let sentCount = 0;
  // Send to all of user's connections
  userConnections.forEach((client) => {
    if (client.socket.readyState === WebSocket.OPEN) {
      sendMessage(client.socket, messageWithTimestamp);
      sentCount++;
    }
  });
  
  logger.debug('Sent message to connections', { sentCount, messageType: messageData['type'] });
}

/**
 * Broadcast to all connected clients
 */
export function broadcast(message: unknown) {
  clients.forEach((userConnections) => {
    userConnections.forEach((client) => {
      if (client.socket.readyState === WebSocket.OPEN) {
        sendMessage(client.socket, message);
      }
    });
  });
}

/**
 * Broadcast job update to all connected admin clients
 */
export function broadcastJobUpdate(jobData: unknown) {
  const message = {
    type: 'job_update',
    job: jobData,
    timestamp: new Date().toISOString(),
  };
  
  clients.forEach((userConnections) => {
    userConnections.forEach((client) => {
      // Only send job updates to admin users
      if (client.isAdmin && client.socket.readyState === WebSocket.OPEN) {
        sendMessage(client.socket, message);
      }
    });
  });
}

/**
 * Broadcast job stats update to all connected admin clients
 */
export function broadcastJobStats(stats: unknown) {
  const message = {
    type: 'job_stats_update',
    stats,
    timestamp: new Date().toISOString(),
  };
  
  clients.forEach((userConnections) => {
    userConnections.forEach((client) => {
      // Only send job stats to admin users
      if (client.isAdmin && client.socket.readyState === WebSocket.OPEN) {
        sendMessage(client.socket, message);
      }
    });
  });
}

/**
 * Get connection statistics
 */
export function getConnectionStats() {
  const userConnectionCounts = new Map<string, number>();
  
  clients.forEach((userConnections, userId) => {
    userConnectionCounts.set(userId, userConnections.size);
  });
  
  return {
    totalConnections,
    activeUsers: clients.size,
    connectedUsers: Array.from(clients.keys()),
    connectionsPerUser: Object.fromEntries(userConnectionCounts),
    maxConnectionsPerUser: MAX_CONNECTIONS_PER_USER,
    maxTotalConnections: MAX_TOTAL_CONNECTIONS,
  };
}

/**
 * Disconnect all connections for a specific user
 */
export function disconnectUser(userId: string) {
  const userConnections = clients.get(userId);
  if (!userConnections) return;
  
  userConnections.forEach((client) => {
    if (client.heartbeatInterval) {
      clearInterval(client.heartbeatInterval);
    }
    client.socket.close();
    totalConnections--;
  });
  
  clients.delete(userId);
  
  logger.info('Disconnected all connections for user', {
    userId,
    count: userConnections.size,
  });
}

/**
 * Disconnect a specific connection
 */
export function disconnectConnection(userId: string, connectionId: string) {
  const userConnections = clients.get(userId);
  if (!userConnections) return;
  
  const client = userConnections.get(connectionId);
  if (!client) return;
  
  if (client.heartbeatInterval) {
    clearInterval(client.heartbeatInterval);
  }
  
  client.socket.close();
  userConnections.delete(connectionId);
  totalConnections--;
  
  // Remove user entry if no connections left
  if (userConnections.size === 0) {
    clients.delete(userId);
  }
  
  logger.info('Disconnected specific connection', { userId, connectionId });
}

/**
 * Disconnect all users
 */
export function disconnectAll() {
  clients.forEach((userConnections) => {
    userConnections.forEach((client) => {
      if (client.heartbeatInterval) {
        clearInterval(client.heartbeatInterval);
      }
      client.socket.close();
    });
  });
  
  clients.clear();
  totalConnections = 0;
  
  logger.info('Disconnected all connections');
}
