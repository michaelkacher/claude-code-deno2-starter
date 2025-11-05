/**
 * File Upload Component
 *
 * A reusable file upload component with drag & drop support
 *
 * Features:
 * - Drag & drop
 * - File type validation
 * - File size validation
 * - Preview for images
 * - Progress indicator
 * - Error handling
 *
 * @example
 * ```tsx
 * <FileUpload
 *   accept="image/*"
 *   maxSize={5 * 1024 * 1024}
 *   onUpload={(url) => console.log('Uploaded:', url)}
 * />
 * ```
 */

import { useState } from 'preact/hooks';

export interface FileUploadProps {
  /** Accepted file types (e.g., "image/*", ".pdf") */
  accept?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Upload endpoint */
  endpoint?: string;
  /** Callback when upload completes */
  onUpload?: (url: string, file: File) => void;
  /** Callback when upload fails */
  onError?: (error: string) => void;
  /** Whether to show image preview */
  showPreview?: boolean;
  /** Custom class name */
  className?: string;
  /** Label text */
  label?: string;
}

export function FileUpload({
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  endpoint = '/api/uploads/upload',
  onUpload,
  onError,
  showPreview = true,
  className = '',
  label = 'Upload File',
}: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate file size
    if (file.size > maxSize) {
      const errorMsg = `File too large. Maximum size is ${formatBytes(maxSize)}`;
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Show preview for images
    if (showPreview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Upload file
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      onUpload?.(data.data.url, file);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      onError?.(errorMsg);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleInputChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      handleFileSelect(input.files[0]);
    }
  };

  return (
    <div class={`file-upload ${className}`}>
      <label class="file-upload__label">{label}</label>

      <div
        class={`file-upload__dropzone ${dragging ? 'file-upload__dropzone--dragging' : ''} ${uploading ? 'file-upload__dropzone--uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          <div class="file-upload__preview">
            <img src={preview} alt="Preview" class="file-upload__preview-image" />
          </div>
        ) : (
          <div class="file-upload__placeholder">
            <svg class="file-upload__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p class="file-upload__text">
              {dragging ? 'Drop file here' : 'Drag & drop or click to upload'}
            </p>
            {accept && (
              <p class="file-upload__hint">Accepted: {accept}</p>
            )}
            <p class="file-upload__hint">Max size: {formatBytes(maxSize)}</p>
          </div>
        )}

        <input
          type="file"
          accept={accept}
          onChange={handleInputChange}
          class="file-upload__input"
          disabled={uploading}
        />
      </div>

      {uploading && (
        <div class="file-upload__progress">
          <div
            class="file-upload__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <div class="file-upload__error">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
