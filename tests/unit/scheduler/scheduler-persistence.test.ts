/**
 * Tests for Job Scheduler Persistence (Deno KV)
 * 
 * Tests the persistence layer that saves/loads schedules to/from Deno KV
 */

/// <reference lib="deno.unstable" />

import { assertEquals, assertExists } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { JobScheduler, type PersistedScheduleData } from '../../../shared/lib/scheduler.ts';
import { setupTestKv } from '../../helpers/kv-test.ts';

describe('JobScheduler Persistence', () => {
  let kv: Deno.Kv;
  let cleanup: () => Promise<void>;
  let scheduler: JobScheduler;

  beforeEach(async () => {
    const setup = await setupTestKv();
    kv = setup.kv;
    cleanup = setup.cleanup;
    scheduler = new JobScheduler();
    
    // Inject the test KV instance into the scheduler
    // This allows us to test persistence without affecting the real database
    // We skip calling scheduler.init() and directly set the KV instance
    (scheduler as unknown as { kv: Deno.Kv }).kv = kv;
  });

  afterEach(async () => {
    scheduler.stop();
    await cleanup();
  });

  describe('scheduleAndPersist', () => {
    it('should save schedule configuration to KV', async () => {
      // Arrange
      const handler = async () => {
        // Test handler
      };
      const jobData = { to: 'test@example.com', subject: 'Test' };

      // Act
      await scheduler.scheduleAndPersist(
        'test-schedule',
        '0 * * * *',
        'send-email',
        jobData,
        handler,
        { timezone: 'America/New_York', enabled: true }
      );

      // Assert - Check schedule is in memory
      const schedule = scheduler.getSchedule('test-schedule');
      assertExists(schedule);
      assertEquals(schedule.name, 'test-schedule');
      assertEquals(schedule.cron, '0 * * * *');
      assertEquals(schedule.timezone, 'America/New_York');
      assertEquals(schedule.enabled, true);

      // Assert - Check schedule is persisted in KV
      const kvEntry = await kv.get<PersistedScheduleData>(['schedules', 'test-schedule']);
      assertExists(kvEntry.value);
      assertEquals(kvEntry.value.name, 'test-schedule');
      assertEquals(kvEntry.value.cron, '0 * * * *');
      assertEquals(kvEntry.value.jobName, 'send-email');
      assertEquals(kvEntry.value.jobData, jobData);
      assertEquals(kvEntry.value.timezone, 'America/New_York');
      assertEquals(kvEntry.value.enabled, true);
      assertEquals(kvEntry.value.runCount, 0);
      assertExists(kvEntry.value.nextRun);
    });

    it('should use default timezone UTC when not specified', async () => {
      // Arrange
      const handler = async () => {};

      // Act
      await scheduler.scheduleAndPersist(
        'default-tz-schedule',
        '0 * * * *',
        'test-job',
        {},
        handler
      );

      // Assert
      const kvEntry = await kv.get<PersistedScheduleData>(['schedules', 'default-tz-schedule']);
      assertEquals(kvEntry.value?.timezone, 'UTC');
    });

    it('should enable schedule by default', async () => {
      // Arrange
      const handler = async () => {};

      // Act
      await scheduler.scheduleAndPersist(
        'default-enabled-schedule',
        '0 * * * *',
        'test-job',
        {},
        handler
      );

      // Assert
      const kvEntry = await kv.get<PersistedScheduleData>(['schedules', 'default-enabled-schedule']);
      assertEquals(kvEntry.value?.enabled, true);
    });

    it('should respect enabled: false option', async () => {
      // Arrange
      const handler = async () => {};

      // Act
      await scheduler.scheduleAndPersist(
        'disabled-schedule',
        '0 * * * *',
        'test-job',
        {},
        handler,
        { enabled: false }
      );

      // Assert
      const schedule = scheduler.getSchedule('disabled-schedule');
      assertEquals(schedule?.enabled, false);

      const kvEntry = await kv.get<PersistedScheduleData>(['schedules', 'disabled-schedule']);
      assertEquals(kvEntry.value?.enabled, false);
    });
  });

  describe('loadSchedules', () => {
    it('should restore schedules from KV', async () => {
      // Arrange - Seed KV with persisted schedule data
      const persistedData: PersistedScheduleData = {
        name: 'persisted-schedule',
        cron: '*/5 * * * *',
        jobName: 'send-email',
        jobData: { to: 'test@example.com', subject: 'Restored' },
        timezone: 'Europe/London',
        enabled: true,
        nextRun: new Date(Date.now() + 60000).toISOString(),
        runCount: 5,
      };
      await kv.set(['schedules', 'persisted-schedule'], persistedData);

      // Act - Load schedules with handler factory
      let handlerCalled = false;
      const handlerFactory = (jobName: string, jobData: Record<string, unknown>) => {
        assertEquals(jobName, 'send-email');
        assertEquals(jobData, { to: 'test@example.com', subject: 'Restored' });
        
        return async () => {
          handlerCalled = true;
        };
      };

      await scheduler.loadSchedules(handlerFactory);

      // Assert - Schedule is restored in memory
      const schedule = scheduler.getSchedule('persisted-schedule');
      assertExists(schedule);
      assertEquals(schedule.name, 'persisted-schedule');
      assertEquals(schedule.cron, '*/5 * * * *');
      assertEquals(schedule.timezone, 'Europe/London');
      assertEquals(schedule.enabled, true);
      assertEquals(schedule.runCount, 5);
      assertExists(schedule.nextRun);

      // Assert - Handler is recreated and functional
      await schedule.handler();
      assertEquals(handlerCalled, true);
    });

    it('should restore multiple schedules', async () => {
      // Arrange - Seed multiple schedules
      const schedule1: PersistedScheduleData = {
        name: 'schedule-1',
        cron: '0 * * * *',
        jobName: 'job-1',
        jobData: {},
        timezone: 'UTC',
        enabled: true,
        runCount: 0,
      };
      const schedule2: PersistedScheduleData = {
        name: 'schedule-2',
        cron: '*/15 * * * *',
        jobName: 'job-2',
        jobData: {},
        timezone: 'UTC',
        enabled: false,
        runCount: 0,
      };

      await kv.set(['schedules', 'schedule-1'], schedule1);
      await kv.set(['schedules', 'schedule-2'], schedule2);

      // Act
      const handlerFactory = () => async () => {};
      await scheduler.loadSchedules(handlerFactory);

      // Assert
      const schedules = scheduler.getSchedules();
      assertEquals(schedules.length, 2);
      
      const s1 = scheduler.getSchedule('schedule-1');
      const s2 = scheduler.getSchedule('schedule-2');
      
      assertExists(s1);
      assertExists(s2);
      assertEquals(s1.enabled, true);
      assertEquals(s2.enabled, false);
    });

    it('should calculate nextRun when not stored', async () => {
      // Arrange - Schedule without nextRun
      const persistedData: PersistedScheduleData = {
        name: 'no-next-run',
        cron: '0 0 * * *',
        jobName: 'test-job',
        jobData: {},
        timezone: 'UTC',
        enabled: true,
        runCount: 0,
      };
      await kv.set(['schedules', 'no-next-run'], persistedData);

      // Act
      const handlerFactory = () => async () => {};
      await scheduler.loadSchedules(handlerFactory);

      // Assert - nextRun is calculated from cron expression
      const schedule = scheduler.getSchedule('no-next-run');
      assertExists(schedule?.nextRun);
      assertEquals(schedule.nextRun > new Date(), true);
    });
  });

  describe('unscheduleAndDelete', () => {
    it('should remove schedule from memory and KV', async () => {
      // Arrange - Create a persisted schedule
      const handler = async () => {};
      await scheduler.scheduleAndPersist(
        'to-delete',
        '0 * * * *',
        'test-job',
        {},
        handler
      );

      // Verify it exists
      assertExists(scheduler.getSchedule('to-delete'));
      const beforeDelete = await kv.get(['schedules', 'to-delete']);
      assertExists(beforeDelete.value);

      // Act
      await scheduler.unscheduleAndDelete('to-delete');

      // Assert - Removed from memory
      const memorySchedule = scheduler.getSchedule('to-delete');
      assertEquals(memorySchedule, undefined);

      // Assert - Removed from KV
      const kvEntry = await kv.get(['schedules', 'to-delete']);
      assertEquals(kvEntry.value, null);
    });
  });

  describe('enable/disable persistence', () => {
    it('should update enabled state in KV when enabling', async () => {
      // Arrange - Create disabled schedule
      const handler = async () => {};
      await scheduler.scheduleAndPersist(
        'toggle-schedule',
        '0 * * * *',
        'test-job',
        {},
        handler,
        { enabled: false }
      );

      // Act - Enable the schedule
      await scheduler.enable('toggle-schedule');

      // Assert - Memory is updated
      const schedule = scheduler.getSchedule('toggle-schedule');
      assertEquals(schedule?.enabled, true);

      // Assert - KV is updated
      const kvEntry = await kv.get<PersistedScheduleData>(['schedules', 'toggle-schedule']);
      assertEquals(kvEntry.value?.enabled, true);
    });

    it('should update enabled state in KV when disabling', async () => {
      // Arrange - Create enabled schedule
      const handler = async () => {};
      await scheduler.scheduleAndPersist(
        'toggle-schedule',
        '0 * * * *',
        'test-job',
        {},
        handler,
        { enabled: true }
      );

      // Act - Disable the schedule
      await scheduler.disable('toggle-schedule');

      // Assert - Memory is updated
      const schedule = scheduler.getSchedule('toggle-schedule');
      assertEquals(schedule?.enabled, false);

      // Assert - KV is updated
      const kvEntry = await kv.get<PersistedScheduleData>(['schedules', 'toggle-schedule']);
      assertEquals(kvEntry.value?.enabled, false);
    });

    it('should handle enable on non-persisted schedule gracefully', async () => {
      // Arrange - Create in-memory-only schedule (using old schedule() method)
      scheduler.schedule('memory-only', '0 * * * *', async () => {});

      // Act - Enable should work but not crash when KV entry doesn't exist
      await scheduler.enable('memory-only');

      // Assert - Schedule is enabled in memory
      const schedule = scheduler.getSchedule('memory-only');
      assertEquals(schedule?.enabled, true);

      // KV entry should not exist (this is expected for non-persisted schedules)
      const kvEntry = await kv.get(['schedules', 'memory-only']);
      assertEquals(kvEntry.value, null);
    });
  });

  describe('schedule state persistence', () => {
    it('should update runCount in KV after execution', async () => {
      // Arrange - Create schedule
      let executed = false;
      const handler = async () => {
        executed = true;
      };
      
      await scheduler.scheduleAndPersist(
        'count-schedule',
        '0 0 1 1 *', // Far future
        'test-job',
        {},
        handler
      );

      // Act - Manually trigger execution
      await scheduler.trigger('count-schedule');

      // Assert - Handler was called
      assertEquals(executed, true);

      // Assert - Memory runCount is updated
      const schedule = scheduler.getSchedule('count-schedule');
      assertEquals(schedule?.runCount, 1);

      // Assert - KV runCount is updated
      const kvEntry = await kv.get<PersistedScheduleData>(['schedules', 'count-schedule']);
      assertEquals(kvEntry.value?.runCount, 1);
      assertExists(kvEntry.value?.lastRun);
    });

    it('should update lastRun timestamp in KV after execution', async () => {
      // Arrange
      const handler = async () => {};
      await scheduler.scheduleAndPersist(
        'time-schedule',
        '0 0 1 1 *',
        'test-job',
        {},
        handler
      );

      const beforeRun = new Date();

      // Act
      await scheduler.trigger('time-schedule');

      const afterRun = new Date();

      // Assert - lastRun is set in memory
      const schedule = scheduler.getSchedule('time-schedule');
      assertExists(schedule?.lastRun);
      
      // lastRun should be between before and after
      assertEquals(schedule.lastRun >= beforeRun, true);
      assertEquals(schedule.lastRun <= afterRun, true);

      // Assert - lastRun is persisted in KV
      const kvEntry = await kv.get<PersistedScheduleData>(['schedules', 'time-schedule']);
      assertExists(kvEntry.value?.lastRun);
      
      const lastRunDate = new Date(kvEntry.value.lastRun);
      assertEquals(lastRunDate >= beforeRun, true);
      assertEquals(lastRunDate <= afterRun, true);
    });

    it('should persist state even when handler fails', async () => {
      // Arrange - Handler that throws
      const handler = async () => {
        throw new Error('Handler failed');
      };
      
      await scheduler.scheduleAndPersist(
        'failing-schedule',
        '0 0 1 1 *',
        'test-job',
        {},
        handler
      );

      // Act - Trigger (will fail but should still update state)
      try {
        await scheduler.trigger('failing-schedule');
      } catch {
        // Expected to fail
      }

      // Assert - State is still persisted despite failure
      const kvEntry = await kv.get<PersistedScheduleData>(['schedules', 'failing-schedule']);
      assertExists(kvEntry.value?.lastRun);
      assertExists(kvEntry.value?.nextRun);
    });
  });

  describe('integration: full persistence lifecycle', () => {
    it('should persist schedule through create -> modify -> delete lifecycle', async () => {
      // Step 1: Create schedule
      const handler = async () => {};
      await scheduler.scheduleAndPersist(
        'lifecycle-test',
        '0 * * * *',
        'test-job',
        { key: 'value' },
        handler,
        { timezone: 'UTC', enabled: true }
      );

      // Verify creation
      let kvEntry = await kv.get<PersistedScheduleData>(['schedules', 'lifecycle-test']);
      assertEquals(kvEntry.value?.enabled, true);
      assertEquals(kvEntry.value?.runCount, 0);

      // Step 2: Execute schedule
      await scheduler.trigger('lifecycle-test');

      // Verify state update
      kvEntry = await kv.get<PersistedScheduleData>(['schedules', 'lifecycle-test']);
      assertEquals(kvEntry.value?.runCount, 1);
      assertExists(kvEntry.value?.lastRun);

      // Step 3: Disable schedule
      await scheduler.disable('lifecycle-test');

      // Verify disable persisted
      kvEntry = await kv.get<PersistedScheduleData>(['schedules', 'lifecycle-test']);
      assertEquals(kvEntry.value?.enabled, false);

      // Step 4: Enable schedule
      await scheduler.enable('lifecycle-test');

      // Verify enable persisted
      kvEntry = await kv.get<PersistedScheduleData>(['schedules', 'lifecycle-test']);
      assertEquals(kvEntry.value?.enabled, true);

      // Step 5: Delete schedule
      await scheduler.unscheduleAndDelete('lifecycle-test');

      // Verify deletion
      kvEntry = await kv.get(['schedules', 'lifecycle-test']);
      assertEquals(kvEntry.value, null);
      assertEquals(scheduler.getSchedule('lifecycle-test'), undefined);
    });

    it('should restore schedule after simulated restart', async () => {
      // Step 1: Create and execute schedule
      let executeCount = 0;
      const handler = async () => {
        executeCount++;
      };

      await scheduler.scheduleAndPersist(
        'restart-test',
        '*/5 * * * *',
        'test-job',
        { message: 'test' },
        handler
      );

      await scheduler.trigger('restart-test');
      assertEquals(executeCount, 1);

      // Step 2: Simulate restart - create new scheduler instance
      const newScheduler = new JobScheduler();
      (newScheduler as unknown as { kv: Deno.Kv }).kv = kv; // Use same test KV

      // Step 3: Load schedules from KV
      let newExecuteCount = 0;
      const handlerFactory = (jobName: string, jobData: Record<string, unknown>) => {
        assertEquals(jobName, 'test-job');
        assertEquals(jobData, { message: 'test' });
        
        return async () => {
          newExecuteCount++;
        };
      };

      await newScheduler.loadSchedules(handlerFactory);

      // Step 4: Verify schedule is restored
      const restoredSchedule = newScheduler.getSchedule('restart-test');
      assertExists(restoredSchedule);
      assertEquals(restoredSchedule.name, 'restart-test');
      assertEquals(restoredSchedule.cron, '*/5 * * * *');
      assertEquals(restoredSchedule.runCount, 1); // Preserved from before restart

      // Step 5: Execute restored schedule
      await newScheduler.trigger('restart-test');
      assertEquals(newExecuteCount, 1);

      // Cleanup
      newScheduler.stop();
    });
  });
});
