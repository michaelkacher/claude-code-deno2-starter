# Background Jobs Implementation Summary

Implementation of a robust background job processing system with job queue, cron scheduler, and admin dashboard.

## Date

November 4, 2025

## Components Implemented

### Core Libraries

1. **backend/lib/queue.ts** (437 lines)
   - Job queue implementation using Deno KV
   - Priority-based processing
   - Retry with exponential backoff
   - Job status tracking (pending, running, completed, failed, retrying)
   - Concurrency control
   - Cleanup of old jobs

2. **backend/lib/scheduler.ts** (338 lines)
   - Cron-based job scheduling
   - Custom cron parser (no external dependencies)
   - Named schedules with enable/disable
   - Manual triggering
   - Run count tracking
   - Common cron patterns helper

### API Routes

3. **backend/routes/jobs.ts** (219 lines)
   - Job management endpoints:
     - List jobs with filtering
     - Get job details
     - Retry failed jobs
     - Delete jobs
     - Cleanup old jobs
     - Queue statistics
   - Schedule management endpoints:
     - List schedules
     - Get schedule details
     - Manual trigger
     - Enable/disable schedules

### Admin Dashboard

4. **frontend/islands/admin/JobDashboard.tsx** (700+ lines)
   - Real-time monitoring UI
   - Stats cards (pending, running, completed, failed)
   - Jobs table with status filtering
   - Schedules table
   - Action buttons (retry, delete, trigger, enable/disable)
   - Auto-refresh every 5 seconds
   - Cleanup old jobs functionality

5. **frontend/routes/admin/jobs.tsx** (58 lines)
   - Admin page wrapper
   - Navigation between admin sections
   - Authentication enforcement

### Example Workers

6. **backend/workers/email-worker.ts** (130 lines)
   - Email sending worker
   - Helper functions (welcome, password reset, verification)
   - Priority-based email handling

7. **backend/workers/cleanup-worker.ts** (120 lines)
   - Scheduled cleanup tasks
   - Temp file cleanup (hourly)
   - Old job cleanup (daily at 3 AM)
   - Expired session cleanup (every 6 hours)

8. **backend/workers/report-worker.ts** (210 lines)
   - Report generation worker
   - Multiple report types (user activity, sales, analytics)
   - Long-running job simulation
   - Email notification on completion

9. **backend/workers/webhook-worker.ts** (200 lines)
   - Webhook delivery worker
   - HMAC signature generation
   - Multiple webhook types (user, payment, custom)
   - Retry with high retry count

10. **backend/workers/index.ts** (40 lines)
    - Central worker registration
    - Helper function exports

### Tests

11. **backend/lib/queue.test.ts** (160 lines)
    - Job creation tests
    - Job processing tests
    - Retry logic tests
    - Cleanup tests
    - Statistics tests

12. **backend/lib/scheduler.test.ts** (150 lines)
    - Schedule creation tests
    - Enable/disable tests
    - Manual trigger tests
    - Cron pattern tests
    - Next run calculation tests

### Documentation

13. **docs/BACKGROUND_JOBS.md** (850+ lines)
    - Complete user guide
    - Quick start examples
    - API reference
    - Best practices
    - Troubleshooting guide

## Key Features

### Job Queue

- **Priority System**: Higher priority jobs processed first
- **Retry Logic**: Automatic retry with exponential backoff
- **Concurrency Control**: Limit parallel job execution
- **Persistence**: Jobs survive server restarts (Deno KV)
- **Status Tracking**: Track job lifecycle (pending → running → completed/failed)
- **Dead Letter Queue**: Failed jobs retained for inspection
- **Unique Jobs**: Prevent duplicate jobs with custom IDs
- **Delayed Jobs**: Schedule jobs for future execution
- **Job Filtering**: Query jobs by status, name, etc.

### Scheduler

- **Cron Support**: Standard cron expressions
- **Named Schedules**: Easy identification and management
- **Enable/Disable**: Toggle schedules without removing them
- **Manual Trigger**: Execute schedules on demand
- **Run Tracking**: Count executions and track last run
- **Next Run Calculation**: Know when schedule will execute next
- **Timezone Support**: Configure timezone per schedule

### Admin Dashboard

- **Real-time Stats**: Live job counts and queue status
- **Job Management**: View, retry, delete jobs
- **Schedule Control**: Enable, disable, trigger schedules
- **Auto-refresh**: Updates every 5 seconds
- **Filtering**: Filter jobs by status
- **Cleanup**: Bulk remove old jobs

## Architecture

```
Application Code
      ↓
   Workers
      ↓
 Queue / Scheduler
      ↓
   Deno KV
```

1. Application code enqueues jobs or registers scheduled tasks
2. Workers process jobs with registered handlers
3. Queue manages job lifecycle and retry logic
4. Scheduler triggers jobs based on cron expressions
5. Deno KV provides persistent storage

## Integration

### In main.ts

```typescript
// Initialize background job system
import { queue } from './lib/queue.ts';
import { scheduler } from './lib/scheduler.ts';
import { registerAllWorkers } from './workers/index.ts';

// Register all workers and scheduled tasks
registerAllWorkers();

// Start the job queue processor
await queue.start();

// Start the scheduler
scheduler.start();
```

### In routes

```typescript
import { enqueueMyJob } from './workers/my-worker.ts';

app.post('/api/action', async (c) => {
  // Enqueue a background job
  const jobId = await enqueueMyJob(userId, action);

  return c.json({ jobId });
});
```

## Configuration

### Queue Configuration

- **maxConcurrency**: 5 jobs simultaneously (configurable)
- **pollInterval**: 1 second (checks for new jobs)
- **maxRetries**: 3 attempts by default (per job)
- **backoff**: Exponential (1s, 2s, 4s, 8s, ..., max 60s)

### Scheduler Configuration

- **checkInterval**: 60 seconds (checks for due schedules)
- **timezone**: UTC by default (configurable per schedule)

## Testing

Run tests with:

```bash
deno task test
```

Tests cover:
- Job creation and queuing
- Job processing and completion
- Retry logic and failure handling
- Schedule creation and execution
- Cron expression parsing
- Enable/disable functionality

## Example Usage

### Enqueue a Job

```typescript
import { queue } from './lib/queue.ts';

const jobId = await queue.add('send-email', {
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Thanks for signing up!',
}, {
  priority: 5,
  maxRetries: 3,
});
```

### Schedule a Task

```typescript
import { scheduler, CronPatterns } from './lib/scheduler.ts';

scheduler.schedule(
  'daily-cleanup',
  CronPatterns.DAILY_3AM,
  async () => {
    await cleanupOldFiles();
  }
);
```

### Monitor via Dashboard

Navigate to `/admin/jobs` to:
- View job statistics
- Filter and search jobs
- Retry failed jobs
- View scheduled tasks
- Trigger schedules manually

## Performance Considerations

1. **Concurrency**: Adjust `maxConcurrency` based on workload
2. **Cleanup**: Schedule regular cleanup of old jobs
3. **Batch Operations**: Group similar jobs together
4. **Priority Management**: Use priorities to ensure critical jobs process first
5. **Monitoring**: Check admin dashboard for bottlenecks

## Security Considerations

1. **Admin Routes**: Protected by authentication middleware
2. **Job Data Validation**: Validate data in job handlers
3. **Rate Limiting**: Prevent job queue abuse
4. **Signature Verification**: Use HMAC for webhooks
5. **Log Sanitization**: Don't log sensitive data

## Future Enhancements

Potential improvements:
- Job progress tracking (0-100%)
- Job dependencies (run job B after job A completes)
- Bulk job operations
- Job search by data fields
- Export job history
- Webhook for job events
- Distributed job processing across multiple servers
- Job metrics and analytics dashboard

## Related Files

- Core: `backend/lib/queue.ts`, `backend/lib/scheduler.ts`
- Routes: `backend/routes/jobs.ts`
- Workers: `backend/workers/*.ts`
- Dashboard: `frontend/islands/admin/JobDashboard.tsx`
- Tests: `backend/lib/queue.test.ts`, `backend/lib/scheduler.test.ts`
- Docs: `docs/BACKGROUND_JOBS.md`
