# Notification System

In-app notification system built with Deno KV, Hono, and Fresh.

## Overview

The notification system provides real-time in-app notifications with:
- ✅ Deno KV storage for persistence
- ✅ REST API for CRUD operations
- ✅ NotificationBell UI component with dropdown
- ✅ Unread badge counter
- ✅ 30-second polling for updates
- ✅ Mark as read / Mark all as read
- ✅ Delete notifications
- ✅ Four notification types: info, success, warning, error

## Architecture

### Backend (`/backend`)

**Services:**
- `services/notifications.ts` - NotificationService with CRUD operations
  - `create()` - Create notification
  - `getUserNotifications()` - Get user's notifications (paginated)
  - `getUnreadCount()` - Get unread count
  - `markAsRead()` - Mark notification as read
  - `markAllAsRead()` - Mark all as read
  - `deleteNotification()` - Delete notification

**Types:**
- `types/notifications.ts` - Zod schemas and TypeScript interfaces
  - `NotificationData` - Notification model
  - `CreateNotificationRequest` - Create request schema
  - `NotificationListResponse` - List response schema

**Routes:**
- `routes/notifications.ts` - REST API endpoints
  - `GET /api/notifications` - Get all notifications
  - `GET /api/notifications/unread-count` - Get unread count
  - `PATCH /api/notifications/:id/read` - Mark as read
  - `POST /api/notifications/read-all` - Mark all as read
  - `DELETE /api/notifications/:id` - Delete notification
  - `POST /api/notifications` - Create notification (admin/system)

### Frontend (`/frontend`)

**Components:**
- `islands/NotificationBell.tsx` - Bell icon with dropdown UI
  - Polls every 30 seconds for updates
  - Shows unread badge
  - Dropdown with notification list
  - Mark as read / Delete actions
  - Relative time formatting

**Layout:**
- `components/Navigation.tsx` - Top navigation bar
- `routes/_app.tsx` - Global app wrapper with Navigation

## Data Model

### Deno KV Keys

```typescript
// Primary storage
['notifications', userId, notificationId] -> NotificationData

// Secondary index (for listing by date)
['notifications_by_user', userId, timestamp, notificationId] -> null
```

### NotificationData Interface

```typescript
{
  id: string;              // UUID
  userId: string;          // User ID
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;           // Max 200 chars
  message: string;         // Max 1000 chars
  link?: string;           // Optional URL
  read: boolean;           // Default: false
  createdAt: string;       // ISO 8601 timestamp
  readAt?: string;         // ISO 8601 timestamp
}
```

## Usage

### Creating Notifications (Backend)

#### From Code

```typescript
import { NotificationService } from './backend/services/notifications.ts';

// Create a notification
await NotificationService.create({
  userId: 'user-123',
  type: 'success',
  title: 'Welcome!',
  message: 'Your account has been created successfully.',
  link: '/profile', // Optional
});
```

#### From API

```bash
# Create notification (requires auth token)
curl -X POST http://localhost:8000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user-123",
    "type": "info",
    "title": "New Feature",
    "message": "Check out our new notification system!"
  }'
```

#### From Background Jobs

```typescript
// In a background job worker
import { NotificationService } from '../services/notifications.ts';

export async function processJob(job: Job) {
  // ... do work ...
  
  // Notify user of completion
  await NotificationService.create({
    userId: job.userId,
    type: 'success',
    title: 'Job Complete',
    message: `Your ${job.type} job has finished.`,
    link: `/jobs/${job.id}`,
  });
}
```

### Using the NotificationBell (Frontend)

The NotificationBell component is automatically included in the navigation bar for all pages.

**Features:**
- Displays unread count badge
- Click to open dropdown with notifications
- Click "Mark all read" to mark all as read
- Click individual notification to mark as read
- Click "X" to delete notification
- Click notification link to navigate (if provided)

**Customization:**

```tsx
// To use in a custom location, import the island
import NotificationBell from '../islands/NotificationBell.tsx';

<NotificationBell />
```

## Testing

### Create Test Notifications

Use the provided seed script:

```bash
# Create 7 sample notifications for test user
deno run --allow-env --allow-read --allow-write --unstable-kv \
  scripts/seed-test-notifications.ts
```

This creates notifications for `test-user-123`. To test with a real user:

1. Update `TEST_USER_ID` in `scripts/seed-test-notifications.ts`
2. Run the script again

### Manual Testing

1. Start dev server: `deno task dev`
2. Open http://localhost:3000
3. Create notifications using the seed script or API
4. Click the bell icon to view notifications
5. Test marking as read, deleting, etc.

### Testing with Authentication

The notification system requires authentication. Options:

**Option A: Use existing user**
1. Sign up at http://localhost:3000/signup
2. Note your user ID from the response
3. Update seed script with your user ID
4. Run seed script
5. View notifications in the UI

**Option B: Temporary test user**
1. Run seed script with `test-user-123`
2. Manually set the JWT token in backend code to use test user
3. View notifications in the UI

**Option C: Disable auth (dev only)**
1. Set `DISABLE_AUTH=true` in `.env`
2. Restart servers
3. Test without authentication

## API Reference

### GET /api/notifications

Get all notifications for authenticated user.

**Query Parameters:**
- `limit` (optional) - Max results (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "userId": "user-123",
      "type": "info",
      "title": "New Feature",
      "message": "Check out our new notification system!",
      "read": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 10,
  "unreadCount": 5
}
```

### GET /api/notifications/unread-count

Get count of unread notifications.

**Response:**
```json
{
  "unreadCount": 5
}
```

### PATCH /api/notifications/:id/read

Mark notification as read.

**Response:**
```json
{
  "notification": {
    "id": "uuid",
    "read": true,
    "readAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/notifications/read-all

Mark all notifications as read for authenticated user.

**Response:**
```json
{
  "count": 5,
  "message": "Marked 5 notifications as read"
}
```

### DELETE /api/notifications/:id

Delete a notification.

**Response:**
```json
{
  "message": "Notification deleted"
}
```

### POST /api/notifications

Create a notification (admin/system use).

**Request Body:**
```json
{
  "userId": "user-123",
  "type": "info",
  "title": "Notification Title",
  "message": "Notification message",
  "link": "https://example.com/optional-link"
}
```

**Response:**
```json
{
  "notification": {
    "id": "uuid",
    "userId": "user-123",
    "type": "info",
    "title": "Notification Title",
    "message": "Notification message",
    "read": false,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

## Future Enhancements

### Option 2: Real-time with Server-Sent Events (SSE)

To reduce polling overhead, add SSE:

```typescript
// backend/routes/notifications.ts
app.get('/stream', async (c) => {
  const userId = c.get('jwtPayload')?.sub;
  // SSE implementation
});
```

### Option 3: Browser Push Notifications

For native OS notifications:
1. Add Service Worker
2. Request notification permission
3. Implement push subscription
4. Send push notifications from backend

### Additional Features

- [ ] Notification preferences (email, push, in-app)
- [ ] Notification categories/filters
- [ ] Notification history page
- [ ] Bulk delete
- [ ] Search notifications
- [ ] Notification templates
- [ ] Scheduled notifications
- [ ] Notification analytics

## Performance Considerations

**Current Implementation:**
- Polling every 30 seconds
- Loads 10 most recent notifications
- Secondary index for efficient listing
- Atomic transactions for consistency

**Scaling:**
- For many users: Consider SSE to reduce polling
- For many notifications: Already paginated
- For high volume: Add cleanup job for old notifications
- For real-time needs: Upgrade to WebSocket or SSE

## Troubleshooting

**Notifications not appearing:**
1. Check user is authenticated (access token in localStorage)
2. Check notifications exist in Deno KV for that user ID
3. Check browser console for errors
4. Verify API endpoints are responding (check Network tab)

**Unread count not updating:**
1. Wait for next poll cycle (30 seconds)
2. Manually refresh the page
3. Check if notifications are marked as read in database

**Permission errors:**
1. Ensure JWT token is valid
2. Check `DISABLE_AUTH` environment variable
3. Verify user ID matches notifications

## Scripts

- `scripts/seed-test-notifications.ts` - Create sample notifications
- `scripts/test-notifications.ts` - Test with API calls
- `scripts/create-test-notifications.ts` - Create with auth

## Files

**Backend:**
- `backend/services/notifications.ts` (220 lines)
- `backend/types/notifications.ts` (60 lines)
- `backend/routes/notifications.ts` (180 lines)

**Frontend:**
- `frontend/islands/NotificationBell.tsx` (420 lines)
- `frontend/components/Navigation.tsx` (35 lines)

**Scripts:**
- `scripts/seed-test-notifications.ts` (110 lines)
- `scripts/test-notifications.ts` (100 lines)
- `scripts/create-test-notifications.ts` (190 lines)

**Total:** ~1,315 lines of code
