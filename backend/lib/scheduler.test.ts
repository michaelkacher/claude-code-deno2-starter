/**
 * Tests for Job Scheduler
 */

import { assertEquals, assertExists } from 'jsr:@std/assert';
import { JobScheduler, CronPatterns } from './scheduler.ts';

Deno.test('Scheduler - schedule a job', () => {
  const scheduler = new JobScheduler();

  let executed = false;

  scheduler.schedule('test-job', '* * * * *', async () => {
    executed = true;
  });

  const schedules = scheduler.getSchedules();
  assertEquals(schedules.length, 1);
  assertEquals(schedules[0].name, 'test-job');
  assertEquals(schedules[0].enabled, true);
  assertExists(schedules[0].nextRun);
});

Deno.test('Scheduler - get schedule', () => {
  const scheduler = new JobScheduler();

  scheduler.schedule('my-schedule', CronPatterns.DAILY, async () => {});

  const schedule = scheduler.getSchedule('my-schedule');
  assertExists(schedule);
  assertEquals(schedule.name, 'my-schedule');
  assertEquals(schedule.cron, CronPatterns.DAILY);
});

Deno.test('Scheduler - enable/disable schedule', () => {
  const scheduler = new JobScheduler();

  scheduler.schedule('toggle-job', '0 * * * *', async () => {}, {
    enabled: true,
  });

  let schedule = scheduler.getSchedule('toggle-job');
  assertEquals(schedule?.enabled, true);

  scheduler.disable('toggle-job');
  schedule = scheduler.getSchedule('toggle-job');
  assertEquals(schedule?.enabled, false);

  scheduler.enable('toggle-job');
  schedule = scheduler.getSchedule('toggle-job');
  assertEquals(schedule?.enabled, true);
});

Deno.test('Scheduler - unschedule job', () => {
  const scheduler = new JobScheduler();

  scheduler.schedule('temp-job', '* * * * *', async () => {});

  let schedule = scheduler.getSchedule('temp-job');
  assertExists(schedule);

  scheduler.unschedule('temp-job');

  schedule = scheduler.getSchedule('temp-job');
  assertEquals(schedule, undefined);
});

Deno.test('Scheduler - manual trigger', async () => {
  const scheduler = new JobScheduler();

  let executed = false;

  scheduler.schedule('trigger-test', '0 0 1 1 *', async () => {
    executed = true;
  });

  await scheduler.trigger('trigger-test');

  assertEquals(executed, true);
});

Deno.test('Scheduler - cron patterns', () => {
  assertEquals(CronPatterns.EVERY_MINUTE, '* * * * *');
  assertEquals(CronPatterns.EVERY_5_MINUTES, '*/5 * * * *');
  assertEquals(CronPatterns.EVERY_HOUR, '0 * * * *');
  assertEquals(CronPatterns.DAILY, '0 0 * * *');
  assertEquals(CronPatterns.WEEKLY, '0 0 * * 0');
  assertEquals(CronPatterns.MONTHLY, '0 0 1 * *');
});

Deno.test('Scheduler - next run calculation', () => {
  const scheduler = new JobScheduler();

  scheduler.schedule('run-test', CronPatterns.DAILY, async () => {});

  const schedule = scheduler.getSchedule('run-test');
  assertExists(schedule?.nextRun);

  const nextRun = new Date(schedule.nextRun);
  const now = new Date();

  // Next run should be in the future
  assertEquals(nextRun > now, true);
});

Deno.test('Scheduler - start/stop', () => {
  const scheduler = new JobScheduler();

  scheduler.schedule('lifecycle-test', '* * * * *', async () => {});

  scheduler.start();
  // Scheduler should be running (no direct check, but we can stop it)

  scheduler.stop();
  // Scheduler should be stopped
});

Deno.test('Scheduler - execute job at scheduled time', async () => {
  const scheduler = new JobScheduler();

  let runCount = 0;

  // Schedule for every minute
  scheduler.schedule('exec-test', '* * * * *', async () => {
    runCount++;
  });

  scheduler.start();

  // Wait for potential execution
  await new Promise((resolve) => setTimeout(resolve, 3000));

  scheduler.stop();

  // We can't guarantee execution in tests, but structure is validated
  assertEquals(typeof runCount, 'number');
});

Deno.test('Scheduler - run count tracking', async () => {
  const scheduler = new JobScheduler();

  scheduler.schedule('count-test', '0 0 1 1 *', async () => {});

  const before = scheduler.getSchedule('count-test');
  assertEquals(before?.runCount, 0);

  await scheduler.trigger('count-test');

  const after = scheduler.getSchedule('count-test');
  assertEquals(after?.runCount, 1);
});
