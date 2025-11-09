/**
 * Job Scheduler for Cron Jobs
 *
 * Features:
 * - Cron-style scheduling
 * - Named schedules (easy to manage)
 * - Timezone support
 * - One-time and recurring schedules
 *
 * @example
 * ```typescript
 * import { scheduler } from './lib/scheduler.ts';
 *
 * // Schedule a daily job at 3 AM
 * scheduler.schedule('cleanup-old-files', '0 3 * * *', async () => {
 *   await cleanupOldFiles();
 * });
 *
 * // Schedule every 5 minutes (use star-slash-5)
 * scheduler.schedule('process-webhooks', CronPatterns.EVERY_5_MINUTES, async () => {
 *   await processWebhooks();
 * });
 *
 * // Start scheduler
 * await scheduler.start();
 * ```
 */

import { createLogger } from './logger.ts';

const logger = createLogger('Scheduler');

// ============================================================================
// Types
// ============================================================================

export interface ScheduleConfig {
  name: string;
  cron: string;
  handler: () => Promise<void>;
  timezone?: string;
  enabled?: boolean;
}

export interface Schedule extends ScheduleConfig {
  nextRun?: Date;
  lastRun?: Date;
  runCount: number;
}

// ============================================================================
// Cron Parser
// ============================================================================

class CronParser {
  /**
   * Parse cron expression and calculate next run time
   * Format: minute hour day month dayOfWeek
   * Examples:
   *   "* * * * *"         - Every minute
   *   "0 * * * *"         - Every hour
   *   "0 0 * * *"         - Every day at midnight
   *   "0 0 * * 0"         - Every Sunday at midnight
   *   "star/5 * * * *"    - Every 5 minutes (replace star with *)
   *   "0 star/2 * * *"    - Every 2 hours (replace star with *)
   *   "0 9-17 * * 1-5"    - Every hour 9-17 on weekdays
   */
  static getNextRun(cron: string, from: Date = new Date()): Date {
    const parts = cron.trim().split(/\s+/);

    if (parts.length !== 5) {
      throw new Error('Invalid cron expression. Format: minute hour day month dayOfWeek');
    }

    const [minute = '*', hour = '*', day = '*', month = '*', dayOfWeek = '*'] = parts;

    // Start from next minute
    const next = new Date(from);
    next.setSeconds(0);
    next.setMilliseconds(0);
    next.setMinutes(next.getMinutes() + 1);

    // Try up to 4 years (to handle February 29th edge cases)
    const maxAttempts = 4 * 365 * 24 * 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      if (
        this.matchesPart(minute, next.getMinutes()) &&
        this.matchesPart(hour, next.getHours()) &&
        this.matchesPart(day, next.getDate()) &&
        this.matchesPart(month, next.getMonth() + 1) &&
        this.matchesPart(dayOfWeek, next.getDay())
      ) {
        return next;
      }

      next.setMinutes(next.getMinutes() + 1);
      attempts++;
    }

    throw new Error('Could not find next run time for cron expression');
  }

  private static matchesPart(
    part: string,
    value: number,
  ): boolean {
    // Wildcard
    if (part === '*') return true;

    // Step values (star/5 = every 5)
    if (part.startsWith('*/')) {
      const step = parseInt(part.slice(2));
      return value % step === 0;
    }

    // Range (9-17 = 9 through 17)
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      if (start === undefined || end === undefined) return false;
      return value >= start && value <= end;
    }

    // List (1,3,5 = 1, 3, or 5)
    if (part.includes(',')) {
      const values = part.split(',').map(Number);
      return values.includes(value);
    }

    // Exact match
    return parseInt(part) === value;
  }
}

// ============================================================================
// Scheduler Implementation
// ============================================================================

export class JobScheduler {
  private schedules = new Map<string, Schedule>();
  private isRunning = false;
  private checkInterval = 60 * 1000; // Check every minute
  private checkTimeout?: number;

  /**
   * Register a scheduled job
   */
  schedule(
    name: string,
    cron: string,
    handler: () => Promise<void>,
    options: { timezone?: string; enabled?: boolean } = {},
  ): void {
    const schedule: Schedule = {
      name,
      cron,
      handler,
      timezone: options.timezone || 'UTC',
      enabled: options.enabled ?? true,
      nextRun: CronParser.getNextRun(cron),
      runCount: 0,
    };

    this.schedules.set(name, schedule);
  }

  /**
   * Unregister a scheduled job
   */
  unschedule(name: string): void {
    this.schedules.delete(name);
  }

  /**
   * Enable a schedule
   */
  enable(name: string): void {
    const schedule = this.schedules.get(name);
    if (schedule) {
      schedule.enabled = true;
    }
  }

  /**
   * Disable a schedule
   */
  disable(name: string): void {
    const schedule = this.schedules.get(name);
    if (schedule) {
      schedule.enabled = false;
    }
  }

  /**
   * Get all schedules
   */
  getSchedules(): Schedule[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Get a specific schedule
   */
  getSchedule(name: string): Schedule | undefined {
    return this.schedules.get(name);
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.check();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.isRunning = false;
    if (this.checkTimeout) {
      clearTimeout(this.checkTimeout);
    }
  }

  /**
   * Manually trigger a scheduled job
   */
  async trigger(name: string): Promise<void> {
    const schedule = this.schedules.get(name);

    if (!schedule) {
      throw new Error(`Schedule not found: ${name}`);
    }

    await this.runSchedule(schedule);
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  private check(): void {
    if (!this.isRunning) return;

    const now = new Date();
    let nextCheckTime: Date | null = null;

    // Check all schedules
    for (const schedule of this.schedules.values()) {
      if (!schedule.enabled) continue;
      if (!schedule.nextRun) continue;

      // Time to run?
      if (now >= schedule.nextRun) {
        this.runSchedule(schedule).catch(error => {
          logger.error('Error running schedule', { scheduleName: schedule.name, error });
        });
      }

      // Track the earliest next run time
      if (!nextCheckTime || (schedule.nextRun && schedule.nextRun < nextCheckTime)) {
        nextCheckTime = schedule.nextRun;
      }
    }

    // Calculate optimal sleep time
    // Sleep until next schedule is due, but cap at 60s to handle newly added schedules
    const sleepMs = nextCheckTime
      ? Math.min(nextCheckTime.getTime() - Date.now(), this.checkInterval)
      : this.checkInterval;

    // Ensure minimum 1 second sleep to prevent tight loops
    const safeSleepMs = Math.max(sleepMs, 1000);

    // Schedule next check
    this.checkTimeout = setTimeout(() => this.check(), safeSleepMs);
  }

  private async runSchedule(schedule: Schedule): Promise<void> {
    try {
      schedule.lastRun = new Date();

      // Run the handler
      await schedule.handler();

      // Calculate next run
      schedule.nextRun = CronParser.getNextRun(schedule.cron, schedule.lastRun);
      schedule.runCount++;
    } catch (error) {
      logger.error('Schedule failed', { scheduleName: schedule.name, error });

      // Still calculate next run even if this one failed
      schedule.nextRun = CronParser.getNextRun(
        schedule.cron,
        schedule.lastRun || new Date(),
      );
    }
  }
}

// ============================================================================
// Common Cron Patterns
// ============================================================================

export const CronPatterns = {
  /** Every minute */
  EVERY_MINUTE: '* * * * *',

  /** Every 5 minutes */
  EVERY_5_MINUTES: '*/5 * * * *',

  /** Every 15 minutes */
  EVERY_15_MINUTES: '*/15 * * * *',

  /** Every 30 minutes */
  EVERY_30_MINUTES: '*/30 * * * *',

  /** Every hour */
  EVERY_HOUR: '0 * * * *',

  /** Every 2 hours */
  EVERY_2_HOURS: '0 */2 * * *',

  /** Every 6 hours */
  EVERY_6_HOURS: '0 */6 * * *',

  /** Every day at midnight */
  DAILY: '0 0 * * *',

  /** Every day at 3 AM */
  DAILY_3AM: '0 3 * * *',

  /** Every week on Sunday at midnight */
  WEEKLY: '0 0 * * 0',

  /** Every month on the 1st at midnight */
  MONTHLY: '0 0 1 * *',

  /** Business hours: 9 AM - 5 PM on weekdays */
  BUSINESS_HOURS: '0 9-17 * * 1-5',

  /** Weekdays at 9 AM */
  WEEKDAYS_9AM: '0 9 * * 1-5',
};

// ============================================================================
// Singleton Instance
// ============================================================================

export const scheduler = new JobScheduler();
