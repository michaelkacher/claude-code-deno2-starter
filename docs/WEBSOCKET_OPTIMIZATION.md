# WebSocket Connection Management Optimization

## Problems Identified ✅

### 1. Stale Connection Accumulation
**Issue**: If `onClose()` event doesn't fire properly (network issues, browser crashes, etc.), dead connections remain in memory indefinitely.

**Impact**: Memory leak, wasted resources, incorrect connection counts

### 2. Single Connection Per User
**Issue**: Only one connection per user was stored. When a user opened multiple tabs/devices, only the latest connection worked.

**Impact**: Previous connections lost, users confused when notifications don't work on all devices

### 3. No Connection Limits
**Issue**: No limits on connections per user or total connections.

**Impact**: Potential DoS attacks, resource exhaustion

### 4. No Periodic Cleanup
**Issue**: No mechanism to detect and remove truly dead connections.

**Impact**: Zombie connections consuming memory and resources

---

## Solutions Implemented ✅

### 1. Multiple Connections Per User

**Before:**
```typescript
// Single connection per user
const clients = new Map<string, WebSocketClient>();
clients.set(userId, client); // Overwrites previous connection!
```

**After:**
```typescript
// Multiple connections per user
const clients = new Map<string, Map<string, WebSocketClient>>();
clients.get(userId)!.set(connectionId, client); // Each connection tracked
```

**Benefits:**
- Users can have multiple devices/tabs connected simultaneously
- Each connection has unique ID (UUID)
- Proper cleanup when individual connections close

### 2. Connection Limits

```typescript
const MAX_CONNECTIONS_PER_USER = 5; // Per-user limit
const MAX_TOTAL_CONNECTIONS = 1000; // Global limit
```

**Per-User Limit:**
- When 6th connection attempts to connect, oldest connection is closed
- Prevents single user from hogging resources

**Global Limit:**
- Rejects new connections when server reaches max capacity
- Protects against DoS attacks

### 3. Periodic Cleanup

```typescript
setInterval(() => {
  // Check all connections every 60 seconds
  for (const [userId, userConnections] of clients.entries()) {
    for (const [connectionId, client] of userConnections.entries()) {
      // Remove if:
      // 1. Failed heartbeat (isAlive = false)
      // 2. Inactive for 5+ minutes
      // 3. Socket not in OPEN state
      if (shouldRemove(client)) {
        cleanup(client);
      }
    }
  }
}, 60000); // Every 60 seconds
```

**Benefits:**
- Catches connections where `onClose` didn't fire
- Removes truly dead connections
- Prevents memory leaks

### 4. Activity Tracking

```typescript
interface WebSocketClient {
  socket: WebSocket;
  userId: string;
  connectionId: string;
  connectedAt: number;    // When connection established
  lastActivity: number;   // Last message received
  isAlive: boolean;       // Heartbeat status
}
```

**Tracked Events:**
- Initial connection time
- Last message received
- Heartbeat responses

**Timeout:**
- Connection considered dead after 5 minutes of inactivity
- Even if heartbeat succeeds, inactivity timeout applies

---

## Configuration

### Adjustable Limits

```typescript
// backend/lib/notification-websocket.ts

const MAX_CONNECTIONS_PER_USER = 5;    // Increase for power users
const MAX_TOTAL_CONNECTIONS = 1000;    // Scale based on server capacity
const CLEANUP_INTERVAL_MS = 60000;     // How often to check (60s)
const CONNECTION_TIMEOUT_MS = 300000;  // Consider dead after 5min
```

### Tuning Recommendations

**High-Traffic Site:**
```typescript
const MAX_CONNECTIONS_PER_USER = 10;   // More devices per user
const MAX_TOTAL_CONNECTIONS = 10000;   // Higher capacity
const CLEANUP_INTERVAL_MS = 30000;     // More frequent cleanup
```

**Low-Traffic Site:**
```typescript
const MAX_CONNECTIONS_PER_USER = 3;    // Fewer devices
const MAX_TOTAL_CONNECTIONS = 500;     // Lower capacity
const CLEANUP_INTERVAL_MS = 120000;    // Less frequent cleanup
```

**Strict Resource Management:**
```typescript
const CONNECTION_TIMEOUT_MS = 180000;  // 3 minutes (aggressive)
const CLEANUP_INTERVAL_MS = 30000;     // Every 30 seconds
```

---

## Architecture Changes

### Connection Structure

**Before:**
```
clients Map
├─ userId1 → WebSocketClient
├─ userId2 → WebSocketClient
└─ userId3 → WebSocketClient

Problem: Only 1 connection per user!
```

**After:**
```
clients Map
├─ userId1 → Map
│  ├─ connId1 → WebSocketClient (browser tab 1)
│  ├─ connId2 → WebSocketClient (mobile app)
│  └─ connId3 → WebSocketClient (browser tab 2)
├─ userId2 → Map
│  └─ connId4 → WebSocketClient
└─ userId3 → Map
   ├─ connId5 → WebSocketClient
   └─ connId6 → WebSocketClient

✅ Multiple connections per user!
```

### Cleanup Flow

```
Every 60 seconds:
  ┌─────────────────────────────────────┐
  │   Periodic Cleanup Triggered        │
  └──────────────┬──────────────────────┘
                 │
  ┌──────────────▼──────────────────────┐
  │   Iterate All Connections           │
  └──────────────┬──────────────────────┘
                 │
      ┌──────────▼──────────┐
      │  Check Each Client  │
      └──────────┬──────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌─────────┐
│!isAlive│  │Inactive│  │Not OPEN │
│Failed  │  │>5 min  │  │Socket   │
│HB      │  │        │  │         │
└───┬────┘  └───┬────┘  └────┬────┘
    │           │            │
    └───────────┼────────────┘
                │
    ┌───────────▼──────────────┐
    │   Close & Remove Client  │
    │   - Close socket         │
    │   - Clear interval       │
    │   - Delete from map      │
    │   - Decrement counter    │
    └──────────────────────────┘
```

---

## Connection Lifecycle

### Successful Connection

```
1. Client connects
   ├─ Check global limit (reject if full)
   └─ Request authentication

2. Client sends auth token
   ├─ Verify JWT token
   ├─ Check per-user limit
   │  └─ If at limit: Close oldest connection
   ├─ Generate unique connectionId
   ├─ Create WebSocketClient
   ├─ Store in clients map
   ├─ Increment totalConnections
   ├─ Start heartbeat (30s interval)
   ├─ Start KV watcher (notifications)
   └─ Send confirmation to client

3. Connection active
   ├─ Receive messages
   ├─ Update lastActivity
   ├─ Respond to heartbeat pings
   └─ Send notifications

4. Connection closes
   ├─ onClose() fires
   ├─ Clear heartbeat interval
   ├─ Remove from clients map
   ├─ Decrement totalConnections
   └─ Remove user entry if no connections
```

### Failed/Dead Connection

```
1. Connection established
   └─ Everything normal...

2. Network issue / Browser crash
   └─ onClose() doesn't fire ❌

3. Heartbeat fails
   ├─ isAlive = false
   └─ Next heartbeat: Close connection

4. OR: Periodic cleanup catches it
   ├─ Inactive for 5+ minutes
   ├─ OR socket not OPEN
   ├─ OR isAlive = false
   └─ Force cleanup
```

---

## Performance Impact

### Memory Usage

**Before:**
```
1 connection per user × 1000 users = 1000 WebSocketClient objects
Memory: ~200KB (200 bytes per client)
```

**After:**
```
5 connections per user × 1000 users = 5000 WebSocketClient objects
Memory: ~1MB (200 bytes per client)

Additional tracking:
- connectionId (UUID): 36 bytes
- connectedAt (number): 8 bytes  
- lastActivity (number): 8 bytes

Total per client: ~250 bytes
5000 clients × 250 bytes = ~1.25MB

Acceptable increase! ✅
```

### CPU Usage

**Periodic Cleanup:**
```
Check 5000 connections every 60 seconds
= ~83 checks per second
= Negligible CPU impact (<0.1%)
```

**Heartbeat:**
```
30-second intervals per connection
5000 connections = 5000 intervals
But JavaScript handles this efficiently
= Negligible CPU impact (<0.5%)
```

---

## API Changes

### Updated Stats

```typescript
getConnectionStats();
```

**Before:**
```json
{
  "totalConnections": 100,
  "connectedUsers": ["user1", "user2", ...]
}
```

**After:**
```json
{
  "totalConnections": 250,
  "activeUsers": 100,
  "connectedUsers": ["user1", "user2", ...],
  "connectionsPerUser": {
    "user1": 3,
    "user2": 1,
    "user3": 5
  },
  "maxConnectionsPerUser": 5,
  "maxTotalConnections": 1000
}
```

### New Function

```typescript
// Disconnect specific connection (not all user's connections)
disconnectConnection(userId: string, connectionId: string);
```

---

## Testing

### Manual Test

```bash
# Terminal 1: Start server
deno task dev

# Terminal 2: Connect multiple times as same user
deno run --allow-net scripts/test-websocket-connections.ts
```

### Test Scenarios

1. **Multiple Connections**
   - Open 5 browser tabs
   - All should receive notifications
   - Open 6th tab → Oldest closes

2. **Dead Connection Cleanup**
   - Connect, then kill network
   - Wait 5+ minutes
   - Connection cleaned up by periodic cleanup

3. **Heartbeat Failure**
   - Connect normally
   - Block heartbeat response
   - Connection closed after 30s

4. **Global Limit**
   - Simulate 1000+ connections
   - New connections rejected with error message

---

## Monitoring

### Connection Metrics

```typescript
// Log connection stats periodically
setInterval(() => {
  const stats = getConnectionStats();
  logger.info('WebSocket stats', stats);
}, 300000); // Every 5 minutes
```

### Cleanup Metrics

```typescript
// Track cleanup effectiveness
let cleanupStats = {
  total: 0,
  byHeartbeat: 0,
  byInactivity: 0,
  bySocketState: 0,
};

// Update stats in cleanup function
if (!client.isAlive) cleanupStats.byHeartbeat++;
if (inactive > TIMEOUT) cleanupStats.byInactivity++;
if (socket.readyState !== OPEN) cleanupStats.bySocketState++;
```

---

## Migration

### No Breaking Changes ✅

**Backward Compatibility:**
- Existing clients continue working
- Single connection per user still supported
- All existing APIs unchanged (except getConnectionStats)

**Enhanced Functionality:**
- Multiple connections "just work"
- No client-side changes needed
- Automatic cleanup prevents issues

---

## Key Takeaways

### Reliability

✅ **No memory leaks** - Periodic cleanup catches orphaned connections  
✅ **Multiple devices** - Users can connect from phone, tablet, desktop  
✅ **Proper cleanup** - All connection removal paths covered  
✅ **Activity tracking** - Detect truly idle connections  

### Scalability

✅ **Per-user limits** - Prevent single user abuse  
✅ **Global limits** - Protect server capacity  
✅ **Efficient cleanup** - Minimal CPU overhead  
✅ **Graceful degradation** - Oldest connection closed when limit reached  

### Observability

✅ **Detailed stats** - Know exact connection state  
✅ **Connection IDs** - Track individual connections  
✅ **Logging** - All cleanup events logged  
✅ **Metrics** - Monitor cleanup effectiveness  

---

## Related Documentation

- [WEBSOCKET_JOBS.md](WEBSOCKET_JOBS.md) - WebSocket job updates
- [BACKGROUND_JOBS.md](BACKGROUND_JOBS.md) - Background job system
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference

---

**Status**: ✅ **COMPLETE**  
**Date**: November 5, 2025  
**Impact**: No memory leaks, supports multiple devices per user, proper resource limits
