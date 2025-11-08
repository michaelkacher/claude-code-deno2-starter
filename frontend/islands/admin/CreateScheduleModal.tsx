/**
 * Create Schedule Modal
 *
 * Form for creating new scheduled jobs
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useSignal } from '@preact/signals';

interface CreateScheduleModalProps {
  onClose: () => void;
  onScheduleCreated: () => void;
}

// Common cron patterns
const CRON_PATTERNS = {
  'every-minute': {
    label: 'Every Minute',
    cron: '* * * * *',
    description: 'Runs every minute',
  },
  'every-5-minutes': {
    label: 'Every 5 Minutes',
    cron: '*/5 * * * *',
    description: 'Runs every 5 minutes',
  },
  'every-15-minutes': {
    label: 'Every 15 Minutes',
    cron: '*/15 * * * *',
    description: 'Runs every 15 minutes',
  },
  'every-30-minutes': {
    label: 'Every 30 Minutes',
    cron: '*/30 * * * *',
    description: 'Runs every 30 minutes',
  },
  'hourly': {
    label: 'Every Hour',
    cron: '0 * * * *',
    description: 'Runs at the start of every hour',
  },
  'daily': {
    label: 'Daily at Midnight',
    cron: '0 0 * * *',
    description: 'Runs every day at midnight',
  },
  'daily-9am': {
    label: 'Daily at 9 AM',
    cron: '0 9 * * *',
    description: 'Runs every day at 9:00 AM',
  },
  'weekly': {
    label: 'Weekly (Monday)',
    cron: '0 0 * * 1',
    description: 'Runs every Monday at midnight',
  },
  'monthly': {
    label: 'Monthly (1st day)',
    cron: '0 0 1 * *',
    description: 'Runs on the 1st day of every month at midnight',
  },
  'custom': {
    label: 'Custom',
    cron: '',
    description: 'Enter your own cron expression',
  },
};

// Job types that can be scheduled
const JOB_TYPES = [
  {
    name: 'send-email',
    label: 'Send Email',
    dataTemplate: {
      to: 'user@example.com',
      subject: 'Scheduled Email',
      body: 'This is a scheduled email',
    },
  },
  {
    name: 'generate-report',
    label: 'Generate Report',
    dataTemplate: {
      reportType: 'user-activity',
      userId: '123',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      format: 'pdf',
    },
  },
  {
    name: 'process-webhook',
    label: 'Process Webhook',
    dataTemplate: {
      url: 'https://webhook.site/your-unique-url',
      method: 'POST',
      event: 'scheduled.event',
      body: {
        message: 'Scheduled webhook',
      },
    },
  },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export default function CreateScheduleModal({ onClose, onScheduleCreated }: CreateScheduleModalProps) {
  const scheduleName = useSignal('');
  const selectedPattern = useSignal<keyof typeof CRON_PATTERNS>('hourly');
  const cronExpression = useSignal('0 * * * *');
  const selectedJobType = useSignal('send-email');
  const jobData = useSignal(JSON.stringify(JOB_TYPES[0].dataTemplate, null, 2));
  const timezone = useSignal('UTC');
  const enabled = useSignal(true);
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);

  // Get API URL
  const getApiUrl = () => {
    if (!IS_BROWSER) return 'http://localhost:3000';
    return window.location.origin;
  };

  // Handle pattern change
  const handlePatternChange = (pattern: keyof typeof CRON_PATTERNS) => {
    selectedPattern.value = pattern;
    const p = CRON_PATTERNS[pattern];
    cronExpression.value = p.cron;
  };

  // Handle job type change
  const handleJobTypeChange = (jobType: string) => {
    selectedJobType.value = jobType;
    const job = JOB_TYPES.find(j => j.name === jobType);
    if (job) {
      jobData.value = JSON.stringify(job.dataTemplate, null, 2);
    }
  };

  // Validate cron expression format
  const validateCron = (cron: string): boolean => {
    const parts = cron.trim().split(/\s+/);
    return parts.length === 5; // minute hour day month dayOfWeek
  };

  // Handle submit
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    loading.value = true;
    error.value = null;

    try {
      // Validate schedule name
      if (!scheduleName.value.trim()) {
        throw new Error('Schedule name is required');
      }

      // Validate cron expression
      if (!cronExpression.value.trim()) {
        throw new Error('Cron expression is required');
      }

      if (!validateCron(cronExpression.value)) {
        throw new Error('Invalid cron expression format. Expected: minute hour day month dayOfWeek');
      }

      // Parse and validate job data JSON
      let parsedData;
      try {
        parsedData = JSON.parse(jobData.value);
      } catch {
        throw new Error('Invalid JSON in job data');
      }

      const apiUrl = getApiUrl();
      const accessToken = IS_BROWSER ? localStorage.getItem('access_token') : null;
      const response = await fetch(`${apiUrl}/api/jobs/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: scheduleName.value,
          cron: cronExpression.value,
          jobName: selectedJobType.value,
          jobData: parsedData,
          enabled: enabled.value,
          timezone: timezone.value,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create schedule');
      }

      onScheduleCreated();
      onClose();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create schedule';
    } finally {
      loading.value = false;
    }
  };

  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5" onClick={onClose}>
      <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 class="m-0 text-2xl text-gray-900 dark:text-gray-100">Create New Schedule</h2>
          <button class="bg-transparent border-none text-3xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer p-0 w-8 h-8 leading-8 text-center" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} class="p-5">
          {/* Schedule Name */}
          <div class="mb-5">
            <label class="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Schedule Name: *</label>
            <input
              type="text"
              value={scheduleName.value}
              onInput={(e) => scheduleName.value = (e.target as HTMLInputElement).value}
              placeholder="e.g., daily-email-report"
              class="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              required
            />
            <small class="block mt-1 text-xs text-gray-600 dark:text-gray-400">
              Unique identifier for this schedule
            </small>
          </div>

          {/* Cron Pattern Selector */}
          <div class="mb-5">
            <label class="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Schedule Pattern:</label>
            <select
              value={selectedPattern.value}
              onChange={(e) => handlePatternChange((e.target as HTMLSelectElement).value as keyof typeof CRON_PATTERNS)}
              class="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {Object.entries(CRON_PATTERNS).map(([key, pattern]) => (
                <option key={key} value={key}>
                  {pattern.label} {pattern.description && `- ${pattern.description}`}
                </option>
              ))}
            </select>
          </div>

          {/* Cron Expression */}
          <div class="mb-5">
            <label class="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Cron Expression: *</label>
            <input
              type="text"
              value={cronExpression.value}
              onInput={(e) => cronExpression.value = (e.target as HTMLInputElement).value}
              placeholder="* * * * *"
              class="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              required
            />
            <small class="block mt-1 text-xs text-gray-600 dark:text-gray-400">
              Format: minute hour day month dayOfWeek (e.g., "0 * * * *" = every hour)
            </small>
          </div>

          {/* Job Type Selector */}
          <div class="mb-5">
            <label class="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Job Type: *</label>
            <select
              value={selectedJobType.value}
              onChange={(e) => handleJobTypeChange((e.target as HTMLSelectElement).value)}
              class="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {JOB_TYPES.map((job) => (
                <option key={job.name} value={job.name}>
                  {job.label}
                </option>
              ))}
            </select>
            <small class="block mt-1 text-xs text-gray-600 dark:text-gray-400">
              The type of job to run when this schedule triggers
            </small>
          </div>

          {/* Job Data */}
          <div class="mb-5">
            <label class="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Job Data (JSON): *</label>
            <textarea
              value={jobData.value}
              onInput={(e) => jobData.value = (e.target as HTMLTextAreaElement).value}
              placeholder='{"key": "value"}'
              class="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              rows={10}
              required
            />
            <small class="block mt-1 text-xs text-gray-600 dark:text-gray-400">
              Data passed to the job handler when scheduled. Must be valid JSON.
            </small>
          </div>

          {/* Options Row */}
          <div class="grid grid-cols-2 gap-4">
            <div class="mb-5">
              <label class="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Timezone:</label>
              <select
                value={timezone.value}
                onChange={(e) => timezone.value = (e.target as HTMLSelectElement).value}
                class="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <small class="block mt-1 text-xs text-gray-600 dark:text-gray-400">Timezone for schedule execution</small>
            </div>

            <div class="mb-5">
              <label class="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Enabled:</label>
              <div class="flex items-center gap-2 pt-2.5">
                <input
                  type="checkbox"
                  checked={enabled.value}
                  onChange={(e) => enabled.value = (e.target as HTMLInputElement).checked}
                  class="w-[18px] h-[18px] cursor-pointer"
                />
                <span class="text-gray-700 dark:text-gray-200">Enable schedule immediately</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error.value && (
            <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-200 px-3 py-2 rounded-md mb-5 text-sm">
              {error.value}
            </div>
          )}

          {/* Actions */}
          <div class="flex justify-end gap-3 pt-5 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              class="btn btn-secondary"
              disabled={loading.value}
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              disabled={loading.value}
            >
              {loading.value ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .btn {
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          font-size: 14px;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        :global(.dark) .btn-secondary {
          background: #374151;
          color: #f3f4f6;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        :global(.dark) .btn-secondary:hover:not(:disabled) {
          background: #4b5563;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

