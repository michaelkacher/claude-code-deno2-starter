/**
 * Admin Data Sync Manager Island
 * Interactive component for managing markdown-to-KV synchronization
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useEffect, useState } from 'preact/hooks';

interface SyncResult {
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
  errors?: Array<{ file: string; error: string }>;
  summary?: string;
  changes?: Array<{ file: string; action: string; reason?: string }>;
}

interface DeploymentLog {
  timestamp: string;
  userId: string;
  model: string;
  result: {
    created: number;
    updated: number;
    deleted: number;
    skipped: number;
    errors: number;
  };
}

interface HistoryEntry {
  key: string[];
  value: DeploymentLog;
  versionstamp: string;
}

export default function AdminDataSyncManager() {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [deploying, setDeploying] = useState(false);
  
  const [config, setConfig] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  
  const [validationResult, setValidationResult] = useState<any>(null);
  const [previewResult, setPreviewResult] = useState<SyncResult | null>(null);
  const [deployResult, setDeployResult] = useState<any>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  const [error, setError] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState(false);

  if (!IS_BROWSER) return null;

  const apiUrl = window.location.origin.replace(':3000', ':8000');

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
    loadHistory();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const loadConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/admin/data-sync/config`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      } else {
        setError(data.error || 'Failed to load config');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/data-sync/history?limit=10`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.data.history || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    setError('');
    setValidationResult(null);
    try {
      const res = await fetch(`${apiUrl}/api/admin/data-sync/validate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ model: selectedModel || undefined }),
      });
      const data = await res.json();
      setValidationResult(data);
      if (!data.success) {
        setError('Validation failed. See errors below.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    setError('');
    setPreviewResult(null);
    try {
      const res = await fetch(`${apiUrl}/api/admin/data-sync/preview`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ model: selectedModel || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewResult(data.data);
      } else {
        setError(data.error || 'Preview failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setError('');
    setDeployResult(null);
    try {
      const res = await fetch(`${apiUrl}/api/admin/data-sync/deploy`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ 
          model: selectedModel || undefined,
          force: false,
        }),
      });
      const data = await res.json();
      setDeployResult(data);
      if (data.success) {
        // Refresh history after successful deployment
        await loadHistory();
      } else {
        setError(data.error || 'Deployment failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment failed');
    } finally {
      setDeploying(false);
      setShowConfirm(false);
    }
  };

  const hasChanges = previewResult && (
    previewResult.created > 0 ||
    previewResult.updated > 0 ||
    previewResult.deleted > 0
  );

  return (
    <div class="space-y-6">
      {/* Error Banner */}
      {error && (
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Error</h3>
              <p class="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Model Selection */}
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Select Data Model</h2>
        <div class="flex items-center space-x-4">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel((e.target as HTMLSelectElement).value)}
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">All Models</option>
            {config?.models?.map((model: string) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
          <button
            onClick={loadConfig}
            disabled={loading}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        {selectedModel && (
          <p class="mt-2 text-sm text-gray-600">
            Syncing: <strong>{selectedModel}</strong>
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleValidate}
            disabled={validating || !config}
            class="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {validating ? 'Validating...' : '1. Validate Files'}
          </button>
          <button
            onClick={handlePreview}
            disabled={previewing || !config}
            class="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 font-medium"
          >
            {previewing ? 'Previewing...' : '2. Preview Changes'}
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={deploying || !hasChanges}
            class="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {deploying ? 'Deploying...' : '3. Deploy to Production'}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white p-6 rounded-lg shadow-xl max-w-md">
            <h3 class="text-lg font-semibold mb-2">Confirm Deployment</h3>
            <p class="text-gray-600 mb-4">
              Are you sure you want to deploy changes to production?
              {previewResult && (
                <span class="block mt-2 font-medium">
                  {previewResult.created} created, {previewResult.updated} updated, {previewResult.deleted} deleted
                </span>
              )}
            </p>
            <div class="flex space-x-3">
              <button
                onClick={handleDeploy}
                disabled={deploying}
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {deploying ? 'Deploying...' : 'Yes, Deploy'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deploying}
                class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-lg font-semibold mb-4">Validation Results</h2>
          {validationResult.success ? (
            <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p class="text-green-800 font-medium">✅ All files are valid!</p>
              <p class="text-sm text-green-700 mt-1">
                Validated {validationResult.data.filesValidated} files
              </p>
            </div>
          ) : (
            <div class="space-y-2">
              {validationResult.data?.errors?.map((err: any, i: number) => (
                <div key={i} class="p-3 bg-red-50 border border-red-200 rounded">
                  <p class="text-sm font-medium text-red-800">{err.file}</p>
                  <p class="text-sm text-red-700">{err.error}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Results */}
      {previewResult && (
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-lg font-semibold mb-4">Preview (Dry Run)</h2>
          <div class="grid grid-cols-4 gap-4 mb-4">
            <div class="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p class="text-2xl font-bold text-green-700">{previewResult.created}</p>
              <p class="text-sm text-green-600">Created</p>
            </div>
            <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p class="text-2xl font-bold text-blue-700">{previewResult.updated}</p>
              <p class="text-sm text-blue-600">Updated</p>
            </div>
            <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p class="text-2xl font-bold text-red-700">{previewResult.deleted}</p>
              <p class="text-sm text-red-600">Deleted</p>
            </div>
            <div class="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <p class="text-2xl font-bold text-gray-700">{previewResult.skipped}</p>
              <p class="text-sm text-gray-600">Skipped</p>
            </div>
          </div>
          {previewResult.changes && previewResult.changes.length > 0 && (
            <div class="space-y-4">
              <h3 class="font-medium text-gray-900 text-lg">Detailed Changes:</h3>
              {previewResult.changes.map((change: any, i: number) => (
                <div key={i} class="border border-gray-300 rounded-lg overflow-hidden">
                  {/* Change Header */}
                  <div class={`p-3 ${
                    change.action === 'create' ? 'bg-green-50 border-b border-green-200' :
                    change.action === 'update' ? 'bg-blue-50 border-b border-blue-200' :
                    'bg-red-50 border-b border-red-200'
                  }`}>
                    <div class="flex items-center justify-between">
                      <div>
                        <span class={`font-bold text-sm ${
                          change.action === 'create' ? 'text-green-700' :
                          change.action === 'update' ? 'text-blue-700' :
                          'text-red-700'
                        }`}>
                          {change.action.toUpperCase()}
                        </span>
                        <span class="ml-2 text-sm font-medium text-gray-900">{change.file}</span>
                      </div>
                      <span class="text-xs text-gray-500">ID: {change.id}</span>
                    </div>
                    {change.reason && (
                      <p class="text-sm text-gray-600 mt-1">{change.reason}</p>
                    )}
                  </div>

                  {/* Change Data */}
                  {change.data && (
                    <div class="p-4 bg-white space-y-4">
                      {/* Metadata Section */}
                      <div>
                        <h4 class="text-sm font-semibold text-gray-700 mb-2">Metadata:</h4>
                        <div class="bg-gray-50 rounded p-3 space-y-1">
                          {Object.entries(change.data).map(([key, value]: [string, any]) => {
                            // Skip the content field - we'll show it separately
                            if (key === 'content' || key === 'exercises' || Array.isArray(value)) return null;
                            
                            return (
                              <div key={key} class="flex items-start text-sm">
                                <span class="font-medium text-gray-600 min-w-[120px]">{key}:</span>
                                <span class="text-gray-800 font-mono">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Nested Collections (like exercises) */}
                      {Object.entries(change.data).map(([key, value]: [string, any]) => {
                        if (!Array.isArray(value)) return null;
                        
                        return (
                          <div key={key}>
                            <h4 class="text-sm font-semibold text-gray-700 mb-2 capitalize">
                              {key} ({value.length}):
                            </h4>
                            <div class="space-y-2">
                              {value.map((item: any, idx: number) => (
                                <div key={idx} class="bg-gray-50 rounded p-3 border-l-4 border-blue-300">
                                  <div class="font-medium text-gray-800 mb-1">
                                    {item.name || `Item ${idx + 1}`}
                                  </div>
                                  <div class="grid grid-cols-2 gap-2 text-xs">
                                    {Object.entries(item).map(([k, v]: [string, any]) => {
                                      if (k === 'name' || k === 'id') return null;
                                      return (
                                        <div key={k}>
                                          <span class="text-gray-600">{k}:</span>{' '}
                                          <span class="text-gray-800 font-mono">{String(v)}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* Content Section (if exists) */}
                      {change.data.content && (
                        <div>
                          <h4 class="text-sm font-semibold text-gray-700 mb-2">Content:</h4>
                          <div class="bg-gray-50 rounded p-3 overflow-x-auto prose prose-sm max-w-none">
                            <div class="text-sm text-gray-800 whitespace-pre-wrap">
                              {change.data.content}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deploy Results */}
      {deployResult && (
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-lg font-semibold mb-4">Deployment Results</h2>
          {deployResult.success ? (
            <div>
              <div class="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                <p class="text-green-800 font-medium">✅ Deployment successful!</p>
              </div>
              <div class="grid grid-cols-4 gap-4">
                <div class="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p class="text-2xl font-bold text-green-700">{deployResult.data.created}</p>
                  <p class="text-sm text-green-600">Created</p>
                </div>
                <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <p class="text-2xl font-bold text-blue-700">{deployResult.data.updated}</p>
                  <p class="text-sm text-blue-600">Updated</p>
                </div>
                <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                  <p class="text-2xl font-bold text-red-700">{deployResult.data.deleted}</p>
                  <p class="text-sm text-red-600">Deleted</p>
                </div>
                <div class="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <p class="text-2xl font-bold text-gray-700">{deployResult.data.skipped}</p>
                  <p class="text-sm text-gray-600">Skipped</p>
                </div>
              </div>
            </div>
          ) : (
            <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-800 font-medium">❌ Deployment failed</p>
              {deployResult.data?.errors?.map((err: any, i: number) => (
                <p key={i} class="text-sm text-red-700 mt-1">{err.file}: {err.error}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deployment History */}
      {history.length > 0 && (
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-lg font-semibold mb-4">Recent Deployments</h2>
          <div class="space-y-3">
            {history.map((entry, i) => {
              // Safety check for entry structure
              if (!entry?.value?.result) return null;
              
              return (
                <div key={i} class="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="font-medium text-gray-900">
                        {entry.value.model || 'Unknown'}
                      </p>
                      <p class="text-sm text-gray-600">
                        {entry.value.timestamp ? new Date(entry.value.timestamp).toLocaleString() : 'Unknown time'}
                      </p>
                    </div>
                    <div class="text-right text-sm">
                      <p class="text-green-600">+{entry.value.result.created || 0} created</p>
                      <p class="text-blue-600">~{entry.value.result.updated || 0} updated</p>
                      {(entry.value.result.errors || 0) > 0 && (
                        <p class="text-red-600">⚠ {entry.value.result.errors} errors</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
