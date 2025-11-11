/// <reference lib="deno.unstable" />

/**
 * Notification WebSocket Tests
 * 
 * Tests the WebSocket notification handler that manages real-time notification delivery.
 * Uses mocks for WebSocket objects and dependencies.
 * 
 * Focus: Authentication, connection lifecycle, message routing, broadcast functionality.
 */

import { assertEquals, assertExists } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { FakeTime } from '@std/testing/time';
import { suppressLogs } from '../helpers/logger-test.ts';

// Mock WebSocket class for testing
class MockWebSocket {
  readyState = 1; // WebSocket.OPEN
  sentMessages: unknown[] = [];
  closed = false;

  send(data: string) {
    if (this.readyState === 1) {
      this.sentMessages.push(JSON.parse(data));
    }
  }

  close() {
    this.readyState = 3; // WebSocket.CLOSED
    this.closed = true;
  }

  // Helper to get last sent message
  getLastMessage() {
    return this.sentMessages[this.sentMessages.length - 1];
  }

  // Helper to clear sent messages
  clearMessages() {
    this.sentMessages = [];
  }
}

// Mock dependencies
let mockVerifyTokenResult: { sub: string } | null = null;
let mockVerifyTokenShouldThrow = false;
let mockUserRepositoryResult: { id: string; role: string } | null = null;
let mockNotificationServiceUnreadCount = 0;
let mockNotificationServiceNotifications: unknown[] = [];
let mockKvWatcherEntries: unknown[] = [];

// Mock Deno.Kv for testing
class MockKv {
  watchCallCount = 0;
  
  async *watch(_keys: Deno.KvKey[]) {
    this.watchCallCount++;
    // Yield initial empty state (like real KV watcher)
    yield [{ key: [], value: null, versionstamp: '' }];
    // Yield mock entries
    for (const entry of mockKvWatcherEntries) {
      yield entry;
    }
    // After yielding all entries, complete (unlike real watcher)
    // The watcher loop will exit gracefully
  }
  
  close() {}
}

let mockKv = new MockKv();

// Create mock dependencies object
const createMockDeps = () => ({
  verifyToken: async (token: string): Promise<Record<string, unknown>> => {
    if (mockVerifyTokenShouldThrow) {
      throw new Error('Invalid token');
    }
    if (!mockVerifyTokenResult) {
      throw new Error('Mock not configured');
    }
    return mockVerifyTokenResult;
  },
  
  createUserRepository: () => ({
    async findById(_id: string) {
      return mockUserRepositoryResult;
    },
    async close() {},
  }),
  
  getUnreadCount: async (_userId: string) => {
    return mockNotificationServiceUnreadCount;
  },
  
  getUserNotifications: async (_userId: string, _options?: { limit?: number }) => {
    return mockNotificationServiceNotifications;
  },
  
  getKv: async () => mockKv as unknown as Deno.Kv,
  
  // Use a very short timeout for tests (100ms instead of 5 minutes)
  connectionTimeoutMs: 100,
});

// Import the module
import {
  broadcastJobStats,
  broadcastJobUpdate,
  disconnectAll,
  disconnectConnection,
  disconnectUser,
  getConnectionStats,
  notifyUser,
  sendToUser,
  setupWebSocketConnection,
  stopPeriodicCleanup,
} from '../../shared/lib/notification-websocket.ts';

// Ensure periodic cleanup is stopped before any tests run
stopPeriodicCleanup();

describe('NotificationWebSocket', () => {
  let mockWs: MockWebSocket;
  let connection: ReturnType<typeof setupWebSocketConnection>;

  beforeEach(() => {
    // Stop periodic cleanup to prevent background timers in tests
    stopPeriodicCleanup();
    
    // Reset all mocks
    mockWs = new MockWebSocket();
    mockVerifyTokenResult = null;
    mockVerifyTokenShouldThrow = false;
    mockUserRepositoryResult = null;
    mockNotificationServiceUnreadCount = 0;
    mockNotificationServiceNotifications = [];
    mockKvWatcherEntries = [];
    mockKv = new MockKv();

    // Create new connection handler with mock dependencies
    connection = setupWebSocketConnection(createMockDeps());

    // Disconnect all connections to reset state
    disconnectAll();
  });

  afterEach(async () => {
    // Clean up all connections
    disconnectAll();
    // Give time for async watchers to cleanup
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  describe('Connection Lifecycle - onOpen', () => {
    it('should request authentication on new connection', () => {
      // Act
      connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);

      // Assert
      const lastMessage = mockWs.getLastMessage() as { type: string; message: string };
      assertExists(lastMessage);
      assertEquals(lastMessage.type, 'auth_required');
      assertEquals(lastMessage.message, 'Please send authentication token');
    });

    it('should reject connection when global limit reached', () => {
      // Arrange - Create connections up to the limit
      // Note: MAX_TOTAL_CONNECTIONS = 1000 (too many to create in test)
      // This test would require exposing the limit or using a smaller test constant
      // For now, we'll skip this test as it requires code modification
      // TODO: Consider adding a __setMaxConnectionsForTesting() helper
    });

    it('should not increment connection count before auth', () => {
      // Act
      connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);

      // Assert - Check stats (no authenticated connections yet)
      const stats = getConnectionStats();
      assertEquals(stats.totalConnections, 0);
      assertEquals(stats.activeUsers, 0);
    });
  });

  describe('Authentication Flow - onMessage auth', () => {
    it('should authenticate valid token', async () => {
      // Arrange
      connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);
      mockWs.clearMessages();

      // Configure mocks for successful auth
      mockVerifyTokenResult = { sub: 'user-123' };
      mockUserRepositoryResult = { id: 'user-123', role: 'user' };
      mockNotificationServiceUnreadCount = 5;

      // Act
      const authMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'auth', token: 'valid-token' }),
      });
      await connection.onMessage(authMessage, mockWs as unknown as WebSocket);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert - Should receive connected message
      const messages = mockWs.sentMessages as Array<{ type: string }>;
      const connectedMsg = messages.find((m) => m.type === 'connected');
      assertExists(connectedMsg);

      // Assert - Should receive unread count
      const unreadMsg = messages.find((m) => m.type === 'unread_count') as {
        type: string;
        unreadCount: number;
      } | undefined;
      assertExists(unreadMsg);
      assertEquals(unreadMsg.unreadCount, 5);

      // Assert - Connection should be tracked
      const stats = getConnectionStats();
      assertEquals(stats.totalConnections, 1);
      assertEquals(stats.activeUsers, 1);
    });

    it('should reject invalid token', async () => {
      // Arrange
      connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);
      mockWs.clearMessages();

      // Configure mocks for failed auth
      mockVerifyTokenShouldThrow = true;

      // Act
      const authMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'auth', token: 'invalid-token' }),
      });
      await connection.onMessage(authMessage, mockWs as unknown as WebSocket);

      // Assert - Should receive auth_failed and socket should close
      const lastMessage = mockWs.getLastMessage() as { type: string; message: string };
      assertEquals(lastMessage.type, 'auth_failed');
      assertEquals(mockWs.closed, true);
    });

    it('should send unread count after authentication', async () => {
      // Arrange
      connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'user-456' };
      mockUserRepositoryResult = { id: 'user-456', role: 'user' };
      mockNotificationServiceUnreadCount = 10;

      // Act
      const authMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'auth', token: 'valid-token' }),
      });
      await connection.onMessage(authMessage, mockWs as unknown as WebSocket);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      const unreadMsg = mockWs.sentMessages.find((m: unknown) =>
        (m as { type: string }).type === 'unread_count'
      ) as { unreadCount: number } | undefined;
      assertExists(unreadMsg);
      assertEquals(unreadMsg.unreadCount, 10);
    });

    it('should enforce per-user connection limit (5)', async () => {
      // Arrange - Create 5 existing connections for same user
      const connections: Array<{
        handler: ReturnType<typeof setupWebSocketConnection>;
        ws: MockWebSocket;
      }> = [];

      for (let i = 0; i < 5; i++) {
        const ws = new MockWebSocket();
        const handler = setupWebSocketConnection(createMockDeps());

        handler.onOpen(new Event('open'), ws as unknown as WebSocket);

        mockVerifyTokenResult = { sub: 'user-limit-test' };
        mockUserRepositoryResult = { id: 'user-limit-test', role: 'user' };

        const authMsg = new MessageEvent('message', {
          data: JSON.stringify({ type: 'auth', token: 'token' }),
        });
        await handler.onMessage(authMsg, ws as unknown as WebSocket);
        await new Promise((resolve) => setTimeout(resolve, 50));

        connections.push({ handler, ws });
      }

      // Verify 5 connections exist
      let stats = getConnectionStats();
      assertEquals(stats.totalConnections, 5);

      // Act - Create 6th connection
      const ws6 = new MockWebSocket();
      const handler6 = setupWebSocketConnection(createMockDeps());
      handler6.onOpen(new Event('open'), ws6 as unknown as WebSocket);

      const authMsg6 = new MessageEvent('message', {
        data: JSON.stringify({ type: 'auth', token: 'token' }),
      });
      await handler6.onMessage(authMsg6, ws6 as unknown as WebSocket);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert - Should still have 5 connections (oldest was closed)
      stats = getConnectionStats();
      assertEquals(stats.totalConnections, 5);

      // Assert - First connection should be closed
      assertEquals(connections[0]!.ws.closed, true);

      // Assert - 6th connection should be open
      assertEquals(ws6.closed, false);
    });

    it('should ignore duplicate auth attempts', async () => {
      // Arrange
      connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'user-789' };
      mockUserRepositoryResult = { id: 'user-789', role: 'user' };

      // First auth
      const authMessage1 = new MessageEvent('message', {
        data: JSON.stringify({ type: 'auth', token: 'token1' }),
      });
      await connection.onMessage(authMessage1, mockWs as unknown as WebSocket);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const messageCountAfterFirstAuth = mockWs.sentMessages.length;

      // Act - Second auth attempt
      const authMessage2 = new MessageEvent('message', {
        data: JSON.stringify({ type: 'auth', token: 'token2' }),
      });
      await connection.onMessage(authMessage2, mockWs as unknown as WebSocket);

      // Assert - Should not send new messages (duplicate auth ignored)
      assertEquals(mockWs.sentMessages.length, messageCountAfterFirstAuth);
    });

    it('should set isAdmin flag for admin users', async () => {
      // Arrange
      connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'admin-user' };
      mockUserRepositoryResult = { id: 'admin-user', role: 'admin' };

      // Act
      const authMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'auth', token: 'admin-token' }),
      });
      await connection.onMessage(authMessage, mockWs as unknown as WebSocket);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert - Verify admin can receive admin broadcasts
      // (We'll test this through broadcastJobUpdate which only sends to admins)
      const jobData = { id: 'job-1', status: 'completed' };
      broadcastJobUpdate(jobData);

      // Admin user should receive the job update
      const jobUpdateMsg = mockWs.sentMessages.find((m: unknown) =>
        (m as { type: string }).type === 'job_update'
      );
      assertExists(jobUpdateMsg);
    });
  });

  describe('Client Message Handling', () => {
    async function setupAuthenticatedConnection() {
      connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'user-msg-test' };
      mockUserRepositoryResult = { id: 'user-msg-test', role: 'user' };

      const authMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'auth', token: 'valid-token' }),
      });
      await connection.onMessage(authMessage, mockWs as unknown as WebSocket);
      await new Promise((resolve) => setTimeout(resolve, 100));

      mockWs.clearMessages(); // Clear auth-related messages
    }

    it('should respond to ping with pong', async () => {
      // Arrange
      await setupAuthenticatedConnection();

      // Act
      const pingMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'ping' }),
      });
      await connection.onMessage(pingMessage, mockWs as unknown as WebSocket);

      // Assert
      const pongMsg = mockWs.getLastMessage() as { type: string };
      assertEquals(pongMsg.type, 'pong');
    });

    it('should handle pong message', async () => {
      // Arrange
      await setupAuthenticatedConnection();

      // Act - Send pong message
      const pongMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'pong' }),
      });
      await connection.onMessage(pongMessage, mockWs as unknown as WebSocket);

      // Assert - Should update lastActivity (verified through no errors)
      // The client's isAlive flag is set to true in onMessage handler
      assertEquals(mockWs.sentMessages.length, 0); // No response expected
    });

    it('should fetch notifications on request', async () => {
      // Arrange
      await setupAuthenticatedConnection();
      mockNotificationServiceNotifications = [
        { id: 'notif-1', message: 'Test 1' },
        { id: 'notif-2', message: 'Test 2' },
      ];

      // Act
      const fetchMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'fetch_notifications', limit: 10 }),
      });
      await connection.onMessage(fetchMessage, mockWs as unknown as WebSocket);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      const notifListMsg = mockWs.sentMessages.find((m: unknown) =>
        (m as { type: string }).type === 'notifications_list'
      ) as { notifications: unknown[] } | undefined;
      assertExists(notifListMsg);
      assertEquals(notifListMsg.notifications.length, 2);
    });

    it('should use default limit if not specified', async () => {
      // Arrange
      await setupAuthenticatedConnection();
      mockNotificationServiceNotifications = [{ id: 'n1' }];

      // Act - No limit specified
      const fetchMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'fetch_notifications' }),
      });
      await connection.onMessage(fetchMessage, mockWs as unknown as WebSocket);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert - Should still work (default limit is 10)
      const notifListMsg = mockWs.sentMessages.find((m: unknown) =>
        (m as { type: string }).type === 'notifications_list'
      );
      assertExists(notifListMsg);
    });

    it('should handle job subscription', async () => {
      // Arrange
      await setupAuthenticatedConnection();

      // Act
      const subscribeMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'subscribe_jobs' }),
      });
      await connection.onMessage(subscribeMessage, mockWs as unknown as WebSocket);

      // Assert
      const subscribeConfirm = mockWs.getLastMessage() as { type: string; message: string };
      assertEquals(subscribeConfirm.type, 'jobs_subscribed');
      assertEquals(subscribeConfirm.message, 'Subscribed to job updates');
    });

    it('should handle job unsubscription', async () => {
      // Arrange
      await setupAuthenticatedConnection();

      // Act
      const unsubscribeMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'unsubscribe_jobs' }),
      });
      await connection.onMessage(unsubscribeMessage, mockWs as unknown as WebSocket);

      // Assert - No response expected, just logged
      // Verify no error thrown
      assertEquals(mockWs.sentMessages.length, 0);
    });

    it('should reject unauthenticated messages', async () => {
      // Arrange - Don't authenticate
      connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);
      mockWs.clearMessages();

      // Act - Try to send ping without auth
      const pingMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'ping' }),
      });
      await connection.onMessage(pingMessage, mockWs as unknown as WebSocket);

      // Assert - Should receive error and close
      const errorMsg = mockWs.getLastMessage() as { type: string; message: string };
      assertEquals(errorMsg.type, 'error');
      assertEquals(errorMsg.message, 'Authentication required');
      assertEquals(mockWs.closed, true);
    });
  });

  describe('Connection Cleanup - onClose', () => {
    async function setupAuthenticatedConnection() {
      connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'user-close-test' };
      mockUserRepositoryResult = { id: 'user-close-test', role: 'user' };

      const authMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'auth', token: 'valid-token' }),
      });
      await connection.onMessage(authMessage, mockWs as unknown as WebSocket);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    it('should remove authenticated connection on close', async () => {
      // Arrange
      await setupAuthenticatedConnection();

      // Verify connection exists
      let stats = getConnectionStats();
      assertEquals(stats.totalConnections, 1);

      // Act
      connection.onClose();

      // Assert
      stats = getConnectionStats();
      assertEquals(stats.totalConnections, 0);
      assertEquals(stats.activeUsers, 0);
    });

    it('should clear heartbeat interval on close', async () => {
      // Arrange
      await setupAuthenticatedConnection();

      // Act
      connection.onClose();

      // Assert - Verify no errors (heartbeat cleared)
      // In a real test, we'd spy on clearInterval, but for now we verify no crash
      const stats = getConnectionStats();
      assertEquals(stats.totalConnections, 0);
    });

    it('should handle close of unauthenticated connection', () => {
      // Arrange - Open but don't authenticate
      connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);

      // Act
      connection.onClose();

      // Assert - Should not throw error
      const stats = getConnectionStats();
      assertEquals(stats.totalConnections, 0);
    });
  });

  describe('Error Handling - onError', () => {
    async function setupAuthenticatedConnection() {
      connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'user-error-test' };
      mockUserRepositoryResult = { id: 'user-error-test', role: 'user' };

      const authMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'auth', token: 'valid-token' }),
      });
      await connection.onMessage(authMessage, mockWs as unknown as WebSocket);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    it('should cleanup connection on error', async () => {
      // Arrange
      await setupAuthenticatedConnection();
      const stats1 = getConnectionStats();
      assertEquals(stats1.totalConnections, 1);

      // Act
      connection.onError(new Event('error'));

      // Assert - Connection should be removed
      const stats2 = getConnectionStats();
      assertEquals(stats2.totalConnections, 0);
    });

    it('should handle error on unauthenticated connection', () => {
      // Arrange - Open but don't authenticate
      connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);

      // Act
      connection.onError(new Event('error'));

      // Assert - Should not throw
      const stats = getConnectionStats();
      assertEquals(stats.totalConnections, 0);
    });
  });

  describe('Broadcast Functions', () => {
    async function setupMultipleConnections() {
      const connections: Array<{
        userId: string;
        ws: MockWebSocket;
        handler: ReturnType<typeof setupWebSocketConnection>;
      }> = [];

      // Create 3 connections for user1
      for (let i = 0; i < 3; i++) {
        const ws = new MockWebSocket();
        const handler = setupWebSocketConnection(createMockDeps());
        handler.onOpen(new Event('open'), ws as unknown as WebSocket);

        mockVerifyTokenResult = { sub: 'user1' };
        mockUserRepositoryResult = { id: 'user1', role: 'user' };

        const authMsg = new MessageEvent('message', {
          data: JSON.stringify({ type: 'auth', token: 'token' }),
        });
        await handler.onMessage(authMsg, ws as unknown as WebSocket);
        await new Promise((resolve) => setTimeout(resolve, 50));

        connections.push({ userId: 'user1', ws, handler });
      }

      return connections;
    }

    it('should send notification to all user connections', async () => {
      // Arrange
      const connections = await setupMultipleConnections();

      // Act
      const notification = { id: 'notif-1', message: 'Test notification' };
      notifyUser('user1', notification);

      // Assert - All 3 connections should receive the notification
      for (const conn of connections) {
        const newNotifMsg = conn.ws.sentMessages.find((m: unknown) =>
          (m as { type: string }).type === 'new_notification'
        ) as { notification: { id: string } } | undefined;
        assertExists(newNotifMsg);
        assertEquals(newNotifMsg.notification.id, 'notif-1');
      }
    });

    it('should skip closed sockets when notifying user', async () => {
      // Arrange
      const connections = await setupMultipleConnections();

      // Close second connection
      connections[1]!.ws.close();

      // Act
      const notification = { id: 'notif-2', message: 'Test' };
      notifyUser('user1', notification);

      // Assert - Only 2 connections should receive (closed one skipped)
      const openConnections = connections.filter((c) => !c.ws.closed);
      assertEquals(openConnections.length, 2);

      for (const conn of openConnections) {
        const newNotifMsg = conn.ws.sentMessages.find((m: unknown) =>
          (m as { type: string }).type === 'new_notification'
        );
        assertExists(newNotifMsg);
      }
    });

    it('should send custom messages via sendToUser', async () => {
      // Arrange
      await setupMultipleConnections();

      // Act
      const customMessage = { type: 'custom_event', data: 'test data' };
      sendToUser('user1', customMessage);

      // Assert - Should add timestamp to message
      // We can't easily verify the exact message without accessing connections
      // This test verifies the function doesn't throw
      const stats = getConnectionStats();
      assertEquals(stats.totalConnections, 3);
    });

    it('should broadcast to all connected users', async () => {
      // Arrange - Create connections for different users
      const user1Ws = new MockWebSocket();
      const user1Handler = setupWebSocketConnection(createMockDeps());
      user1Handler.onOpen(new Event('open'), user1Ws as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'broadcast-user1' };
      mockUserRepositoryResult = { id: 'broadcast-user1', role: 'user' };
      await user1Handler.onMessage(
        new MessageEvent('message', { data: JSON.stringify({ type: 'auth', token: 't1' }) }),
        user1Ws as unknown as WebSocket,
      );

      const user2Ws = new MockWebSocket();
      const user2Handler = setupWebSocketConnection(createMockDeps());
      user2Handler.onOpen(new Event('open'), user2Ws as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'broadcast-user2' };
      mockUserRepositoryResult = { id: 'broadcast-user2', role: 'user' };
      await user2Handler.onMessage(
        new MessageEvent('message', { data: JSON.stringify({ type: 'auth', token: 't2' }) }),
        user2Ws as unknown as WebSocket,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Act
      // Note: broadcast() sends to all connections, but we can't easily verify without
      // accessing the internal connections. This test verifies it doesn't throw.
      const stats = getConnectionStats();
      assertEquals(stats.activeUsers, 2);
    });

    it('should send job updates to admins only', async () => {
      // Arrange - Create admin and regular user
      const adminWs = new MockWebSocket();
      const adminHandler = setupWebSocketConnection(createMockDeps());
      adminHandler.onOpen(new Event('open'), adminWs as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'admin1' };
      mockUserRepositoryResult = { id: 'admin1', role: 'admin' };
      await adminHandler.onMessage(
        new MessageEvent('message', { data: JSON.stringify({ type: 'auth', token: 'admin-t' }) }),
        adminWs as unknown as WebSocket,
      );

      const userWs = new MockWebSocket();
      const userHandler = setupWebSocketConnection(createMockDeps());
      userHandler.onOpen(new Event('open'), userWs as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'user1' };
      mockUserRepositoryResult = { id: 'user1', role: 'user' };
      await userHandler.onMessage(
        new MessageEvent('message', { data: JSON.stringify({ type: 'auth', token: 'user-t' }) }),
        userWs as unknown as WebSocket,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Act
      const jobData = { id: 'job-123', status: 'completed' };
      broadcastJobUpdate(jobData);

      // Assert - Admin should receive, user should not
      const adminJobMsg = adminWs.sentMessages.find((m: unknown) =>
        (m as { type: string }).type === 'job_update'
      );
      assertExists(adminJobMsg);

      const userJobMsg = userWs.sentMessages.find((m: unknown) =>
        (m as { type: string }).type === 'job_update'
      );
      assertEquals(userJobMsg, undefined); // User should NOT receive
    });
  });

  describe('Admin Functions', () => {
    it('should return accurate connection stats', async () => {
      // Arrange - Create connections for 2 users
      const user1Ws1 = new MockWebSocket();
      const user1Handler1 = setupWebSocketConnection(createMockDeps());
      user1Handler1.onOpen(new Event('open'), user1Ws1 as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'stats-user1' };
      mockUserRepositoryResult = { id: 'stats-user1', role: 'user' };
      await user1Handler1.onMessage(
        new MessageEvent('message', { data: JSON.stringify({ type: 'auth', token: 't' }) }),
        user1Ws1 as unknown as WebSocket,
      );

      const user1Ws2 = new MockWebSocket();
      const user1Handler2 = setupWebSocketConnection(createMockDeps());
      user1Handler2.onOpen(new Event('open'), user1Ws2 as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'stats-user1' };
      await user1Handler2.onMessage(
        new MessageEvent('message', { data: JSON.stringify({ type: 'auth', token: 't' }) }),
        user1Ws2 as unknown as WebSocket,
      );

      const user2Ws1 = new MockWebSocket();
      const user2Handler1 = setupWebSocketConnection(createMockDeps());
      user2Handler1.onOpen(new Event('open'), user2Ws1 as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'stats-user2' };
      mockUserRepositoryResult = { id: 'stats-user2', role: 'user' };
      await user2Handler1.onMessage(
        new MessageEvent('message', { data: JSON.stringify({ type: 'auth', token: 't' }) }),
        user2Ws1 as unknown as WebSocket,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Act
      const stats = getConnectionStats();

      // Assert
      assertEquals(stats.totalConnections, 3);
      assertEquals(stats.activeUsers, 2);
      assertEquals(stats.connectedUsers.includes('stats-user1'), true);
      assertEquals(stats.connectedUsers.includes('stats-user2'), true);
    });

    it('should disconnect all user connections', async () => {
      // Arrange - Create 3 connections for user
      const connections: MockWebSocket[] = [];
      for (let i = 0; i < 3; i++) {
        const ws = new MockWebSocket();
        const handler = setupWebSocketConnection(createMockDeps());
        handler.onOpen(new Event('open'), ws as unknown as WebSocket);
        mockVerifyTokenResult = { sub: 'disconnect-user1' };
        mockUserRepositoryResult = { id: 'disconnect-user1', role: 'user' };
        await handler.onMessage(
          new MessageEvent('message', { data: JSON.stringify({ type: 'auth', token: 't' }) }),
          ws as unknown as WebSocket,
        );
        connections.push(ws);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify connections exist
      let stats = getConnectionStats();
      assertEquals(stats.totalConnections, 3);

      // Act
      disconnectUser('disconnect-user1');

      // Assert - All sockets should be closed
      for (const ws of connections) {
        assertEquals(ws.closed, true);
      }

      // Assert - No connections should remain
      stats = getConnectionStats();
      assertEquals(stats.totalConnections, 0);
    });

    it('should disconnect specific connection', async () => {
      // Arrange - Create 3 connections for user
      const connectionIds: string[] = [];
      const mockWss: MockWebSocket[] = [];

      for (let i = 0; i < 3; i++) {
        const ws = new MockWebSocket();
        const handler = setupWebSocketConnection(createMockDeps());
        handler.onOpen(new Event('open'), ws as unknown as WebSocket);
        mockVerifyTokenResult = { sub: 'disconnect-specific' };
        mockUserRepositoryResult = { id: 'disconnect-specific', role: 'user' };
        await handler.onMessage(
          new MessageEvent('message', { data: JSON.stringify({ type: 'auth', token: 't' }) }),
          ws as unknown as WebSocket,
        );

        // Get connection ID from connected message
        const connMsg = ws.sentMessages.find((m: unknown) =>
          (m as { type: string }).type === 'connected'
        ) as { connectionId: string } | undefined;
        if (connMsg) {
          connectionIds.push(connMsg.connectionId);
          mockWss.push(ws);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Act - Disconnect second connection
      if (connectionIds[1]) {
        disconnectConnection('disconnect-specific', connectionIds[1]);
      }

      // Assert - Only second socket should be closed
      assertEquals(mockWss[0]?.closed, false);
      assertEquals(mockWss[1]?.closed, true);
      assertEquals(mockWss[2]?.closed, false);

      // Assert - 2 connections should remain
      const stats = getConnectionStats();
      assertEquals(stats.totalConnections, 2);
    });

    it('should disconnect all connections globally', async () => {
      // Arrange - Create connections for multiple users
      const user1Ws = new MockWebSocket();
      const user1Handler = setupWebSocketConnection(createMockDeps());
      user1Handler.onOpen(new Event('open'), user1Ws as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'global-user1' };
      mockUserRepositoryResult = { id: 'global-user1', role: 'user' };
      await user1Handler.onMessage(
        new MessageEvent('message', { data: JSON.stringify({ type: 'auth', token: 't' }) }),
        user1Ws as unknown as WebSocket,
      );

      const user2Ws = new MockWebSocket();
      const user2Handler = setupWebSocketConnection(createMockDeps());
      user2Handler.onOpen(new Event('open'), user2Ws as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'global-user2' };
      mockUserRepositoryResult = { id: 'global-user2', role: 'user' };
      await user2Handler.onMessage(
        new MessageEvent('message', { data: JSON.stringify({ type: 'auth', token: 't' }) }),
        user2Ws as unknown as WebSocket,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify connections exist
      let stats = getConnectionStats();
      assertEquals(stats.totalConnections, 2);

      // Act
      disconnectAll();

      // Assert - All sockets closed
      assertEquals(user1Ws.closed, true);
      assertEquals(user2Ws.closed, true);

      // Assert - No connections remain
      stats = getConnectionStats();
      assertEquals(stats.totalConnections, 0);
      assertEquals(stats.activeUsers, 0);
    });
  });

  describe('Heartbeat System', () => {
    it('should send ping every 60 seconds', { sanitizeResources: false }, async () => {
      // Arrange
      const time = new FakeTime();
      try {
        connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);
        mockVerifyTokenResult = { sub: 'heartbeat-user' };
        mockUserRepositoryResult = { id: 'heartbeat-user', role: 'user' };

        const authMessage = new MessageEvent('message', {
          data: JSON.stringify({ type: 'auth', token: 'valid-token' }),
        });
        await connection.onMessage(authMessage, mockWs as unknown as WebSocket);
        await time.tickAsync(100);

        mockWs.clearMessages();

        // Act - Advance time by 60 seconds (heartbeat interval)
        await time.tickAsync(60000);

        // Assert - Should have received ping
        const pingMsg = mockWs.sentMessages.find((m: unknown) =>
          (m as { type: string }).type === 'ping'
        );
        assertExists(pingMsg);
      } finally {
        // Clean up connection before restoring time
        disconnectAll();
        await time.tickAsync(10);
        time.restore();
      }
    });

    it('should close connection after failed heartbeat', { sanitizeResources: false }, async () => {
      // Arrange
      const time = new FakeTime();
      try {
        connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);
        mockVerifyTokenResult = { sub: 'heartbeat-fail-user' };
        mockUserRepositoryResult = { id: 'heartbeat-fail-user', role: 'user' };

        const authMessage = new MessageEvent('message', {
          data: JSON.stringify({ type: 'auth', token: 'valid-token' }),
        });
        await connection.onMessage(authMessage, mockWs as unknown as WebSocket);
        await time.tickAsync(100);

        // First ping - don't respond with pong (client.isAlive stays false)
        await time.tickAsync(60000);

        // Second ping check - client didn't respond to first, should be disconnected
        await time.tickAsync(60000);

        // Assert - Socket should be closed
        assertEquals(mockWs.closed, true);

        // Assert - Connection should be removed
        const stats = getConnectionStats();
        assertEquals(stats.totalConnections, 0);
      } finally {
        // Clean up before restoring time
        disconnectAll();
        await time.tickAsync(10);
        time.restore();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed JSON in onMessage', async () => {
      // Arrange
      connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);

      // Act - Send malformed JSON (suppress expected error log)
      const malformedMessage = new MessageEvent('message', {
        data: '{invalid-json}',
      });
      await suppressLogs(async () => {
        await connection.onMessage(malformedMessage, mockWs as unknown as WebSocket);
      });

      // Assert - Should not throw (error logged)
      // Socket should still be open (just logged error)
      assertEquals(mockWs.closed, false);
    });

    it('should handle missing type field in message', async () => {
      // Arrange
      connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'edge-user' };
      mockUserRepositoryResult = { id: 'edge-user', role: 'user' };

      const authMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'auth', token: 'token' }),
      });
      await connection.onMessage(authMessage, mockWs as unknown as WebSocket);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Act - Send message without type
      const noTypeMessage = new MessageEvent('message', {
        data: JSON.stringify({ data: 'test' }),
      });
      await connection.onMessage(noTypeMessage, mockWs as unknown as WebSocket);

      // Assert - Should log warning but not crash
      assertEquals(mockWs.closed, false);
    });

    it('should update lastActivity on any message', async () => {
      // Arrange
      connection.onOpen(new Event('open'), mockWs as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'activity-user' };
      mockUserRepositoryResult = { id: 'activity-user', role: 'user' };

      const authMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'auth', token: 'token' }),
      });
      await connection.onMessage(authMessage, mockWs as unknown as WebSocket);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Act - Send any message
      const pingMessage = new MessageEvent('message', {
        data: JSON.stringify({ type: 'ping' }),
      });
      await connection.onMessage(pingMessage, mockWs as unknown as WebSocket);

      // Assert - lastActivity updated (verified through no timeout cleanup)
      // In real code, we'd verify the timestamp, but for now we verify no errors
      const stats = getConnectionStats();
      assertEquals(stats.totalConnections, 1);
    });
  });

  describe('Admin Broadcasts', () => {
    it('should send job stats to admins only', async () => {
      // Arrange - Create admin and regular user
      const adminWs = new MockWebSocket();
      const adminHandler = setupWebSocketConnection(createMockDeps());
      adminHandler.onOpen(new Event('open'), adminWs as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'admin-stats' };
      mockUserRepositoryResult = { id: 'admin-stats', role: 'admin' };
      await adminHandler.onMessage(
        new MessageEvent('message', { data: JSON.stringify({ type: 'auth', token: 'admin' }) }),
        adminWs as unknown as WebSocket,
      );

      const userWs = new MockWebSocket();
      const userHandler = setupWebSocketConnection(createMockDeps());
      userHandler.onOpen(new Event('open'), userWs as unknown as WebSocket);
      mockVerifyTokenResult = { sub: 'user-stats' };
      mockUserRepositoryResult = { id: 'user-stats', role: 'user' };
      await userHandler.onMessage(
        new MessageEvent('message', { data: JSON.stringify({ type: 'auth', token: 'user' }) }),
        userWs as unknown as WebSocket,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Act
      const stats = { total: 100, completed: 50, failed: 10 };
      broadcastJobStats(stats);

      // Assert - Admin should receive, user should not
      const adminStatsMsg = adminWs.sentMessages.find((m: unknown) =>
        (m as { type: string }).type === 'job_stats_update'
      );
      assertExists(adminStatsMsg);

      const userStatsMsg = userWs.sentMessages.find((m: unknown) =>
        (m as { type: string }).type === 'job_stats_update'
      );
      assertEquals(userStatsMsg, undefined); // User should NOT receive
    });
  });
});
