# Query Result Pagination Limits

## Problem Identified ✅

**Issue**: No enforced maximum limits on query results - users could request unlimited items per page.

**Impact**:
- Potential DoS via large result sets
- Database/memory exhaustion
- Slow response times
- Poor user experience

---

## Solution Implemented ✅

### Centralized Pagination Utility

Created `backend/lib/pagination.ts` with enforced limits and standardized pagination handling.

**Key Features**:
- ✅ Maximum limit enforcement (default: 100 items)
- ✅ Minimum limit enforcement (default: 1 item)
- ✅ Default limit when not specified (default: 10 items)
- ✅ Cursor-based pagination support
- ✅ Offset-based pagination support
- ✅ Type-safe pagination parameters
- ✅ Standardized response format

---

## Configuration

### Default Limits

```typescript
// backend/lib/pagination.ts

export const PAGINATION_CONFIG = {
  DEFAULT_LIMIT: 10,   // Default items per page
  MAX_LIMIT: 100,      // Maximum items per page (hard limit)
  MIN_LIMIT: 1,        // Minimum items per page
} as const;
```

### Tuning Recommendations

**High-Traffic API:**
```typescript
DEFAULT_LIMIT: 10   // Smaller default
MAX_LIMIT: 50       // Lower maximum
```

**Low-Traffic Admin Panel:**
```typescript
DEFAULT_LIMIT: 25   // Larger default  
MAX_LIMIT: 200      // Higher maximum for power users
```

**Mobile API:**
```typescript
DEFAULT_LIMIT: 5    // Very small for mobile
MAX_LIMIT: 20       // Keep responses small
```

---

## Usage

### Basic Usage

```typescript
import { getPaginationParams } from './lib/pagination.ts';

app.get('/api/users', async (c) => {
  // Extract and validate pagination params
  const { limit, cursor } = getPaginationParams(c);
  
  // Use validated params (limit is guaranteed to be 1-100)
  const users = await userService.findAll({ limit, cursor });
  
  return c.json({ data: users });
});
```

### With Custom Limits

```typescript
// Allow up to 50 items for this specific endpoint
const { limit, cursor } = getPaginationParams(c, {
  maxLimit: 50,
  defaultLimit: 20
});
```

### Creating Paginated Response

```typescript
import { createPaginatedResponse } from './lib/pagination.ts';

app.get('/api/users', async (c) => {
  const { limit, cursor } = getPaginationParams(c);
  const users = await userService.findAll({ limit, cursor });
  
  return c.json(createPaginatedResponse(users, {
    limit,
    cursor,
    nextCursor: 'abc123',
    hasMore: true,
    total: 156
  }));
});
```

### Response Format

```json
{
  "data": [
    { "id": 1, "name": "User 1" },
    { "id": 2, "name": "User 2" }
  ],
  "pagination": {
    "limit": 10,
    "cursor": "previous-cursor",
    "nextCursor": "next-cursor",
    "hasMore": true,
    "total": 156
  }
}
```

---

## Pagination Strategies

### 1. Cursor-Based Pagination (Recommended)

**Best for**: Large datasets, real-time data, infinite scroll

```typescript
import { getPaginationParams, getNextCursor, parseCursor } from './lib/pagination.ts';

app.get('/api/users', async (c) => {
  const { limit, cursor } = getPaginationParams(c);
  
  // Fetch limit + 1 to detect if more results exist
  const entries = [];
  const listOptions: any = { limit: limit + 1 };
  
  if (cursor) {
    listOptions.cursor = parseCursor(cursor);
  }
  
  for await (const entry of kv.list({ prefix: ['users'] }, listOptions)) {
    entries.push(entry);
  }
  
  // Take only requested limit
  const items = entries.slice(0, limit).map(e => e.value);
  const nextCursor = getNextCursor(entries, limit);
  
  return c.json(createPaginatedResponse(items, {
    limit,
    cursor,
    nextCursor,
    hasMore: !!nextCursor
  }));
});
```

**Pros:**
- ✅ Consistent performance regardless of page number
- ✅ No skipped/duplicate items when data changes
- ✅ Works with real-time data

**Cons:**
- ❌ Can't jump to specific page
- ❌ Can't show total page count

### 2. Offset-Based Pagination

**Best for**: Admin panels, static data, when users need page numbers

```typescript
import { getOffsetLimit } from './lib/pagination.ts';

app.get('/api/users', async (c) => {
  const page = parseInt(c.req.query('page') || '1', 10);
  const pageSize = parseInt(c.req.query('limit') || '10', 10);
  
  // Validate and enforce limits
  const { offset, limit } = getOffsetLimit(page, pageSize);
  
  // Fetch all users (in-memory filtering)
  const allUsers = await getAllUsers();
  
  // Apply pagination
  const paginatedUsers = allUsers.slice(offset, offset + limit);
  const total = allUsers.length;
  const totalPages = Math.ceil(total / limit);
  
  return c.json({
    data: paginatedUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
});
```

**Pros:**
- ✅ Can jump to any page
- ✅ Shows total pages
- ✅ Familiar to users

**Cons:**
- ❌ Performance degrades with higher page numbers
- ❌ Items can be skipped/duplicated if data changes
- ❌ Expensive for large datasets

### 3. Hybrid Approach

**Best for**: APIs that need both strategies

```typescript
app.get('/api/users', async (c) => {
  const { limit, cursor, offset } = getPaginationParams(c);
  
  if (cursor) {
    // Use cursor-based pagination
    return handleCursorPagination(c, limit, cursor);
  } else if (offset !== undefined) {
    // Use offset-based pagination
    return handleOffsetPagination(c, limit, offset);
  } else {
    // Default to cursor-based
    return handleCursorPagination(c, limit);
  }
});
```

---

## Limit Enforcement Examples

### Request Exceeding Maximum

```bash
# Request 500 items
GET /api/users?limit=500

# Response returns 100 items (MAX_LIMIT enforced)
{
  "data": [...],  // 100 items
  "pagination": {
    "limit": 100,  // Enforced maximum
    "hasMore": true
  }
}
```

### Request Below Minimum

```bash
# Request 0 items
GET /api/users?limit=0

# Response returns 1 item (MIN_LIMIT enforced)
{
  "data": [...],  // 1 item
  "pagination": {
    "limit": 1  // Enforced minimum
  }
}
```

### Invalid Limit

```bash
# Request with invalid limit
GET /api/users?limit=abc

# Response uses DEFAULT_LIMIT
{
  "data": [...],  // 10 items
  "pagination": {
    "limit": 10  // Default used
  }
}
```

### No Limit Specified

```bash
# No limit parameter
GET /api/users

# Response uses DEFAULT_LIMIT
{
  "data": [...],  // 10 items
  "pagination": {
    "limit": 10  // Default used
  }
}
```

---

## Validation Middleware

### Automatic Validation

```typescript
import { validatePagination } from './lib/pagination.ts';

// Apply to all paginated endpoints
app.get('/api/users', validatePagination(), async (c) => {
  // Pagination already validated before this handler runs
  const { limit, cursor } = getPaginationParams(c);
  // ...
});

// With custom limits
app.get('/api/admin/logs', 
  validatePagination({ maxLimit: 1000 }),
  async (c) => {
    // Admin endpoint can request up to 1000 items
    const { limit } = getPaginationParams(c);
    // ...
  }
);
```

---

## Performance Considerations

### Memory Usage

**Before (No Limits):**
```typescript
// User requests 1,000,000 items
GET /api/users?limit=1000000

// Server tries to load 1M records into memory
// Result: Out of memory crash 💥
```

**After (With Limits):**
```typescript
// User requests 1,000,000 items
GET /api/users?limit=1000000

// Server enforces MAX_LIMIT of 100
// Only 100 records loaded into memory ✅
```

### Database Queries

**Deno KV Optimization:**
```typescript
// Fetch exactly limit + 1 to detect more results
const entries = [];
for await (const entry of kv.list(
  { prefix: ['users'] },
  { limit: limit + 1 }  // Only fetch what we need
)) {
  entries.push(entry);
}

// Check if more results exist
const hasMore = entries.length > limit;
const items = entries.slice(0, limit);
```

### Response Size

With 100-item maximum:
- JSON response: ~10-50KB (compressed)
- Network transfer: <5KB (with gzip)
- Parse time: <10ms

Without limits:
- JSON response: Could be MB/GB
- Network transfer: Huge
- Parse time: Seconds

---

## Total Count Performance

### Avoid Expensive Counts

```typescript
// ❌ BAD: Count all items every request
const total = await countAllUsers();  // Scans entire database

// ✅ GOOD: Only count when explicitly requested
const includeTotal = c.req.query('include_total') === 'true';
const total = includeTotal ? await countAllUsers() : undefined;
```

### Cap Total Counts

```typescript
import { formatTotalCount } from './lib/pagination.ts';

// Return "10000+" instead of exact count for large datasets
const total = formatTotalCount(actualCount, 10000);

// Response
{
  "pagination": {
    "total": "10000+"  // Saves expensive count operation
  }
}
```

---

## Testing

### Run Tests

```bash
deno test tests/unit/pagination.test.ts
```

### Test Coverage

- ✅ Default limit usage
- ✅ Valid limit parsing
- ✅ Maximum limit enforcement
- ✅ Minimum limit enforcement
- ✅ Negative limit handling
- ✅ Invalid limit string handling
- ✅ Cursor parsing
- ✅ Offset parsing
- ✅ Custom limit overrides
- ✅ Paginated response creation
- ✅ Next cursor detection
- ✅ Offset calculation
- ✅ Total count formatting

---

## Migration Guide

### Updating Existing Endpoints

**Before:**
```typescript
app.get('/api/users', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10);
  // No maximum enforcement! User could request 999999
  const users = await getUsers(limit);
  return c.json({ data: users });
});
```

**After:**
```typescript
import { getPaginationParams, createPaginatedResponse } from './lib/pagination.ts';

app.get('/api/users', async (c) => {
  const { limit, cursor } = getPaginationParams(c); // Limits enforced!
  const users = await getUsers({ limit, cursor });
  return c.json(createPaginatedResponse(users, {
    limit,
    cursor,
    nextCursor: '...',
    hasMore: true
  }));
});
```

---

## Security Benefits

### Prevents DoS Attacks

**Attack Vector:**
```bash
# Attacker requests massive result set
curl "https://api.example.com/users?limit=99999999"
```

**Without Limits:**
- Server tries to load 99M records
- Database overwhelmed
- Memory exhausted
- Service crashes 💥

**With Limits:**
- Request limited to 100 items
- Attacker gets 100 results
- Service remains stable ✅

### Rate Limiting Integration

```typescript
// Pagination + rate limiting = double protection
app.get('/api/users',
  rateLimiters.api,  // Limit requests per IP
  validatePagination(),  // Limit items per request
  async (c) => {
    // Protected endpoint
  }
);
```

---

## Best Practices

### ✅ DO

- Always use `getPaginationParams()` for consistency
- Set appropriate `maxLimit` per endpoint (admin vs public)
- Return enforced `limit` in response (not requested)
- Document pagination in API docs
- Add `hasMore` flag for better UX
- Use cursor pagination for large datasets

### ❌ DON'T

- Don't trust user-provided limits without validation
- Don't fetch all data then paginate in memory (for large sets)
- Don't return total count for expensive queries
- Don't use offset pagination for real-time data
- Don't allow unlimited page sizes

---

## Related Documentation

- [RATE_LIMIT_OPTIMIZATION.md](RATE_LIMIT_OPTIMIZATION.md) - Rate limiting
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference
- [QUEUE_OPTIMIZATION.md](QUEUE_OPTIMIZATION.md) - Background jobs

---

**Status**: ✅ **COMPLETE**  
**Date**: November 5, 2025  
**Impact**: Prevents resource exhaustion, improves performance, better security
