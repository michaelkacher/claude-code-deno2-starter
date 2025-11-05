# Background Jobs & Scheduler

A robust background job processing system built on Deno KV with support for job queues, cron-based scheduling, retry logic, and admin monitoring.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Job Queue](#job-queue)
- [Scheduler](#scheduler)
- [Admin Dashboard](#admin-dashboard)
- [Creating Workers](#creating-workers)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)

## Overview

The background jobs system provides:

- **Job Queue**: Process tasks asynchronously with priority and retry logic
- **Scheduler**: Run jobs on cron schedules (hourly, daily, etc.)
- **Retry Logic**: Automatic retry with exponential backoff
- **Admin Dashboard**: Monitor and manage jobs via web UI
- **Persistence**: Jobs stored in Deno KV (survives server restarts)
- **Concurrency Control**: Limit parallel job execution
- **Dead Letter Queue**: Track permanently failed jobs

## Architecture

```
┌─────────────┐
│   Workers   │  Register job handlers
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Job Queue   │  Process jobs with priority
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Deno KV    │  Persistent storage
└─────────────┘

┌─────────────┐
│  Scheduler  │  Cron-based scheduling
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Workers   │  Execute scheduled tasks
└─────────────┘
```

## Quick Start

### 1. Add a Job to the Queue

```typescript
import { queue } from './lib/queue.ts';

// Add a simple job
const jobId = await queue.add('send-email', {
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Thanks for signing up!',
});

// Add with options
const jobId = await queue.add('send-email', emailData, {
  priority: 10,      // Higher = more important
  maxRetries: 3,     // Retry up to 3 times
  delay: 5000,       // Delay 5 seconds before first run
});
```

### 2. Create a Job Processor

```typescript
import { queue } from './lib/queue.ts';

queue.process('send-email', async (job) => {
  const { to, subject, body } = job.data;

  // Send the email
  await sendEmail(to, subject, body);

  console.log(`Email sent to ${to}`);
});
```

### 3. Schedule a Recurring Job

```typescript
import { scheduler, CronPatterns } from './lib/scheduler.ts';

scheduler.schedule(
  'cleanup-old-files',
  CronPatterns.DAILY_3AM,
  async () => {
    await cleanupOldFiles();
  }
);
```

### 4. Start Processing

```typescript
import { queue } from './lib/queue.ts';
import { scheduler } from './lib/scheduler.ts';

// Start the queue
await queue.start();

// Start the scheduler
scheduler.start();
```

## Job Queue

### Adding Jobs

```typescript
// Basic job
await queue.add('job-name', { data: 'value' });

// With priority (higher = more important)
await queue.add('urgent-job', data, { priority: 10 });

// With retry limit
await queue.add('risky-job', data, { maxRetries: 5 });

// With delay
await queue.add('delayed-job', data, { delay: 60000 }); // 1 minute

// Scheduled for specific time
await queue.add('future-job', data, {
  scheduledFor: new Date('2024-12-31T23:59:59Z'),
});

// With custom ID (prevents duplicates)
await queue.add('unique-job', data, {
  jobId: 'user-123-welcome-email',
});
```

### Processing Jobs

```typescript
// Simple processor
queue.process('job-name', async (job) => {
  console.log('Processing:', job.data);
});

// With error handling
queue.process('risky-job', async (job) => {
  try {
    await dangerousOperation(job.data);
  } catch (error) {
    console.error('Job failed:', error);
    throw error; // Will trigger retry
  }
});

// Access job metadata
queue.process('meta-job', async (job) => {
  console.log('Job ID:', job.id);
  console.log('Attempt:', job.attempts);
  console.log('Created:', job.createdAt);
});
```

### Managing Jobs

```typescript
// Get job by ID
const job = await queue.getJob(jobId);

// List jobs
const allJobs = await queue.listJobs();
const pendingJobs = await queue.listJobs({ status: 'pending' });
const emailJobs = await queue.listJobs({ name: 'send-email' });

// Get statistics
const stats = await queue.getStats();
console.log(stats);
// {
//   pending: 10,
//   running: 2,
//   completed: 100,
//   failed: 5,
//   total: 117
// }

// Retry a failed job
await queue.retry(jobId);

// Delete a job
await queue.delete(jobId);

// Cleanup old completed/failed jobs
const deleted = await queue.cleanup(new Date('2024-01-01'));
console.log(`Deleted ${deleted} old jobs`);
```

## Scheduler

### Cron Patterns

```typescript
import { CronPatterns } from './lib/scheduler.ts';

// Built-in patterns
CronPatterns.EVERY_MINUTE       // '* * * * *'
CronPatterns.EVERY_5_MINUTES    // '*/5 * * * *'
CronPatterns.EVERY_15_MINUTES   // '*/15 * * * *'
CronPatterns.EVERY_30_MINUTES   // '*/30 * * * *'
CronPatterns.EVERY_HOUR         // '0 * * * *'
CronPatterns.EVERY_2_HOURS      // '0 */2 * * *'
CronPatterns.EVERY_6_HOURS      // '0 */6 * * *'
CronPatterns.DAILY              // '0 0 * * *'
CronPatterns.DAILY_3AM          // '0 3 * * *'
CronPatterns.WEEKLY             // '0 0 * * 0'
CronPatterns.MONTHLY            // '0 0 1 * *'
CronPatterns.BUSINESS_HOURS     // '0 9-17 * * 1-5'
CronPatterns.WEEKDAYS_9AM       // '0 9 * * 1-5'
```

### Cron Expression Format

```
┌───────────── minute (0-59)
│ ┌─────────── hour (0-23)
│ │ ┌───────── day of month (1-31)
│ │ │ ┌─────── month (1-12)
│ │ │ │ ┌───── day of week (0-6, Sunday = 0)
│ │ │ │ │
* * * * *
```

Examples:
- `* * * * *` - Every minute
- `0 * * * *` - Every hour
- `0 0 * * *` - Every day at midnight
- `0 0 * * 0` - Every Sunday at midnight
- `*/5 * * * *` - Every 5 minutes
- `0 9-17 * * 1-5` - Every hour 9-17 on weekdays

### Scheduling Jobs

```typescript
import { scheduler } from './lib/scheduler.ts';

// Schedule a job
scheduler.schedule(
  'cleanup-logs',
  '0 3 * * *', // 3 AM daily
  async () => {
    await cleanupLogs();
  }
);

// Schedule with options
scheduler.schedule(
  'send-reports',
  '0 9 * * 1', // Monday 9 AM
  async () => {
    await sendWeeklyReports();
  },
  {
    enabled: true,
    timezone: 'America/New_York',
  }
);
```

### Managing Schedules

```typescript
// List all schedules
const schedules = scheduler.getSchedules();

// Get specific schedule
const schedule = scheduler.getSchedule('cleanup-logs');
console.log(schedule.nextRun); // Next execution time
console.log(schedule.runCount); // How many times it ran

// Enable/disable
scheduler.enable('cleanup-logs');
scheduler.disable('cleanup-logs');

// Manually trigger
await scheduler.trigger('cleanup-logs');

// Remove schedule
scheduler.unschedule('cleanup-logs');
```

## Admin Dashboard

Access the admin dashboard at `/admin/jobs` to:

- **View Statistics**: See pending, running, completed, and failed job counts
- **Monitor Jobs**: Browse all jobs with filtering by status
- **Retry Failed Jobs**: Manually retry jobs that failed
- **Delete Jobs**: Remove jobs from the queue
- **View Schedules**: See all scheduled tasks and their next run times
- **Trigger Schedules**: Manually execute scheduled tasks
- **Enable/Disable**: Toggle schedules on/off
- **Cleanup**: Remove old completed/failed jobs

### API Endpoints

The dashboard uses these API endpoints (available for programmatic access):

```typescript
// Jobs
GET    /api/admin/jobs                   // List jobs
GET    /api/admin/jobs/stats             // Queue statistics
GET    /api/admin/jobs/:id               // Job details
POST   /api/admin/jobs/:id/retry         // Retry failed job
DELETE /api/admin/jobs/:id               // Delete job
POST   /api/admin/jobs/cleanup           // Cleanup old jobs

// Schedules
GET    /api/admin/schedules              // List schedules
GET    /api/admin/schedules/:name        // Schedule details
POST   /api/admin/schedules/:name/trigger   // Manual trigger
POST   /api/admin/schedules/:name/enable    // Enable schedule
POST   /api/admin/schedules/:name/disable   // Disable schedule
```

## Creating Workers

### 1. Create a Worker File

```typescript
// backend/workers/my-worker.ts
import { queue } from '../lib/queue.ts';

// Define your data type
export interface MyJobData {
  userId: string;
  action: string;
}

// Process the job
async function processMyJob(data: MyJobData): Promise<void> {
  console.log(`Processing ${data.action} for user ${data.userId}`);

  // Your logic here

  console.log('Job completed!');
}

// Register the worker
export function registerMyWorker(): void {
  queue.process<MyJobData>('my-job', async (job) => {
    await processMyJob(job.data);
  });

  console.log('My worker registered');
}

// Helper function to enqueue jobs
export async function enqueueMyJob(
  userId: string,
  action: string,
): Promise<string> {
  return await queue.add('my-job', {
    userId,
    action,
  }, {
    priority: 5,
    maxRetries: 3,
  });
}
```

### 2. Register in Main File

```typescript
// backend/workers/index.ts
import { registerMyWorker } from './my-worker.ts';

export function registerAllWorkers(): void {
  registerMyWorker();
  // ... other workers
}
```

### 3. Use in Your Application

```typescript
import { enqueueMyJob } from './workers/my-worker.ts';

// In your route handler
app.post('/api/action', async (c) => {
  const { userId, action } = await c.req.json();

  // Enqueue the job
  const jobId = await enqueueMyJob(userId, action);

  return c.json({
    message: 'Job queued',
    jobId,
  });
});
```

## API Reference

### Job Queue

#### `queue.add(name, data, options)`

Add a job to the queue.

**Parameters:**
- `name` (string): Job type name
- `data` (T): Job data
- `options` (JobOptions):
  - `priority` (number): Job priority (higher = more important)
  - `maxRetries` (number): Maximum retry attempts
  - `delay` (number): Delay in milliseconds before first execution
  - `scheduledFor` (Date): Schedule for specific time
  - `jobId` (string): Custom job ID (prevents duplicates)

**Returns:** `Promise<string>` - Job ID

#### `queue.process(name, handler)`

Register a job processor.

**Parameters:**
- `name` (string): Job type name
- `handler` (JobHandler): Async function to process the job

#### `queue.getJob(jobId)`

Get a job by ID.

**Returns:** `Promise<Job | null>`

#### `queue.listJobs(options)`

List jobs with optional filtering.

**Parameters:**
- `options`:
  - `status` (JobStatus): Filter by status
  - `name` (string): Filter by job name
  - `limit` (number): Max results (default: 50)
  - `offset` (number): Pagination offset

**Returns:** `Promise<Job[]>`

#### `queue.getStats()`

Get queue statistics.

**Returns:** `Promise<QueueStats>`

#### `queue.retry(jobId)`

Retry a failed job.

**Returns:** `Promise<void>`

#### `queue.delete(jobId)`

Delete a job.

**Returns:** `Promise<void>`

#### `queue.cleanup(olderThan)`

Clean up old completed/failed jobs.

**Parameters:**
- `olderThan` (Date): Delete jobs completed before this date

**Returns:** `Promise<number>` - Number of deleted jobs

### Scheduler

#### `scheduler.schedule(name, cron, handler, options)`

Schedule a recurring job.

**Parameters:**
- `name` (string): Schedule name
- `cron` (string): Cron expression
- `handler` (() => Promise<void>): Function to execute
- `options`:
  - `enabled` (boolean): Whether schedule is enabled
  - `timezone` (string): Timezone for cron evaluation

#### `scheduler.getSchedules()`

Get all schedules.

**Returns:** `Schedule[]`

#### `scheduler.getSchedule(name)`

Get a specific schedule.

**Returns:** `Schedule | undefined`

#### `scheduler.enable(name)`

Enable a schedule.

#### `scheduler.disable(name)`

Disable a schedule.

#### `scheduler.trigger(name)`

Manually trigger a schedule.

**Returns:** `Promise<void>`

#### `scheduler.unschedule(name)`

Remove a schedule.

## Best Practices

### Job Design

1. **Keep Jobs Idempotent**: Jobs should produce the same result if run multiple times
2. **Make Jobs Atomic**: Complete entire operation or fail completely
3. **Use Unique Job IDs**: Prevent duplicate jobs for the same operation
4. **Set Appropriate Priorities**: Critical jobs should have higher priority
5. **Handle Errors Gracefully**: Log errors and provide context

```typescript
// Good: Idempotent job
queue.add('update-user-stats', { userId: '123' }, {
  jobId: `stats-${userId}`,  // Prevents duplicates
  priority: 5,
  maxRetries: 3,
});

// Good: Error handling
queue.process('risky-job', async (job) => {
  try {
    await operation(job.data);
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    throw error; // Trigger retry
  }
});
```

### Retry Strategy

1. **Set Reasonable Retry Limits**: Don't retry forever
2. **Exponential Backoff**: System automatically uses exponential backoff
3. **Monitor Failed Jobs**: Check admin dashboard for patterns
4. **Dead Letter Queue**: Permanently failed jobs stay in the system for review

```typescript
// Transactional: High retries
await queue.add('send-payment-confirmation', data, {
  maxRetries: 5,
  priority: 10,
});

// Non-critical: Fewer retries
await queue.add('send-newsletter', data, {
  maxRetries: 2,
  priority: 1,
});
```

### Performance

1. **Control Concurrency**: Adjust `maxConcurrency` in queue settings
2. **Use Priorities**: Important jobs process first
3. **Batch Operations**: Group similar operations
4. **Clean Up Regularly**: Remove old completed jobs

```typescript
// Configure concurrency
const queue = new JobQueue();
queue.maxConcurrency = 10; // Process up to 10 jobs simultaneously

// Regular cleanup schedule
scheduler.schedule('cleanup', CronPatterns.DAILY_3AM, async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7); // 7 days old
  await queue.cleanup(cutoff);
});
```

### Monitoring

1. **Check Admin Dashboard Regularly**: Monitor job health
2. **Set Up Alerts**: Track failed job counts
3. **Log Important Events**: Debug issues quickly
4. **Track Metrics**: Monitor job processing times

```typescript
queue.process('monitored-job', async (job) => {
  const start = Date.now();

  try {
    await operation(job.data);

    const duration = Date.now() - start;
    console.log(`Job completed in ${duration}ms`);
  } catch (error) {
    console.error('Job failed:', error);
    // Send alert if needed
    throw error;
  }
});
```

### Security

1. **Validate Job Data**: Always validate input
2. **Rate Limit Job Creation**: Prevent abuse
3. **Authenticate Admin Routes**: Protect management endpoints
4. **Sanitize Logs**: Don't log sensitive data

```typescript
// Validate job data
import { z } from 'zod';

const EmailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
});

queue.process('send-email', async (job) => {
  // Validate
  const data = EmailSchema.parse(job.data);

  // Process
  await sendEmail(data);
});
```

## Examples

See the `backend/workers/` directory for complete examples:

- **email-worker.ts**: Sending transactional emails
- **cleanup-worker.ts**: Scheduled cleanup tasks
- **report-worker.ts**: Long-running report generation
- **webhook-worker.ts**: Delivering webhooks with retries

## Troubleshooting

### Jobs Not Processing

1. Check if queue is started: `await queue.start()`
2. Verify worker is registered
3. Check job status in admin dashboard
4. Look for errors in console logs

### Schedule Not Running

1. Check if scheduler is started: `scheduler.start()`
2. Verify schedule is enabled
3. Check `nextRun` time in admin dashboard
4. Validate cron expression syntax

### Jobs Failing

1. Check error message in admin dashboard
2. Review job data for invalid input
3. Check retry count and max retries
4. Look for external service issues (API, database, etc.)

### High Memory Usage

1. Reduce `maxConcurrency`
2. Clean up old jobs more frequently
3. Check for memory leaks in job handlers
4. Limit job data size

## Related Documentation

- [Deno KV Guide](./guides/DENO_KV.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Admin Panel](./ADMIN_PANEL.md)
