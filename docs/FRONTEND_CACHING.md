# Frontend Caching Strategy

## Overview

Frontend components implement intelligent caching to reduce unnecessary API calls and improve performance. This is especially important for components that users interact with frequently, like notification dropdowns.

## Notification Bell Caching

### Problem

The NotificationBell component was fetching notifications from the API **every time** the dropdown opened/closed, even if the data was already fresh. This created unnecessary load:

- User opens dropdown → API fetch
- User closes dropdown
- User opens dropdown again 2 seconds later → **Another API fetch** ❌

For a user checking notifications multiple times per minute, this could result in dozens of unnecessary requests.

### Solution: Time-Based Cache with Expiration

Implemented a 30-second cache expiration strategy:

```typescript
const lastFetchTimeRef = useRef<number>(0);
const CACHE_EXPIRY_MS = 30 * 1000; // 30 seconds

const fetchNotifications = async (force = false) => {
  // Check cache expiration
  const now = Date.now();
  const timeSinceLastFetch = now - lastFetchTimeRef.current;
  
  if (!force && timeSinceLastFetch < CACHE_EXPIRY_MS) {
    console.log(`Using cached data (${Math.round(timeSinceLastFetch / 1000)}s old)`);
    return; // Skip fetch, use cached data
  }
  
  // Fetch from API...
  lastFetchTimeRef.current = Date.now(); // Update timestamp
};
```

### Cache Behavior

**Cached (No Fetch):**
- User opens dropdown
- Data was fetched < 30 seconds ago
- ✅ **Use cached data** (instant, no API call)

**Fetch from API:**
- User opens dropdown
- Data was fetched > 30 seconds ago
- ✅ **Fetch fresh data** from API

**Force Refresh (Bypass Cache):**
- WebSocket receives real-time update
- User performs action (mark as read, delete)
- ✅ **Force refresh** to ensure latest data

### Implementation Details

**1. Cache Key: Last Fetch Timestamp**
```typescript
const lastFetchTimeRef = useRef<number>(0);
```

Uses a ref (not state) to avoid triggering re-renders when timestamp updates.

**2. Cache Expiration Check**
```typescript
const timeSinceLastFetch = now - lastFetchTimeRef.current;
if (!force && timeSinceLastFetch < CACHE_EXPIRY_MS) {
  return; // Use cache
}
```

**3. Force Parameter for Real-Time Updates**
```typescript
// WebSocket receives new notification
case 'new_notification':
  if (isOpen) {
    fetchNotifications(true); // Force refresh, bypass cache
  }
```

**4. Cache Invalidation on Mutations**
```typescript
// After marking all as read
if (response.ok) {
  setNotifications(...);
  lastFetchTimeRef.current = 0; // Invalidate cache
}
```

### Performance Impact

**Before (No Cache):**
```
User opens dropdown:          1 API call
User closes dropdown:         0 calls
User opens again (2s later):  1 API call  ❌ Unnecessary!
User opens again (5s later):  1 API call  ❌ Unnecessary!
Total in 10 seconds:          3 API calls
```

**After (30s Cache):**
```
User opens dropdown:          1 API call
User closes dropdown:         0 calls
User opens again (2s later):  0 calls  ✅ Cache hit!
User opens again (5s later):  0 calls  ✅ Cache hit!
User opens again (35s later): 1 API call (cache expired)
Total in 10 seconds:          1 API call
```

**Reduction: 67% fewer API calls** for typical usage patterns.

### Cache Expiration Time Selection

**Why 30 seconds?**

| Duration | Pros | Cons | Use Case |
|----------|------|------|----------|
| **5-10s** | Very fresh data | Many API calls | Critical real-time data |
| **30s** ✅ | Good balance | Rare staleness | Notifications, feeds |
| **1-5min** | Very few API calls | Possibly stale | Static content, settings |
| **No expiration** | Zero redundant calls | Stale data | Never appropriate for user data |

**30 seconds** is ideal for notifications because:
- ✅ Fresh enough for good UX (users rarely check more than once per 30s)
- ✅ Reduces API load significantly
- ✅ WebSocket provides real-time updates anyway
- ✅ Force refresh on user actions ensures consistency

### WebSocket + Cache Strategy

The component uses **both** WebSocket and HTTP caching:

**WebSocket Role:**
- Real-time unread count updates
- Instant notification for new items
- Triggers force refresh when needed

**HTTP Cache Role:**
- Prevents redundant fetches on dropdown open/close
- Provides instant UI updates from cached data
- Fallback when WebSocket disconnected

**Together:**
```
WebSocket connected + Cache fresh:
  → Instant UI updates, zero redundant API calls ✅

WebSocket disconnected + Cache fresh:
  → Instant UI updates from cache, polling every 30s ✅

WebSocket connected + Cache stale:
  → WebSocket updates count, cache refreshes on dropdown open ✅
```

## Best Practices

### 1. Use Time-Based Expiration for User Data

```typescript
// ✅ Good: Cache with expiration
const CACHE_EXPIRY_MS = 30 * 1000;
if (timeSinceLastFetch < CACHE_EXPIRY_MS) return;

// ❌ Bad: No expiration (data becomes stale)
if (hasCachedData) return;
```

### 2. Provide Force Refresh Mechanism

```typescript
// ✅ Good: Force parameter
const fetchData = async (force = false) => {
  if (!force && isCacheFresh) return;
  // ... fetch
};

// Force on WebSocket events
case 'update':
  fetchData(true); // Bypass cache
```

### 3. Invalidate Cache on Mutations

```typescript
// ✅ Good: Invalidate after mutation
await markAsRead(id);
lastFetchTimeRef.current = 0; // Force next fetch

// ❌ Bad: Keep stale cache after mutation
await markAsRead(id);
// Cache not invalidated, UI shows stale data
```

### 4. Use Refs for Cache Metadata

```typescript
// ✅ Good: Use ref (no re-renders)
const lastFetchTimeRef = useRef<number>(0);

// ❌ Bad: Use state (triggers unnecessary re-renders)
const [lastFetchTime, setLastFetchTime] = useState<number>(0);
```

### 5. Log Cache Hits/Misses for Debugging

```typescript
if (isCacheFresh) {
  console.log(`Using cached data (${age}s old)`);
  return;
}
console.log('Cache expired, fetching fresh data');
```

## Cache Strategies Comparison

### Time-Based Expiration (Current Implementation) ✅

**How it works:** Cache data for N seconds, then refetch.

**Pros:**
- Simple to implement
- Predictable behavior
- Good balance of freshness and performance

**Cons:**
- May refetch even if data hasn't changed
- Fixed expiration regardless of actual data volatility

**Best for:** Frequently updated data with acceptable staleness window (notifications, feeds, stats)

### Stale-While-Revalidate (Alternative)

**How it works:** Return cached data immediately, fetch fresh data in background.

```typescript
const fetchData = async () => {
  // Return cache immediately
  if (hasCachedData) {
    callback(cachedData); // Use stale data
    
    // Fetch fresh data in background
    const fresh = await api.fetch();
    cache.set(fresh);
    callback(fresh); // Update with fresh data
  }
};
```

**Pros:**
- Instant UI updates (no loading state)
- Fresh data fetched in background

**Cons:**
- More complex implementation
- UI updates twice (stale → fresh)
- Still makes API calls on every interaction

**Best for:** Non-critical data where staleness is acceptable (avatars, user profiles, public content)

### Cache-First with Background Sync (Alternative)

**How it works:** Always use cache, sync with server periodically or on explicit refresh.

```typescript
// Use cache
const data = cache.get() || defaultData;

// Sync in background every 5 minutes
setInterval(() => {
  const fresh = await api.fetch();
  cache.set(fresh);
}, 5 * 60 * 1000);
```

**Pros:**
- Minimal API calls
- Instant UI updates

**Cons:**
- Data can be very stale
- Requires background sync strategy

**Best for:** Rarely changing data (settings, preferences, static content)

### Network-First (Not Recommended for This Use Case)

**How it works:** Always fetch from network, use cache only if network fails.

```typescript
try {
  return await api.fetch();
} catch {
  return cache.get(); // Fallback
}
```

**Pros:**
- Always fresh data

**Cons:**
- Maximum API load
- Slow UX (wait for network every time)

**Best for:** Critical data that must be fresh (financial transactions, security settings)

## Migration Guide

### Before (No Caching)

```typescript
const fetchData = async () => {
  const response = await fetch(url);
  setData(await response.json());
};

useEffect(() => {
  if (isOpen) {
    fetchData(); // Fetches every time
  }
}, [isOpen]);
```

### After (Time-Based Cache)

```typescript
const lastFetchRef = useRef<number>(0);
const CACHE_EXPIRY_MS = 30 * 1000;

const fetchData = async (force = false) => {
  const age = Date.now() - lastFetchRef.current;
  if (!force && age < CACHE_EXPIRY_MS) {
    console.log(`Using cache (${Math.round(age/1000)}s old)`);
    return;
  }
  
  const response = await fetch(url);
  setData(await response.json());
  lastFetchRef.current = Date.now();
};

useEffect(() => {
  if (isOpen) {
    fetchData(false); // Uses cache if fresh
  }
}, [isOpen]);

// Force refresh on real-time updates
ws.onmessage = (event) => {
  if (event.data.type === 'update') {
    fetchData(true); // Bypass cache
  }
};
```

## Testing

### Manual Testing

**1. Test Cache Hit:**
```
1. Open notification dropdown → API call ✅
2. Close dropdown
3. Open dropdown again within 30s → No API call ✅
4. Check console: "Using cached data (Xs old)"
```

**2. Test Cache Expiration:**
```
1. Open dropdown → API call ✅
2. Wait 35 seconds
3. Open dropdown → API call ✅ (cache expired)
```

**3. Test Force Refresh:**
```
1. Open dropdown → API call ✅
2. Receive WebSocket notification
3. Check: API call triggered ✅ (force refresh)
```

**4. Test Cache Invalidation:**
```
1. Open dropdown → API call ✅
2. Mark all as read
3. Open dropdown → API call ✅ (cache invalidated)
```

### Automated Testing

```typescript
describe('Notification Caching', () => {
  it('should use cache when data is fresh', () => {
    const component = mount(<NotificationBell />);
    
    // First fetch
    component.find('button').simulate('click');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    
    // Second fetch within 30s
    component.find('button').simulate('click');
    expect(fetchMock).toHaveBeenCalledTimes(1); // No new call
  });
  
  it('should fetch when cache expires', async () => {
    jest.useFakeTimers();
    const component = mount(<NotificationBell />);
    
    // First fetch
    component.find('button').simulate('click');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    
    // Advance time 31 seconds
    jest.advanceTimersByTime(31000);
    
    // Second fetch
    component.find('button').simulate('click');
    expect(fetchMock).toHaveBeenCalledTimes(2); // New call
  });
});
```

## Monitoring

### Cache Hit Rate Metric

```typescript
let cacheHits = 0;
let cacheMisses = 0;

const fetchData = async (force = false) => {
  const isCacheFresh = (Date.now() - lastFetchRef.current) < CACHE_EXPIRY_MS;
  
  if (!force && isCacheFresh) {
    cacheHits++;
    console.log(`Cache hit rate: ${(cacheHits / (cacheHits + cacheMisses) * 100).toFixed(1)}%`);
    return;
  }
  
  cacheMisses++;
  // ... fetch
};
```

**Target:** 60-80% cache hit rate for good balance.

### Performance Monitoring

```typescript
const fetchData = async (force = false) => {
  const startTime = performance.now();
  
  if (isCacheFresh && !force) {
    const duration = performance.now() - startTime;
    console.log(`Cache hit: ${duration.toFixed(2)}ms`);
    return;
  }
  
  await fetch(...);
  const duration = performance.now() - startTime;
  console.log(`API fetch: ${duration.toFixed(2)}ms`);
};
```

**Expected:** 
- Cache hit: < 1ms
- API fetch: 50-200ms

## See Also

- [WebSocket Documentation](./WEBSOCKET_JOBS.md) - Real-time updates
- [API Documentation](./API_DOCUMENTATION.md) - REST endpoints
- [Performance Optimization](./IMPROVEMENT_RECOMMENDATIONS.md) - Other optimizations
