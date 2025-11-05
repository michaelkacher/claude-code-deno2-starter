# WebSocket-Based Job Updates

## Overview

The JobDashboard now uses WebSockets for real-time job updates instead of polling. This provides:
- **Instant updates** when job status changes
- **Reduced server load** (no repeated polling requests)
- **Better UX** with immediate feedback
- **Lower rate limit usage** (one WebSocket connection vs 6 requests/min)

## How It Works

### Backend (Server)

1. **Queue Integration** (`backend/lib/queue.ts`):
   - When a job status changes (`running`, `completed`, `failed`, `retrying`), the queue broadcasts an update via WebSocket
   - Uses `broadcastJobUpdate(job)` to send updates to all connected admin clients

2. **WebSocket Handler** (`backend/lib/notification-websocket.ts`):
   - Clients subscribe to job updates with `{ type: 'subscribe_jobs' }` message
   - Server broadcasts job updates with `{ type: 'job_update', job: {...} }` messages
   - Also supports `{ type: 'job_stats_update', stats: {...} }` for statistics

### Frontend (Client)

**JobDashboard** (`frontend/islands/admin/JobDashboard.tsx`):
1. Connects to WebSocket at `/api/notifications/ws`
2. Authenticates with access token
3. Subscribes to job updates
4. Updates UI in real-time when messages received
5. Falls back to initial fetch on connection/reconnection

## Message Types

### Client → Server

```typescript
// Authenticate
{ type: 'auth', token: 'jwt_token_here' }

// Subscribe to job updates
{ type: 'subscribe_jobs' }

// Unsubscribe from job updates
{ type: 'unsubscribe_jobs' }

// Heartbeat (optional)
{ type: 'ping' }
```

### Server → Client

```typescript
// Connection established
{ type: 'connected', message: 'WebSocket connection established' }

// Job subscribed
{ type: 'jobs_subscribed', message: 'Subscribed to job updates' }

// Job status changed
{
  type: 'job_update',
  job: {
    id: 'job_123',
    name: 'send-email',
    status: 'running',
    // ... other job fields
  },
  timestamp: '2025-11-05T...'
}

// Stats updated
{
  type: 'job_stats_update',
  stats: {
    pending: 5,
    running: 2,
    completed: 100,
    failed: 3,
    total: 110
  },
  timestamp: '2025-11-05T...'
}

// Heartbeat response
{ type: 'pong' }

// Authentication failed
{ type: 'auth_failed', message: 'Invalid or expired token' }
```

## Implementation Details

### Automatic Broadcasting

The queue automatically broadcasts updates when:
- Job starts running (`status: 'running'`)
- Job completes (`status: 'completed'`)
- Job fails and retries (`status: 'retrying'`)
- Job permanently fails (`status: 'failed'`)

### Error Handling

WebSocket broadcasting is non-critical:
- If WebSocket fails, the queue continues processing jobs normally
- Errors are logged as debug messages, not errors
- The dashboard will still work, just without real-time updates

### Connection Management

- **Heartbeat**: Server pings clients every 30 seconds
- **Auto-reconnect**: Frontend can implement reconnection logic
- **Cleanup**: Connections are properly closed on component unmount

## Comparison: Polling vs WebSocket

### Old Approach (Polling)
```typescript
setInterval(() => {
  fetchJobs();      // 1 request
  fetchStats();     // 1 request
  fetchSchedules(); // 1 request
}, 30000);          // Every 30 seconds
```
**Cost**: 6 requests per minute = 90 requests per 15 minutes

### New Approach (WebSocket)
```typescript
// Initial fetch
fetchJobs();
fetchStats();
fetchSchedules();

// Then receive real-time updates
ws.onmessage = (event) => {
  // Update UI immediately when changes occur
}
```
**Cost**: 1 WebSocket connection + updates only when jobs change

## Benefits

1. **Reduced Rate Limiting**:
   - Eliminates 90% of API requests
   - WebSocket connection doesn't count against rate limits
   - Updates only sent when something changes

2. **Better Performance**:
   - No wasted requests when nothing changes
   - Instant updates when jobs complete
   - Lower server CPU/memory usage

3. **Improved UX**:
   - Immediate feedback on job status
   - No 30-second delay
   - Real-time progress tracking

4. **Scalability**:
   - WebSocket connections are more efficient than repeated HTTP requests
   - Server can push updates to thousands of clients
   - Reduces database queries (no repeated fetches)

## Migration from Polling

The change was made automatically. No manual migration needed:
- Old polling code removed
- WebSocket connection established in useEffect
- Same UI components, just updated in real-time

## Troubleshooting

### WebSocket Connection Fails

**Symptoms**: Console shows "WebSocket error" or "Connection refused"

**Solutions**:
1. Check backend is running on port 8000
2. Verify WebSocket endpoint is accessible: `ws://localhost:8000/api/notifications/ws`
3. Check for proxy/firewall blocking WebSocket connections
4. Verify CORS configuration allows WebSocket upgrades

### Jobs Don't Update in Real-Time

**Symptoms**: Dashboard shows old data, doesn't update when jobs run

**Solutions**:
1. Check browser console for WebSocket messages
2. Verify authentication succeeded (look for `{ type: 'connected' }` message)
3. Ensure `subscribe_jobs` message was sent
4. Check backend logs for broadcast errors
5. Try refreshing the page to re-establish connection

### Authentication Errors

**Symptoms**: `{ type: 'auth_failed' }` message received

**Solutions**:
1. Check access token is valid in localStorage
2. Try logging out and logging back in
3. Verify JWT_SECRET matches between sessions
4. Check token hasn't expired (15-minute lifetime)

## Testing

### Manual Testing
1. Open admin jobs dashboard
2. Open browser console to see WebSocket messages
3. Create a test job via API or queue
4. Watch dashboard update in real-time
5. Verify no polling requests in Network tab

### Automated Testing
See `tests/integration/websocket_jobs_test.ts` for WebSocket integration tests.

## Related Files

- `backend/lib/queue.ts` - Job queue with WebSocket broadcasting
- `backend/lib/notification-websocket.ts` - WebSocket connection handler
- `frontend/islands/admin/JobDashboard.tsx` - Real-time dashboard
- `backend/routes/notifications.ts` - WebSocket endpoint setup

## Future Enhancements

Potential improvements:
- **Selective updates**: Only send updates for jobs the user created
- **Pagination support**: Handle large job lists efficiently  
- **Filter sync**: Sync filters across multiple tabs
- **Reconnection logic**: Auto-reconnect with exponential backoff
- **Connection status indicator**: Show online/offline status
- **Optimistic updates**: Update UI before server confirmation
