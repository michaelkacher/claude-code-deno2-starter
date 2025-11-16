/**
 * Create Job Modal
 *
 * Form for creating new background jobs
 */

import { useSignal } from '@preact/signals';
import { IS_BROWSER } from 'fresh/runtime';
import { TokenStorage } from '../../lib/storage.ts';

interface CreateJobModalProps {
  onClose: () => void;
  onJobCreated: () => void;
}

// Job templates for common job types
const JOB_TEMPLATES = {
  'send-email': {
    name: 'send-email',
    description: 'Send an email',
    dataTemplate: {
      to: 'user@example.com',
      subject: 'Hello',
      body: 'This is a test email',
    },
  },
  'generate-report': {
    name: 'generate-report',
    description: 'Generate a report',
    dataTemplate: {
      reportType: 'user-activity',
      userId: '123',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      format: 'pdf',
    },
  },
  'process-webhook': {
    name: 'process-webhook',
    description: 'Send a webhook',
    dataTemplate: {
      url: 'https://webhook.site/your-unique-url',
      method: 'POST',
      event: 'test.event',
      body: {
        message: 'Test webhook',
      },
    },
  },
  'custom': {
    name: '',
    description: 'Custom job',
    dataTemplate: {},
  },
};

export default function CreateJobModal({ onClose, onJobCreated }: CreateJobModalProps) {
  const selectedTemplate = useSignal<keyof typeof JOB_TEMPLATES>('send-email');
  const jobName = useSignal('send-email');
  const jobData = useSignal(JSON.stringify(JOB_TEMPLATES['send-email'].dataTemplate, null, 2));
  const priority = useSignal(5);
  const maxRetries = useSignal(3);
  const delay = useSignal(0);
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);

  // Get API URL (now using same-origin Fresh API)
  const getApiUrl = () => {
    if (!IS_BROWSER) return '';
    return '';
  };

  // Handle template change
  const handleTemplateChange = (template: keyof typeof JOB_TEMPLATES) => {
    selectedTemplate.value = template;
    const t = JOB_TEMPLATES[template];
    jobName.value = t.name;
    jobData.value = JSON.stringify(t.dataTemplate, null, 2);
  };

  // Handle submit
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    loading.value = true;
    error.value = null;

    try {
      // Parse and validate JSON
      let parsedData;
      try {
        parsedData = JSON.parse(jobData.value);
      } catch {
        throw new Error('Invalid JSON in job data');
      }

      // Validate job name
      if (!jobName.value.trim()) {
        throw new Error('Job name is required');
      }

      const apiUrl = getApiUrl();
      const accessToken = IS_BROWSER ? TokenStorage.getAccessToken() : null;
      const response = await fetch(`${apiUrl}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: jobName.value,
          data: parsedData,
          options: {
            priority: priority.value,
            maxRetries: maxRetries.value,
            delay: delay.value > 0 ? delay.value * 1000 : 0, // Convert to ms
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create job');
      }

      onJobCreated();
      onClose();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create job';
    } finally {
      loading.value = false;
    }
  };

  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5" onClick={onClose}>
      <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 class="m-0 text-2xl text-gray-900 dark:text-gray-100">Create New Job</h2>
          <button type="button" class="bg-transparent border-none text-3xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer p-0 w-8 h-8 leading-8 text-center" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} class="p-5">
          {/* Template Selector */}
          <div class="mb-5">
            <label class="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Job Template:</label>
            <select
              value={selectedTemplate.value}
              onChange={(e) => handleTemplateChange((e.target as HTMLSelectElement).value as keyof typeof JOB_TEMPLATES)}
              class="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {Object.entries(JOB_TEMPLATES).map(([key, template]) => (
                <option key={key} value={key}>
                  {template.description}
                </option>
              ))}
            </select>
          </div>

          {/* Job Name */}
          <div class="mb-5">
            <label class="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Job Name: *</label>
            <input
              type="text"
              value={jobName.value}
              onInput={(e) => jobName.value = (e.target as HTMLInputElement).value}
              placeholder="e.g., send-email"
              class="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              required
            />
            <small class="block mt-1 text-xs text-gray-600 dark:text-gray-400">
              Must match a registered worker type (send-email, generate-report, process-webhook)
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
              Data passed to the job handler. Must be valid JSON.
            </small>
          </div>

          {/* Options */}
          <div class="grid grid-cols-3 gap-4">
            <div class="mb-5">
              <label class="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Priority:</label>
              <input
                type="number"
                value={priority.value}
                onInput={(e) => priority.value = parseInt((e.target as HTMLInputElement).value)}
                min="0"
                max="10"
                class="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <small class="block mt-1 text-xs text-gray-600 dark:text-gray-400">0-10 (higher = more important)</small>
            </div>

            <div class="mb-5">
              <label class="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Max Retries:</label>
              <input
                type="number"
                value={maxRetries.value}
                onInput={(e) => maxRetries.value = parseInt((e.target as HTMLInputElement).value)}
                min="0"
                max="10"
                class="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <small class="block mt-1 text-xs text-gray-600 dark:text-gray-400">Number of retry attempts</small>
            </div>

            <div class="mb-5">
              <label class="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Delay (seconds):</label>
              <input
                type="number"
                value={delay.value}
                onInput={(e) => delay.value = parseInt((e.target as HTMLInputElement).value)}
                min="0"
                class="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <small class="block mt-1 text-xs text-gray-600 dark:text-gray-400">Delay before execution</small>
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
              {loading.value ? 'Creating...' : 'Create Job'}
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
