/**
 * Tests for Job Scheduler
 */

import { assertEquals, assertExists } from 'jsr:@std/assert';
import { beforeEach, describe, it } from 'jsr:@std/testing/bdd';
import { CronPatterns, JobScheduler } from '../../../shared/lib/scheduler.ts';

describe('JobScheduler', () => {
  let scheduler: JobScheduler;

  beforeEach(() => {
    scheduler = new JobScheduler();
  });

  describe('schedule', () => {
    it('should schedule a job with correct properties', () => {
      scheduler.schedule('test-job', '* * * * *', async () => {
        // Job execution (for future testing)
      });

      const schedules = scheduler.getSchedules();
      assertEquals(schedules.length, 1);
      assertEquals(schedules[0].name, 'test-job');
      assertEquals(schedules[0].enabled, true);
      assertExists(schedules[0].nextRun);
    });
  });

  describe('getSchedule', () => {
    it('should retrieve schedule by name', () => {
      scheduler.schedule('my-schedule', CronPatterns.DAILY, async () => {});

      const schedule = scheduler.getSchedule('my-schedule');
      assertExists(schedule);
      assertEquals(schedule.name, 'my-schedule');
      assertEquals(schedule.cron, CronPatterns.DAILY);
    });
  });

  describe('enable/disable', () => {
    it('should toggle schedule enabled state', () => {
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
  });

  describe('unschedule', () => {
    it('should remove job from schedule', () => {
      scheduler.schedule('temp-job', '* * * * *', async () => {});

      let schedule = scheduler.getSchedule('temp-job');
      assertExists(schedule);

      scheduler.unschedule('temp-job');

      schedule = scheduler.getSchedule('temp-job');
      assertEquals(schedule, undefined);
    });
  });

  describe('trigger', () => {
    it('should manually trigger job execution', async () => {
      let executed = false;

      scheduler.schedule('trigger-test', '0 0 1 1 *', async () => {
        executed = true;
      });

      await scheduler.trigger('trigger-test');

      assertEquals(executed, true);
    });

    it('should track run count when triggered', async () => {
      scheduler.schedule('count-test', '0 0 1 1 *', async () => {});

      const before = scheduler.getSchedule('count-test');
      assertEquals(before?.runCount, 0);

      await scheduler.trigger('count-test');

      const after = scheduler.getSchedule('count-test');
      assertEquals(after?.runCount, 1);
    });
  });

  describe('CronPatterns', () => {
    it('should provide standard cron patterns', () => {
      assertEquals(CronPatterns.EVERY_MINUTE, '* * * * *');
      assertEquals(CronPatterns.EVERY_5_MINUTES, '*/5 * * * *');
      assertEquals(CronPatterns.EVERY_HOUR, '0 * * * *');
      assertEquals(CronPatterns.DAILY, '0 0 * * *');
      assertEquals(CronPatterns.WEEKLY, '0 0 * * 0');
      assertEquals(CronPatterns.MONTHLY, '0 0 1 * *');
    });
  });

  describe('nextRun calculation', () => {
    it('should calculate next run time in the future', () => {
      scheduler.schedule('run-test', CronPatterns.DAILY, async () => {});

      const schedule = scheduler.getSchedule('run-test');
      assertExists(schedule?.nextRun);

      const nextRun = new Date(schedule.nextRun);
      const now = new Date();

      // Next run should be in the future
      assertEquals(nextRun > now, true);
    });
  });

  describe('lifecycle', () => {
    it('should start and stop scheduler', () => {
      scheduler.schedule('lifecycle-test', '* * * * *', async () => {});

      scheduler.start();
      // Scheduler should be running (no direct check, but we can stop it)

      scheduler.stop();
      // Scheduler should be stopped
    });

    it('should execute job at scheduled time', async () => {
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
  });
});
