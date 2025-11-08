/**
 * Background Jobs Admin Dashboard
 *
 * Monitor and manage background jobs and schedules
 * Uses centralized WebSocket service for real-time updates
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { TokenStorage } from '../../lib/storage.ts';
import {
  jobs,
  jobStats,
  schedules,
  setJobs,
  setSchedules,
  updateJob,
  updateJobStats,
  type Job
} from '../../lib/store.ts';
import { subscribeToChannel } from '../../lib/websocket.ts';
import CreateJobModal from './CreateJobModal.tsx';
import CreateScheduleModal from './CreateScheduleModal.tsx';

export default function JobDashboard() {
  const selectedTab = useSignal<'jobs' | 'schedules'>('jobs');
  const statusFilter = useSignal<string>('all');
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);
  const showCreateModal = useSignal(false);
  const showCreateScheduleModal = useSignal(false);

  // Get API URL (now using same-origin Fresh API)
  const getApiUrl = () => {
    if (!IS_BROWSER) return '';
    return '';
  };

  // Refresh access token
  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Send refresh_token cookie
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (data.data?.accessToken && IS_BROWSER) {
        TokenStorage.setAccessToken(data.data.accessToken);
        return true;
      }

      return false;
    } catch (err) {
      console.error('Failed to refresh token:', err);
      return false;
    }
  };

  // Handle authentication errors
  const handleAuthError = async () => {
    // Try to refresh the token
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Token refreshed successfully, retry the requests
      await fetchJobs();
      await fetchStats();
      await fetchSchedules();
    } else {
      // Refresh failed, redirect to login
      if (IS_BROWSER) {
        TokenStorage.removeAccessToken();
        window.location.href = '/login?redirect=/admin/jobs';
      }
    }
  };

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      loading.value = true;
      error.value = null;

      const apiUrl = getApiUrl();
      const accessToken = IS_BROWSER ? TokenStorage.getAccessToken() : null;
      const statusParam = statusFilter.value !== 'all' ? `?status=${statusFilter.value}` : '';
      const response = await fetch(`${apiUrl}/api/jobs${statusParam}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        // Token expired or invalid - try to refresh
        await handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch jobs');

      const data = await response.json();
      console.log('[JobDashboard] Fetched jobs response:', data);
      setJobs(data.data?.jobs || []);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch jobs';
      console.error('Failed to fetch jobs:', err);
    } finally {
      loading.value = false;
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const apiUrl = getApiUrl();
      const accessToken = IS_BROWSER ? TokenStorage.getAccessToken() : null;
      const response = await fetch(`${apiUrl}/api/jobs/stats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        // Will be handled by fetchJobs
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      updateJobStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Fetch schedules
  const fetchSchedules = async () => {
    try {
      const apiUrl = getApiUrl();
      const accessToken = IS_BROWSER ? TokenStorage.getAccessToken() : null;
      const response = await fetch(`${apiUrl}/api/jobs/schedules`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        // Will be handled by fetchJobs
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch schedules');

      const data = await response.json();
      console.log('[JobDashboard] Fetched schedules response:', data);
      setSchedules(data.data?.schedules || []);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    }
  };

  // Retry job
  const retryJob = async (jobId: string) => {
    try {
      const apiUrl = getApiUrl();
      const accessToken = IS_BROWSER ? TokenStorage.getAccessToken() : null;
      const response = await fetch(`${apiUrl}/api/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to retry job');

      await fetchJobs();
      await fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to retry job');
    }
  };

  // Delete job
  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const apiUrl = getApiUrl();
      const accessToken = IS_BROWSER ? TokenStorage.getAccessToken() : null;
      const response = await fetch(`${apiUrl}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete job');

      await fetchJobs();
      await fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  // Trigger schedule
  const triggerSchedule = async (name: string) => {
    try {
      const apiUrl = getApiUrl();
      const accessToken = IS_BROWSER ? TokenStorage.getAccessToken() : null;
      const response = await fetch(`${apiUrl}/api/jobs/schedules/${name}/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to trigger schedule');

      alert(`Schedule "${name}" triggered successfully`);
      await fetchSchedules();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to trigger schedule');
    }
  };

  // Toggle schedule
  const toggleSchedule = async (name: string, enabled: boolean) => {
    try {
      const apiUrl = getApiUrl();
      const accessToken = IS_BROWSER ? TokenStorage.getAccessToken() : null;
      const endpoint = enabled ? 'disable' : 'enable';
      const response = await fetch(`${apiUrl}/api/jobs/schedules/${name}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to toggle schedule');

      await fetchSchedules();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle schedule');
    }
  };

  // Cleanup old jobs
  const cleanupJobs = async () => {
    if (!confirm('Delete all completed/failed jobs older than 7 days?')) return;

    try {
      const apiUrl = getApiUrl();
      const accessToken = IS_BROWSER ? TokenStorage.getAccessToken() : null;
      const response = await fetch(`${apiUrl}/api/jobs/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ daysOld: 7 }),
      });

      if (!response.ok) throw new Error('Failed to cleanup jobs');

      const result = await response.json();
      alert(result.message);
      await fetchJobs();
      await fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cleanup jobs');
    }
  };

  // Subscribe to real-time job updates via WebSocket
  useEffect(() => {
    if (!IS_BROWSER) return;

    // Initial fetch
    fetchJobs();
    fetchStats();
    fetchSchedules();

    // Subscribe to job updates channel
    console.log('[JobDashboard] Subscribing to jobs channel');
    const unsubscribe = subscribeToChannel('jobs', (message) => {
      console.log('[JobDashboard] Received message:', message.type);

      switch (message.type) {
        case 'jobs_subscribed':
          console.log('[JobDashboard] Successfully subscribed to jobs');
          break;

        case 'job_update':
          // Update individual job
          if (message.job) {
            console.log('[JobDashboard] Job update:', message.job.id);
            updateJob(message.job);
          }
          break;

        case 'job_stats_update':
          // Update stats
          if (message.stats) {
            console.log('[JobDashboard] Stats update');
            updateJobStats(message.stats);
          }
          break;
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('[JobDashboard] Unsubscribing from jobs channel');
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (IS_BROWSER) {
      fetchJobs();
    }
  }, [statusFilter.value]);

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  // Format duration
  const formatDuration = (job: Job) => {
    if (!job.startedAt) return 'N/A';
    const start = new Date(job.startedAt).getTime();
    const end = job.completedAt ? new Date(job.completedAt).getTime() : Date.now();
    const duration = Math.round((end - start) / 1000);
    return `${duration}s`;
  };

  return (
    <div class="job-dashboard">
      {showCreateModal.value && (
        <CreateJobModal
          onClose={() => showCreateModal.value = false}
          onJobCreated={() => {
            fetchJobs();
            fetchStats();
          }}
        />
      )}

      {showCreateScheduleModal.value && (
        <CreateScheduleModal
          onClose={() => showCreateScheduleModal.value = false}
          onScheduleCreated={() => {
            fetchSchedules();
          }}
        />
      )}

      <div class="dashboard-header">
        <h1>Background Jobs</h1>
        <div class="header-actions">
          <button onClick={() => showCreateModal.value = true} class="btn btn-primary">
            ➕ Create Job
          </button>
          <button onClick={cleanupJobs} class="btn btn-secondary">
            🗑️ Cleanup Old Jobs
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {jobStats.value && (
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{jobStats.value.pending}</div>
            <div class="stat-label">Pending</div>
          </div>
          <div class="stat-card stat-running">
            <div class="stat-value">{jobStats.value.running}</div>
            <div class="stat-label">Running</div>
          </div>
          <div class="stat-card stat-completed">
            <div class="stat-value">{jobStats.value.completed}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-card stat-failed">
            <div class="stat-value">{jobStats.value.failed}</div>
            <div class="stat-label">Failed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{jobStats.value.total}</div>
            <div class="stat-label">Total</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div class="tabs">
        <button
          class={`tab ${selectedTab.value === 'jobs' ? 'active' : ''}`}
          onClick={() => selectedTab.value = 'jobs'}
        >
          📋 Jobs
        </button>
        <button
          class={`tab ${selectedTab.value === 'schedules' ? 'active' : ''}`}
          onClick={() => selectedTab.value = 'schedules'}
        >
          ⏰ Schedules
        </button>
      </div>

      {/* Jobs Tab */}
      {selectedTab.value === 'jobs' && (
        <div class="jobs-section">
          {/* Filters */}
          <div class="filters">
            <label>
              Status:
              <select
                value={statusFilter.value}
                onChange={(e) => statusFilter.value = (e.target as HTMLSelectElement).value}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="retrying">Retrying</option>
              </select>
            </label>
          </div>

          {/* Jobs Table */}
          {loading.value && <div class="loading">Loading jobs...</div>}
          {error.value && <div class="error">{error.value}</div>}

          {!loading.value && !error.value && (
            <div class="table-container">
              <table class="jobs-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Attempts</th>
                    <th>Created</th>
                    <th>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.value.length === 0 && (
                    <tr>
                      <td colSpan={6} class="text-center">No jobs found</td>
                    </tr>
                  )}
                  {jobs.value.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <div class="job-name">{job.name}</div>
                        <div class="job-id">{job.id.slice(0, 8)}</div>
                      </td>
                      <td>
                        <span class={`status-badge status-${job.status}`}>
                          {job.status}
                        </span>
                      </td>
                      <td>{job.attempts} / {job.maxRetries}</td>
                      <td>{formatDate(job.createdAt)}</td>
                      <td>{formatDuration(job)}</td>
                      <td>
                        <div class="action-buttons">
                          {job.status === 'failed' && (
                            <button
                              onClick={() => retryJob(job.id)}
                              class="btn btn-sm btn-primary"
                              title="Retry"
                            >
                              🔄
                            </button>
                          )}
                          <button
                            onClick={() => deleteJob(job.id)}
                            class="btn btn-sm btn-danger"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Schedules Tab */}
      {selectedTab.value === 'schedules' && (
        <div class="schedules-section">
          <div class="section-header">
            <button onClick={() => showCreateScheduleModal.value = true} class="btn btn-primary">
              ➕ Create Schedule
            </button>
          </div>
          <div class="table-container">
            <table class="schedules-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Cron</th>
                  <th>Status</th>
                  <th>Next Run</th>
                  <th>Last Run</th>
                  <th>Run Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.value.length === 0 && (
                  <tr>
                    <td colSpan={7} class="text-center">No schedules configured</td>
                  </tr>
                )}
                {schedules.value.map((schedule) => (
                  <tr key={schedule.name}>
                    <td>{schedule.name}</td>
                    <td><code>{schedule.cron}</code></td>
                    <td>
                      <span class={`status-badge ${schedule.enabled ? 'status-enabled' : 'status-disabled'}`}>
                        {schedule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td>{formatDate(schedule.nextRun)}</td>
                    <td>{formatDate(schedule.lastRun)}</td>
                    <td>{schedule.runCount}</td>
                    <td>
                      <div class="action-buttons">
                        <button
                          onClick={() => triggerSchedule(schedule.name)}
                          class="btn btn-sm btn-primary"
                          title="Trigger Now"
                        >
                          ▶️
                        </button>
                        <button
                          onClick={() => toggleSchedule(schedule.name, schedule.enabled)}
                          class="btn btn-sm btn-secondary"
                          title={schedule.enabled ? 'Disable' : 'Enable'}
                        >
                          {schedule.enabled ? '⏸️' : '▶️'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        .job-dashboard {
          padding: 20px;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .dashboard-header h1 {
          margin: 0;
          font-size: 24px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }


        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }
        .dark .stat-card {
          background: #23272f;
          border-color: #374151;
        }

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #111827;
        }
        .dark .stat-value {
          color: #f3f4f6;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }
        .dark .stat-label {
          color: #d1d5db;
        }

        .stat-running .stat-value {
          color: #3b82f6;
        }

        .stat-completed .stat-value {
          color: #10b981;
        }

        .stat-failed .stat-value {
          color: #ef4444;
        }

        .tabs {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 24px;
        }

        .tab {
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 16px;
          color: #6b7280;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #111827;
        }

        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .filters {
          margin-bottom: 16px;
        }

        .filters label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #374151;
        }

        .filters select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .section-header {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 16px;
        }


        .table-container {
          overflow-x: auto;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .dark .table-container {
          background: #181a20;
          border-color: #374151;
        }

        .jobs-table, .schedules-table {
          width: 100%;
          border-collapse: collapse;
        }

        .jobs-table th, .schedules-table th {
          background: #f9fafb;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          border-bottom: 1px solid #e5e7eb;
        }
        .dark .jobs-table th, .dark .schedules-table th {
          background: #23272f;
          color: #d1d5db;
          border-bottom-color: #374151;
        }

        .jobs-table td, .schedules-table td {
          padding: 12px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
          color: #374151;
        }
        .dark .jobs-table td, .dark .schedules-table td {
          color: #f3f4f6;
          border-bottom-color: #23272f;
        }

        .jobs-table tbody tr:hover, .schedules-table tbody tr:hover {
          background: #f9fafb;
        }
        .dark .jobs-table tbody tr:hover, .dark .schedules-table tbody tr:hover {
          background: #23272f;
        }

        .job-name {
          font-weight: 500;
          color: #111827;
        }
        .dark .job-name {
          color: #f3f4f6;
        }

        .job-id {
          font-size: 12px;
          color: #9ca3af;
          font-family: monospace;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-running {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-completed {
          background: #d1fae5;
          color: #065f46;
        }

        .status-failed {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-retrying {
          background: #fce7f3;
          color: #831843;
        }

        .status-enabled {
          background: #d1fae5;
          color: #065f46;
        }

        .status-disabled {
          background: #f3f4f6;
          color: #6b7280;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .loading, .error {
          padding: 24px;
          text-align: center;
          color: #6b7280;
        }

        .error {
          color: #ef4444;
        }

        .text-center {
          text-align: center;
        }

        code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 13px;
          color: #374151;
        }
        .dark code {
          background: #23272f;
          color: #e5e7eb;
        }
      `}</style>
    </div>
  );
}
