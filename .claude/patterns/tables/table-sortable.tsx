import { useSignal } from "@preact/signals";

/**
 * Sortable Table Pattern
 * 
 * A data table with sorting, search, and actions.
 * 
 * Customization:
 * 1. Replace {Item} with your model type
 * 2. Update columns configuration
 * 3. Add custom actions
 * 4. Customize row rendering
 */

interface Item {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  // Add your fields here
}

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (item: T) => string;
}

interface SortableTableProps {
  items: Item[];
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
}

export default function SortableTable({ items, onEdit, onDelete }: SortableTableProps) {
  const searchQuery = useSignal("");
  const sortKey = useSignal<keyof Item>("name");
  const sortDirection = useSignal<"asc" | "desc">("asc");

  // Column configuration
  const columns: Column<Item>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { 
      key: "createdAt", 
      label: "Created", 
      sortable: true,
      render: (item) => new Date(item.createdAt).toLocaleDateString()
    },
  ];

  // Filter items based on search
  const filteredItems = items.filter((item) => {
    if (!searchQuery.value) return true;
    const query = searchQuery.value.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query)
    );
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    const aVal = a[sortKey.value];
    const bVal = b[sortKey.value];
    
    if (aVal < bVal) return sortDirection.value === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection.value === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key: keyof Item) => {
    if (sortKey.value === key) {
      sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
    } else {
      sortKey.value = key;
      sortDirection.value = "asc";
    }
  };

  return (
    <div class="space-y-4">
      {/* Search */}
      <div class="flex gap-4 items-center">
        <input
          type="search"
          value={searchQuery.value}
          onInput={(e) => searchQuery.value = e.currentTarget.value}
          placeholder="Search..."
          class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        />
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {sortedItems.length} {sortedItems.length === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Table */}
      <div class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      class="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      {column.label}
                      {sortKey.value === column.key && (
                        <span>{sortDirection.value === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  class="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  {searchQuery.value ? "No items match your search" : "No items found"}
                </td>
              </tr>
            ) : (
              sortedItems.map((item) => (
                <tr
                  key={item.id}
                  class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                    >
                      {column.render ? column.render(item) : String(item[column.key])}
                    </td>
                  ))}
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * import SortableTable from "../islands/SortableTable.tsx";
 * 
 * // In your route:
 * <SortableTable
 *   items={campaigns}
 *   onEdit={(item) => {
 *     globalThis.location.href = `/campaigns/${item.id}/edit`;
 *   }}
 *   onDelete={async (item) => {
 *     if (confirm("Are you sure?")) {
 *       await apiClient.delete(`/api/campaigns/${item.id}`);
 *       globalThis.location.reload();
 *     }
 *   }}
 * />
 */
