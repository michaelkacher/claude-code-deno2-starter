/**
 * Create Job Modal
 *
 * Form for creating new background jobs
 */

import { useSignal } from '@preact/signals';
import { IS_BROWSER } from '$fresh/runtime.ts';

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

  // Get API URL
  const getApiUrl = () => {
    if (!IS_BROWSER) return 'http://localhost:8000';
    return window.location.origin.replace(':3000', ':8000');
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
      const accessToken = IS_BROWSER ? localStorage.getItem('access_token') : null;
      const response = await fetch(`${apiUrl}/api/jobs/jobs`, {
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
    <div class="modal-overlay" onClick={onClose}>
      <div class="modal-content" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Create New Job</h2>
          <button class="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} class="job-form">
          {/* Template Selector */}
          <div class="form-group">
            <label>Job Template:</label>
            <select
              value={selectedTemplate.value}
              onChange={(e) => handleTemplateChange((e.target as HTMLSelectElement).value as keyof typeof JOB_TEMPLATES)}
              class="form-control"
            >
              {Object.entries(JOB_TEMPLATES).map(([key, template]) => (
                <option key={key} value={key}>
                  {template.description}
                </option>
              ))}
            </select>
          </div>

          {/* Job Name */}
          <div class="form-group">
            <label>Job Name: *</label>
            <input
              type="text"
              value={jobName.value}
              onInput={(e) => jobName.value = (e.target as HTMLInputElement).value}
              placeholder="e.g., send-email"
              class="form-control"
              required
            />
            <small class="form-hint">
              Must match a registered worker type (send-email, generate-report, process-webhook)
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
              Data passed to the job handler. Must be valid JSON.
            </small>
          </div>

          {/* Options */}
          <div class="form-row">
            <div class="form-group">
              <label>Priority:</label>
              <input
                type="number"
                value={priority.value}
                onInput={(e) => priority.value = parseInt((e.target as HTMLInputElement).value)}
                min="0"
                max="10"
                class="form-control"
              />
              <small class="form-hint">0-10 (higher = more important)</small>
            </div>

            <div class="form-group">
              <label>Max Retries:</label>
              <input
                type="number"
                value={maxRetries.value}
                onInput={(e) => maxRetries.value = parseInt((e.target as HTMLInputElement).value)}
                min="0"
                max="10"
                class="form-control"
              />
              <small class="form-hint">Number of retry attempts</small>
            </div>

            <div class="form-group">
              <label>Delay (seconds):</label>
              <input
                type="number"
                value={delay.value}
                onInput={(e) => delay.value = parseInt((e.target as HTMLInputElement).value)}
                min="0"
                class="form-control"
              />
              <small class="form-hint">Delay before execution</small>
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
              {loading.value ? 'Creating...' : 'Create Job'}
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

        .job-form {
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
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
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
