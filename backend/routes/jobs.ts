/**
 * Background Jobs Admin API
 *
 * Endpoints for managing and monitoring background jobs
 */

import { Hono } from 'hono';
import { queue } from '../lib/queue.ts';
import { scheduler } from '../lib/scheduler.ts';
import { requireAdmin } from '../lib/admin-auth.ts';

const app = new Hono();

// Apply admin authentication to all job routes
app.use('*', requireAdmin());

// ============================================================================
// Job Management Endpoints
// ============================================================================

/**
 * GET /jobs - List jobs with filters
 */
app.get('/jobs', async (c) => {
  const status = c.req.query('status') as any;
  const name = c.req.query('name');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  const jobs = await queue.listJobs({ status, name, limit, offset });

  return c.json({
    data: jobs,
    meta: {
      limit,
      offset,
      count: jobs.length,
    },
  });
});

/**
 * POST /jobs - Create a new job
 */
app.post('/jobs', async (c) => {
  try {
    const body = await c.req.json();
    const { name, data, options = {} } = body;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return c.json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Job name is required',
        },
      }, 400);
    }

    if (!data || typeof data !== 'object') {
      return c.json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Job data is required and must be an object',
        },
      }, 400);
    }

    // Create the job
    const jobId = await queue.add(name, data, {
      priority: options.priority || 5,
      maxRetries: options.maxRetries || 3,
      delay: options.delay || 0,
      scheduledFor: options.scheduledFor ? new Date(options.scheduledFor) : undefined,
      jobId: options.jobId,
    });

    const job = await queue.getJob(jobId);

    return c.json({
      message: 'Job created successfully',
      data: job,
    }, 201);
  } catch (error) {
    return c.json({
      error: {
        code: 'JOB_CREATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to create job',
      },
    }, 500);
  }
});

/**
 * GET /jobs/stats - Get queue statistics
 */
app.get('/jobs/stats', async (c) => {
  const stats = await queue.getStats();
  return c.json({ data: stats });
});

/**
 * GET /jobs/:id - Get job details
 */
app.get('/jobs/:id', async (c) => {
  const jobId = c.req.param('id');
  const job = await queue.getJob(jobId);

  if (!job) {
    return c.json({
      error: {
        code: 'JOB_NOT_FOUND',
        message: 'Job not found',
      },
    }, 404);
  }

  return c.json({ data: job });
});

/**
 * POST /jobs/:id/retry - Retry a failed job
 */
app.post('/jobs/:id/retry', async (c) => {
  const jobId = c.req.param('id');

  try {
    await queue.retry(jobId);
    return c.json({
      message: 'Job queued for retry',
      data: { jobId },
    });
  } catch (error) {
    return c.json({
      error: {
        code: 'RETRY_FAILED',
        message: error instanceof Error ? error.message : 'Failed to retry job',
      },
    }, 400);
  }
});

/**
 * DELETE /jobs/:id - Delete a job
 */
app.delete('/jobs/:id', async (c) => {
  const jobId = c.req.param('id');

  await queue.delete(jobId);

  return c.json({
    message: 'Job deleted successfully',
    data: { jobId },
  });
});

/**
 * POST /jobs/cleanup - Clean up old completed/failed jobs
 */
app.post('/jobs/cleanup', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const daysOld = body.daysOld || 7;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const deleted = await queue.cleanup(cutoffDate);

  return c.json({
    message: `Cleaned up ${deleted} jobs`,
    data: { deleted, daysOld },
  });
});

// ============================================================================
// Scheduler Management Endpoints
// ============================================================================

/**
 * GET /schedules - List all schedules
 */
app.get('/schedules', (c) => {
  const schedules = scheduler.getSchedules();

  return c.json({
    data: schedules.map(s => ({
      name: s.name,
      cron: s.cron,
      enabled: s.enabled,
      timezone: s.timezone,
      nextRun: s.nextRun?.toISOString(),
      lastRun: s.lastRun?.toISOString(),
      runCount: s.runCount,
    })),
  });
});

/**
 * GET /schedules/:name - Get schedule details
 */
app.get('/schedules/:name', (c) => {
  const name = c.req.param('name');
  const schedule = scheduler.getSchedule(name);

  if (!schedule) {
    return c.json({
      error: {
        code: 'SCHEDULE_NOT_FOUND',
        message: 'Schedule not found',
      },
    }, 404);
  }

  return c.json({
    data: {
      name: schedule.name,
      cron: schedule.cron,
      enabled: schedule.enabled,
      timezone: schedule.timezone,
      nextRun: schedule.nextRun?.toISOString(),
      lastRun: schedule.lastRun?.toISOString(),
      runCount: schedule.runCount,
    },
  });
});

/**
 * POST /schedules - Create a new schedule
 */
app.post('/schedules', async (c) => {
  try {
    const body = await c.req.json();
    const { name, cron, jobName, jobData, enabled = true, timezone = 'UTC' } = body;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return c.json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Schedule name is required',
        },
      }, 400);
    }

    if (!cron || typeof cron !== 'string') {
      return c.json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Cron expression is required',
        },
      }, 400);
    }

    if (!jobName || typeof jobName !== 'string') {
      return c.json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Job name is required',
        },
      }, 400);
    }

    // Check if schedule already exists
    const existing = scheduler.getSchedule(name);
    if (existing) {
      return c.json({
        error: {
          code: 'SCHEDULE_EXISTS',
          message: 'A schedule with this name already exists',
        },
      }, 409);
    }

    // Create handler that enqueues a job
    const handler = async () => {
      await queue.add(jobName, jobData || {}, {
        priority: 5,
        maxRetries: 3,
      });
    };

    // Register the schedule
    scheduler.schedule(name, cron, handler, {
      timezone,
      enabled,
    });

    const schedule = scheduler.getSchedule(name);

    return c.json({
      message: 'Schedule created successfully',
      data: {
        name: schedule!.name,
        cron: schedule!.cron,
        enabled: schedule!.enabled,
        timezone: schedule!.timezone,
        nextRun: schedule!.nextRun?.toISOString(),
        runCount: schedule!.runCount,
        jobName,
        jobData,
      },
    }, 201);
  } catch (error) {
    return c.json({
      error: {
        code: 'SCHEDULE_CREATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to create schedule',
      },
    }, 500);
  }
});

/**
 * DELETE /schedules/:name - Delete a schedule
 */
app.delete('/schedules/:name', (c) => {
  const name = c.req.param('name');

  const schedule = scheduler.getSchedule(name);
  if (!schedule) {
    return c.json({
      error: {
        code: 'SCHEDULE_NOT_FOUND',
        message: 'Schedule not found',
      },
    }, 404);
  }

  scheduler.unschedule(name);

  return c.json({
    message: 'Schedule deleted successfully',
    data: { name },
  });
});

/**
 * POST /schedules/:name/trigger - Manually trigger a schedule
 */
app.post('/schedules/:name/trigger', async (c) => {
  const name = c.req.param('name');

  try {
    await scheduler.trigger(name);
    return c.json({
      message: 'Schedule triggered successfully',
      data: { name },
    });
  } catch (error) {
    return c.json({
      error: {
        code: 'TRIGGER_FAILED',
        message: error instanceof Error ? error.message : 'Failed to trigger schedule',
      },
    }, 400);
  }
});

/**
 * POST /schedules/:name/enable - Enable a schedule
 */
app.post('/schedules/:name/enable', (c) => {
  const name = c.req.param('name');
  scheduler.enable(name);

  return c.json({
    message: 'Schedule enabled',
    data: { name, enabled: true },
  });
});

/**
 * POST /schedules/:name/disable - Disable a schedule
 */
app.post('/schedules/:name/disable', (c) => {
  const name = c.req.param('name');
  scheduler.disable(name);

  return c.json({
    message: 'Schedule disabled',
    data: { name, enabled: false },
  });
});

export default app;
