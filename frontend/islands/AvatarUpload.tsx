/**
 * Avatar Upload Island Component
 *
 * Specialized component for uploading user avatars with circular preview
 */

import { useSignal } from '@preact/signals';

export interface AvatarUploadProps {
  /** Current avatar URL */
  avatarUrl?: string;
  /** User name for fallback */
  userName?: string;
  /** Size in pixels */
  size?: number;
  /** Upload endpoint */
  endpoint?: string;
  /** Callback when upload completes */
  onUploadComplete?: (urls: { large: string; small: string }) => void;
}

export default function AvatarUpload({
  avatarUrl = '',
  userName = '',
  size = 120,
  endpoint = '/api/uploads/upload/avatar',
  onUploadComplete,
}: AvatarUploadProps) {
  const currentAvatar = useSignal(avatarUrl);
  const uploading = useSignal(false);
  const error = useSignal<string | null>(null);
  const hovering = useSignal(false);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      error.value = 'Please select an image file';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      error.value = 'Image too large. Maximum size is 2MB';
      return;
    }

    error.value = null;
    uploading.value = true;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      currentAvatar.value = data.data.urls.large;
      onUploadComplete?.(data.data.urls);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Upload failed';
    } finally {
      uploading.value = false;
    }
  };

  const handleInputChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      handleFileSelect(input.files[0]);
    }
  };

  // Generate initials for fallback
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div class="avatar-upload">
      <div
        class="avatar-upload__container"
        style={{ width: `${size}px`, height: `${size}px` }}
        onMouseEnter={() => hovering.value = true}
        onMouseLeave={() => hovering.value = false}
      >
        {currentAvatar.value ? (
          <img
            src={currentAvatar.value}
            alt={userName}
            class="avatar-upload__image"
          />
        ) : (
          <div class="avatar-upload__placeholder">
            {initials || '?'}
          </div>
        )}

        {uploading.value && (
          <div class="avatar-upload__overlay">
            <div class="spinner-small"></div>
          </div>
        )}

        {!uploading.value && hovering.value && (
          <div class="avatar-upload__overlay">
            <svg class="avatar-upload__camera-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          class="avatar-upload__input"
          disabled={uploading.value}
          aria-label="Upload avatar"
        />
      </div>

      {error.value && (
        <div class="avatar-upload__error">
          {error.value}
        </div>
      )}

      <style>{`
        .avatar-upload {
          display: inline-block;
        }

        .avatar-upload__container {
          position: relative;
          border-radius: 50%;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .avatar-upload__container:hover {
          transform: scale(1.05);
        }

        .avatar-upload__image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-upload__placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 2rem;
          font-weight: bold;
        }

        .avatar-upload__overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .avatar-upload__camera-icon {
          width: 32px;
          height: 32px;
        }

        .avatar-upload__input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .spinner-small {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .avatar-upload__error {
          margin-top: 8px;
          padding: 8px 12px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          font-size: 13px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
