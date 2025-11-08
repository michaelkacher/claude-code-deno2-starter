/**
 * Test data builders for creating mock data
 * Use these to create consistent test data across your test suite
 */

import type { User } from '@/types';
import type { JobOptions } from '../../shared/lib/queue.ts';

/**
 * Build a User object with default values
 * Override any properties as needed
 */
export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Build an array of users
 */
export function buildUsers(count: number): User[] {
  return Array.from({ length: count }, (_, i) =>
    buildUser({
      id: `test-user-${i}`,
      email: `test${i}@example.com`,
      name: `Test User ${i}`,
    })
  );
}

/**
 * Job Builder - Creates job data for queue tests
 */
export class JobBuilder {
  private name = 'test-job';
  private data: Record<string, unknown> = { test: true };
  private options: Partial<JobOptions> = {};

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withData(data: Record<string, unknown>): this {
    this.data = data;
    return this;
  }

  withPriority(priority: number): this {
    this.options.priority = priority;
    return this;
  }

  withMaxRetries(maxRetries: number): this {
    this.options.maxRetries = maxRetries;
    return this;
  }

  withDelay(delay: number): this {
    this.options.delay = delay;
    return this;
  }

  getParams(): [string, Record<string, unknown>, Partial<JobOptions>] {
    return [this.name, this.data, this.options];
  }
}

/**
 * Creates a new job builder
 */
export function buildJob(): JobBuilder {
  return new JobBuilder();
}

/**
 * Schedule Builder - Creates schedule data for scheduler tests
 */
export class ScheduleBuilder {
  private name = 'test-schedule';
  private cron = '* * * * *';
  private handler: () => Promise<void> = async () => {};
  private enabled = true;

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withCron(cron: string): this {
    this.cron = cron;
    return this;
  }

  withHandler(handler: () => Promise<void>): this {
    this.handler = handler;
    return this;
  }

  withEnabled(enabled: boolean): this {
    this.enabled = enabled;
    return this;
  }

  getParams(): [string, string, () => Promise<void>, { enabled: boolean }] {
    return [this.name, this.cron, this.handler, { enabled: this.enabled }];
  }
}

/**
 * Creates a new schedule builder
 */
export function buildSchedule(): ScheduleBuilder {
  return new ScheduleBuilder();
}

/**
 * Notification Builder - Creates notification data for tests
 */
export function buildNotification(overrides: {
  id?: string;
  userId?: string;
  type?: 'info' | 'warning' | 'error';
  message?: string;
  read?: boolean;
  createdAt?: string;
} = {}) {
  return {
    id: `notification-${Date.now()}`,
    userId: 'test-user',
    type: 'info' as const,
    message: 'Test notification',
    read: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
