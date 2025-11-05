/**
 * Image Upload Island Component
 *
 * Interactive island for uploading images with preview
 */

import { useState } from 'preact/hooks';
import { Signal, useSignal } from '@preact/signals';

export interface ImageUploadProps {
  /** Upload endpoint */
  endpoint?: string;
  /** Maximum file size in MB */
  maxSizeMB?: number;
  /** Initial image URL */
  initialUrl?: string;
  /** Callback when upload completes */
  onUploadComplete?: (url: string) => void;
  /** Image dimensions for processing */
  resize?: { width: number; height: number };
  /** Generate thumbnail */
  thumbnail?: number;
  /** Optimize image */
  optimize?: boolean;
}

export default function ImageUpload({
  endpoint = '/api/uploads/upload/image',
  maxSizeMB = 5,
  initialUrl = '',
  onUploadComplete,
  resize,
  thumbnail,
  optimize = true,
}: ImageUploadProps) {
  const imageUrl = useSignal(initialUrl);
  const uploading = useSignal(false);
  const error = useSignal<string | null>(null);
  const dragging = useSignal(false);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      error.value = 'Please select an image file';
      return;
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      error.value = `Image too large. Maximum size is ${maxSizeMB}MB`;
      return;
    }

    error.value = null;
    uploading.value = true;

    try {
      // Build query params
      const params = new URLSearchParams();
      if (resize) params.append('resize', `${resize.width},${resize.height}`);
      if (thumbnail) params.append('thumbnail', String(thumbnail));
      if (optimize) params.append('optimize', 'true');

      const url = params.toString() ? `${endpoint}?${params}` : endpoint;

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      const uploadedUrl = data.data.urls?.optimized || data.data.urls?.original || data.data.url;

      imageUrl.value = uploadedUrl;
      onUploadComplete?.(uploadedUrl);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Upload failed';
    } finally {
      uploading.value = false;
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    dragging.value = false;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    dragging.value = true;
  };

  const handleDragLeave = () => {
    dragging.value = false;
  };

  const handleInputChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      handleFileSelect(input.files[0]);
    }
  };

  const handleRemove = () => {
    imageUrl.value = '';
    error.value = null;
  };

  return (
    <div class="image-upload">
      {imageUrl.value ? (
        <div class="image-upload__preview-container">
          <img
            src={imageUrl.value}
            alt="Uploaded image"
            class="image-upload__preview"
          />
          <button
            type="button"
            onClick={handleRemove}
            class="image-upload__remove"
            disabled={uploading.value}
          >
            ✕ Remove
          </button>
        </div>
      ) : (
        <div
          class={`image-upload__dropzone ${dragging.value ? 'image-upload__dropzone--active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div class="image-upload__content">
            {uploading.value ? (
              <div class="image-upload__loading">
                <div class="spinner"></div>
                <p>Uploading...</p>
              </div>
            ) : (
              <>
                <svg class="image-upload__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="image-upload__text">
                  {dragging.value ? 'Drop image here' : 'Click or drag image to upload'}
                </p>
                <p class="image-upload__hint">Max {maxSizeMB}MB • JPG, PNG, GIF, WebP</p>
              </>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            class="image-upload__input"
            disabled={uploading.value}
          />
        </div>
      )}

      {error.value && (
        <div class="image-upload__error">
          {error.value}
        </div>
      )}

      <style>{`
        .image-upload {
          width: 100%;
        }

        .image-upload__preview-container {
          position: relative;
          display: inline-block;
        }

        .image-upload__preview {
          max-width: 100%;
          max-height: 400px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .image-upload__remove {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .image-upload__remove:hover {
          background: rgba(0, 0, 0, 0.9);
        }

        .image-upload__dropzone {
          position: relative;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 32px;
          text-align: center;
          transition: all 0.2s;
          cursor: pointer;
        }

        .image-upload__dropzone:hover,
        .image-upload__dropzone--active {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .image-upload__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .image-upload__icon {
          width: 48px;
          height: 48px;
          color: #9ca3af;
        }

        .image-upload__text {
          font-size: 16px;
          color: #374151;
          margin: 0;
        }

        .image-upload__hint {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .image-upload__input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .image-upload__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .image-upload__error {
          margin-top: 8px;
          padding: 12px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
