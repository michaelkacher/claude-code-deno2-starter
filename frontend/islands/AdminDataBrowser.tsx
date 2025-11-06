/**
 * Admin Data Browser Island
 * Browse and filter all models in Deno KV storage
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useEffect, useRef, useState } from 'preact/hooks';

interface Model {
  name: string;
  count: number;
}

interface ModelData {
  model: string;
  properties: string[];
  items: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export default function AdminDataBrowser() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [modelData, setModelData] = useState<ModelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [filterProperty, setFilterProperty] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [debouncedFilterValue, setDebouncedFilterValue] = useState('');
  
  const debounceTimerRef = useRef<number | null>(null);
  
  // Debounce time: 500ms
  const DEBOUNCE_DELAY_MS = 500;

  // Fetch available models on mount
  useEffect(() => {
    if (IS_BROWSER) {
      fetchModels();
    }
  }, []);

  // Debounce filter value changes
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilterValue(filterValue);
    }, DEBOUNCE_DELAY_MS);

    // Cleanup on unmount or when filterValue changes
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filterValue]);

  // Fetch model data when selection or filters change (using debounced value)
  useEffect(() => {
    if (IS_BROWSER && selectedModel) {
      fetchModelData();
    }
  }, [selectedModel, currentPage, filterProperty, debouncedFilterValue]);

  const fetchModels = async () => {
    try {
      const apiUrl = window.location.origin.replace(':3000', ':8000');
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${apiUrl}/api/admin/data/models`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Failed to fetch models');
        return;
      }

      setModels(data.data.models);
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const fetchModelData = async () => {
    setLoading(true);
    setError('');

    try {
      const apiUrl = window.location.origin.replace(':3000', ':8000');
      const accessToken = localStorage.getItem('access_token');

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (filterProperty && debouncedFilterValue) {
        params.append('filterProperty', filterProperty);
        params.append('filterValue', debouncedFilterValue);
      }

      const response = await fetch(`${apiUrl}/api/admin/data/${selectedModel}?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Failed to fetch model data');
        setLoading(false);
        return;
      }

      setModelData(data.data);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelect = (modelName: string) => {
    setSelectedModel(modelName);
    setCurrentPage(1);
    setFilterProperty('');
    setFilterValue('');
    setModelData(null);
  };

  const handleFilterApply = () => {
    setCurrentPage(1);
    fetchModelData();
  };

  const handleFilterClear = () => {
    setFilterProperty('');
    setFilterValue('');
    setCurrentPage(1);
  };

  const renderValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div class="space-y-6">
      {error && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Model Selection */}
      {!selectedModel && (
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Select a Model</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <button
                key={model.name}
                onClick={() => handleModelSelect(model.name)}
                class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all text-left"
              >
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{model.name}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">{model.count} entries</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Model Data View */}
      {selectedModel && (
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
              <button
                onClick={() => setSelectedModel('')}
                class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                ← Back to Models
              </button>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedModel}</h2>
            </div>
            
            {modelData && (
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Total: {modelData.pagination.total} entries
              </p>
            )}
          </div>

          {/* Filters */}
          <div class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-4">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Filter</h3>
            <div class="flex gap-3 items-end">
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Property</label>
                <select
                  value={filterProperty}
                  onChange={(e) => setFilterProperty((e.target as HTMLSelectElement).value)}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md text-sm"
                >
                  <option value="">Select property...</option>
                  {modelData?.properties
                    .filter(p => !p.startsWith('_'))
                    .map(prop => (
                      <option key={prop} value={prop}>{prop}</option>
                    ))}
                </select>
              </div>
              
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Value</label>
                <input
                  type="text"
                  value={filterValue}
                  onInput={(e) => setFilterValue((e.target as HTMLInputElement).value)}
                  placeholder="Filter value..."
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md text-sm"
                />
              </div>
              
              <div class="flex gap-2">
                <button
                  onClick={handleFilterApply}
                  disabled={!filterProperty || !filterValue}
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Apply
                </button>
                <button
                  onClick={handleFilterClear}
                  disabled={!filterProperty && !filterValue}
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          {loading && (
            <div class="flex justify-center items-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && modelData && (
            <div>
              <div class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {modelData.properties.map((prop) => (
                          <th
                            key={prop}
                            class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap"
                          >
                            {prop}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {modelData.items.map((item, idx) => (
                        <tr key={idx} class="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {modelData.properties.map((prop) => (
                            <td key={prop} class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                              <span title={renderValue(item[prop])}>
                                {renderValue(item[prop])}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div class="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Previous
                </button>
                
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage}
                </span>
                
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={!modelData.pagination.hasMore}
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
