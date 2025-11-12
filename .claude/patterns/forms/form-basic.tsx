import { useSignal } from "@preact/signals";
import { JSX } from "preact";

/**
 * Basic Form Pattern
 * 
 * A simple form with validation, error handling, and submission.
 * 
 * Customization:
 * 1. Replace {ModelName} with your model name (e.g., Campaign, Task)
 * 2. Update fields in the form
 * 3. Customize validation rules
 * 4. Update API endpoint
 */

interface FormData {
  name: string;
  description: string;
  // Add your fields here
}

interface BasicFormProps {
  onSubmit?: (data: FormData) => Promise<void>;
  onCancel?: () => void;
}

export default function BasicForm({ onSubmit, onCancel }: BasicFormProps) {
  const name = useSignal("");
  const description = useSignal("");
  const isSubmitting = useSignal(false);
  const error = useSignal<string | null>(null);

  const handleSubmit = async (e: JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Reset error
    error.value = null;

    // Basic validation
    if (!name.value.trim()) {
      error.value = "Name is required";
      return;
    }

    if (name.value.length > 100) {
      error.value = "Name must be less than 100 characters";
      return;
    }

    // Submit
    isSubmitting.value = true;
    try {
      const data: FormData = {
        name: name.value.trim(),
        description: description.value.trim(),
      };

      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Default: Call API directly
        const response = await fetch("/api/resource", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to submit");
        }

        // Success - redirect or show message
        globalThis.location.href = "/success";
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "An error occurred";
    } finally {
      isSubmitting.value = false;
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {/* Error message */}
      {error.value && (
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-red-800 dark:text-red-200">{error.value}</p>
        </div>
      )}

      {/* Name field */}
      <div>
        <label
          for="name"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Name *
        </label>
        <input
          type="text"
          id="name"
          value={name.value}
          onInput={(e) => name.value = e.currentTarget.value}
          disabled={isSubmitting.value}
          required
          maxLength={100}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
          placeholder="Enter name"
        />
      </div>

      {/* Description field */}
      <div>
        <label
          for="description"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description.value}
          onInput={(e) => description.value = e.currentTarget.value}
          disabled={isSubmitting.value}
          rows={4}
          maxLength={500}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
          placeholder="Enter description (optional)"
        />
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {description.value.length}/500 characters
        </p>
      </div>

      {/* Action buttons */}
      <div class="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting.value}
          class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
        >
          {isSubmitting.value ? "Submitting..." : "Submit"}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting.value}
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/**
 * Usage Example:
 * 
 * import BasicForm from "../islands/BasicForm.tsx";
 * 
 * // In your route:
 * <BasicForm
 *   onSubmit={async (data) => {
 *     // Handle submission
 *     await apiClient.post("/api/campaigns", data);
 *   }}
 *   onCancel={() => {
 *     globalThis.location.href = "/campaigns";
 *   }}
 * />
 */
