# Rate Limiting Guide

## Overview

This application uses rate limiting to protect against abuse and brute force attacks. Rate limits are **automatically more lenient in development mode** to make testing easier.

## Rate Limit Configuration

### Development Mode (DENO_ENV=development)
- **Auth endpoints** (login): 50 requests per 15 minutes
- **Signup**: 20 requests per hour
- **General API**: 1000 requests per 15 minutes
- **Email verification**: 20 requests per hour
- **Password reset**: 20 requests per hour

### Production Mode
- **Auth endpoints** (login): 5 requests per 15 minutes
- **Signup**: 3 requests per hour
- **General API**: 100 requests per 15 minutes
- **Email verification**: 3 requests per hour
- **Password reset**: 3 requests per hour

## Common Scenarios That Trigger Rate Limits

### 1. JobDashboard Real-Time Updates (Resolved ✅)
The admin jobs dashboard now uses **WebSockets** for real-time updates instead of polling.

**Old approach** (polling every 30 seconds):
- GET `/api/jobs/jobs`
- GET `/api/jobs/jobs/stats`
- GET `/api/jobs/schedules`
- **Impact**: 6 requests per minute = 90 requests per 15 minutes

**New approach** (WebSocket):
- Initial fetch: 3 requests on page load
- Real-time updates: WebSocket connection (no polling)
- **Impact**: 3 requests total, updates pushed from server

See [docs/WEBSOCKET_JOBS.md](WEBSOCKET_JOBS.md) for details.

### 2. CSRF Token Fetching
Login and signup forms fetch a CSRF token before submitting:
1. GET `/api/auth/csrf-token`
2. POST `/api/auth/login` or `/api/auth/signup`

**Impact**: Each login/signup attempt counts as 2 requests

### 3. Fresh Dev Mode Hot Reload
During development, Fresh may reload islands and re-execute useEffect hooks, causing duplicate API calls.

### 4. Multiple Browser Tabs
Opening multiple admin tabs will multiply the auto-refresh requests.

## How to Avoid Rate Limiting in Development

### Option 1: Use the Reset Script (Quick Fix)
```bash
deno run --allow-env --allow-read --unstable-kv scripts/reset-rate-limits.ts
```

This clears all rate limit counters from Deno KV.

### Option 2: Ensure Development Mode is Active
Check that your `.env` file has:
```bash
DENO_ENV=development
```

This automatically increases all rate limits by 10x.

### Option 3: WebSocket Already Implemented ✅
The JobDashboard now uses WebSockets instead of polling, which significantly reduces API requests.

**No action needed** - this is now the default behavior.

### Option 4: Close Unused Admin Tabs
Each open admin/jobs tab makes requests every 30 seconds.

## Rate Limit Headers

All API responses include rate limit information:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: When the limit will reset (ISO 8601 timestamp)
- `Retry-After`: Seconds to wait before retrying (when limit exceeded)

## Implementation Details

Rate limiting is implemented per-IP address using Deno KV as storage. Each endpoint has its own counter that resets after the time window expires.

**File**: `backend/lib/rate-limit.ts`

## Troubleshooting

### "429 Too Many Requests" Error

**Symptoms**: API calls fail with 429 status code and "Too many requests" message.

**Quick Solutions**:
1. Run the reset script: `deno task reset-rate-limits`
2. Verify `DENO_ENV=development` in `.env`
3. Wait for the time window to expire (check `Retry-After` header)
4. Close extra browser tabs with admin dashboards

### Still Getting Rate Limited?

Check for:
- Multiple services running on different ports hitting the same backend
- Browser extensions making additional requests
- Automated testing scripts running in parallel
- VPN or proxy causing IP address confusion

## Best Practices

### Development
- Keep `DENO_ENV=development` in `.env`
- Run reset script when starting fresh development session
- Close unused admin tabs
- Consider disabling auto-refresh when not actively monitoring jobs

### Production
- **Never** run the reset script in production
- Monitor rate limit headers to adjust client behavior
- Implement exponential backoff for retries
- Consider implementing per-user rate limits instead of per-IP for better UX

## Related Files

- `backend/lib/rate-limit.ts` - Rate limiter implementation
- `backend/routes/auth.ts` - Auth endpoints with rate limiting
- `scripts/reset-rate-limits.ts` - Development helper script
- `frontend/islands/admin/JobDashboard.tsx` - Auto-refreshing dashboard
