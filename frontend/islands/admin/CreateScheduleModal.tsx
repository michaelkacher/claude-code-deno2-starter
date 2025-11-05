/**
 * Create Schedule Modal
 *
 * Form for creating new scheduled jobs
 */

import { useSignal } from '@preact/signals';
import { IS_BROWSER } from '$fresh/runtime.ts';

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
    if (!IS_BROWSER) return 'http://localhost:8000';
    return window.location.origin.replace(':3000', ':8000');
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
    <div class="modal-overlay" onClick={onClose}>
      <div class="modal-content" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Create New Schedule</h2>
          <button class="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} class="schedule-form">
          {/* Schedule Name */}
          <div class="form-group">
            <label>Schedule Name: *</label>
            <input
              type="text"
              value={scheduleName.value}
              onInput={(e) => scheduleName.value = (e.target as HTMLInputElement).value}
              placeholder="e.g., daily-email-report"
              class="form-control"
              required
            />
            <small class="form-hint">
              Unique identifier for this schedule
            </small>
          </div>

          {/* Cron Pattern Selector */}
          <div class="form-group">
            <label>Schedule Pattern:</label>
            <select
              value={selectedPattern.value}
              onChange={(e) => handlePatternChange((e.target as HTMLSelectElement).value as keyof typeof CRON_PATTERNS)}
              class="form-control"
            >
              {Object.entries(CRON_PATTERNS).map(([key, pattern]) => (
                <option key={key} value={key}>
                  {pattern.label} {pattern.description && `- ${pattern.description}`}
                </option>
              ))}
            </select>
          </div>

          {/* Cron Expression */}
          <div class="form-group">
            <label>Cron Expression: *</label>
            <input
              type="text"
              value={cronExpression.value}
              onInput={(e) => cronExpression.value = (e.target as HTMLInputElement).value}
              placeholder="* * * * *"
              class="form-control code-input"
              required
            />
            <small class="form-hint">
              Format: minute hour day month dayOfWeek (e.g., "0 * * * *" = every hour)
            </small>
          </div>

          {/* Job Type Selector */}
          <div class="form-group">
            <label>Job Type: *</label>
            <select
              value={selectedJobType.value}
              onChange={(e) => handleJobTypeChange((e.target as HTMLSelectElement).value)}
              class="form-control"
            >
              {JOB_TYPES.map((job) => (
                <option key={job.name} value={job.name}>
                  {job.label}
                </option>
              ))}
            </select>
            <small class="form-hint">
              The type of job to run when this schedule triggers
            </small>
          </div>

          {/* Job Data */}
          <div class="form-group">
            <label>Job Data (JSON): *</label>
            <textarea
              value={jobData.value}
              onInput={(e) => jobData.value = (e.target as HTMLTextAreaElement).value}
              placeholder='{"key": "value"}'
              class="form-control code-input"
              rows={10}
              required
            />
            <small class="form-hint">
              Data passed to the job handler when scheduled. Must be valid JSON.
            </small>
          </div>

          {/* Options Row */}
          <div class="form-row">
            <div class="form-group">
              <label>Timezone:</label>
              <select
                value={timezone.value}
                onChange={(e) => timezone.value = (e.target as HTMLSelectElement).value}
                class="form-control"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <small class="form-hint">Timezone for schedule execution</small>
            </div>

            <div class="form-group">
              <label>Enabled:</label>
              <div class="checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={enabled.value}
                  onChange={(e) => enabled.value = (e.target as HTMLInputElement).checked}
                  class="form-checkbox"
                />
                <span>Enable schedule immediately</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error.value && (
            <div class="error-message">
              {error.value}
            </div>
          )}

          {/* Actions */}
          <div class="modal-actions">
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
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
          color: #111827;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 32px;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          line-height: 32px;
          text-align: center;
        }

        .close-button:hover {
          color: #111827;
        }

        .schedule-form {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
        }

        .form-control {
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
        }

        .code-input {
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }

        .form-control:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-hint {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 10px;
        }

        .form-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

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

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
