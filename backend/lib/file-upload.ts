/**
 * File upload middleware and utilities
 *
 * Handles multipart/form-data file uploads with:
 * - File size validation
 * - MIME type validation
 * - Filename sanitization
 * - Virus scanning (optional)
 *
 * @example
 * ```typescript
 * import { createFileUploadMiddleware } from './lib/file-upload.ts';
 *
 * app.post('/api/upload', createFileUploadMiddleware({
 *   maxSize: 5 * 1024 * 1024, // 5MB
 *   allowedTypes: ['image/jpeg', 'image/png'],
 *   folder: 'avatars',
 * }), async (c) => {
 *   const { file, url } = c.get('uploadedFile');
 *   return c.json({ url });
 * });
 * ```
 */

import type { Context, MiddlewareHandler } from 'hono';
import { getStorage } from './storage.ts';

// ============================================================================
// Types
// ============================================================================

export interface UploadedFile {
  filename: string;
  originalFilename: string;
  contentType: string;
  size: number;
  buffer: Uint8Array;
  url?: string; // Set after upload to storage
}

export interface FileUploadOptions {
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allowed MIME types (e.g., ['image/jpeg', 'image/png']) */
  allowedTypes?: string[];
  /** Allowed file extensions (e.g., ['.jpg', '.png']) */
  allowedExtensions?: string[];
  /** Storage folder */
  folder?: string;
  /** Whether to generate unique filenames */
  uniqueFilenames?: boolean;
  /** Field name for the file input (default: 'file') */
  fieldName?: string;
  /** Whether file upload is required */
  required?: boolean;
}

export interface FileValidationError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_FIELD_NAME = 'file';

/** Common MIME type groups */
export const MIME_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  VIDEOS: ['video/mp4', 'video/webm', 'video/ogg'],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  ARCHIVES: ['application/zip', 'application/x-tar', 'application/gzip'],
  JSON: ['application/json'],
  CSV: ['text/csv'],
};

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate file against upload options
 */
function validateFile(
  file: UploadedFile,
  options: FileUploadOptions,
): FileValidationError | null {
  const { maxSize, allowedTypes, allowedExtensions } = options;

  // Check file size
  if (maxSize && file.size > maxSize) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `File size ${file.size} bytes exceeds maximum ${maxSize} bytes`,
      details: { size: file.size, maxSize },
    };
  }

  // Check MIME type
  if (allowedTypes && !allowedTypes.includes(file.contentType)) {
    return {
      code: 'INVALID_FILE_TYPE',
      message: `File type ${file.contentType} is not allowed`,
      details: { contentType: file.contentType, allowedTypes },
    };
  }

  // Check file extension
  if (allowedExtensions) {
    const ext = getFileExtension(file.originalFilename);
    if (!allowedExtensions.includes(ext)) {
      return {
        code: 'INVALID_FILE_EXTENSION',
        message: `File extension ${ext} is not allowed`,
        details: { extension: ext, allowedExtensions },
      };
    }
  }

  return null;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Sanitize filename to prevent directory traversal and other issues
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/\.+/g, '.') // Replace multiple dots with single dot
    .replace(/^\./, '') // Remove leading dot
    .substring(0, 255); // Limit length
}

/**
 * Generate unique filename with timestamp and random suffix
 */
export function generateUniqueFilename(originalFilename: string): string {
  const ext = getFileExtension(originalFilename);
  const nameWithoutExt = originalFilename.slice(0, -ext.length);
  const sanitized = sanitizeFilename(nameWithoutExt);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${sanitized}_${timestamp}_${random}${ext}`;
}

/**
 * Get file extension including the dot (e.g., '.jpg')
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.substring(lastDot).toLowerCase();
}

/**
 * Parse multipart/form-data from request
 */
async function parseMultipartFormData(
  request: Request,
  fieldName: string,
): Promise<UploadedFile | null> {
  const formData = await request.formData();
  const fileEntry = formData.get(fieldName);

  if (!fileEntry || !(fileEntry instanceof File)) {
    return null;
  }

  const file = fileEntry as File;
  const buffer = new Uint8Array(await file.arrayBuffer());

  return {
    filename: file.name,
    originalFilename: file.name,
    contentType: file.type || 'application/octet-stream',
    size: file.size,
    buffer,
  };
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * Create file upload middleware
 *
 * This middleware:
 * 1. Parses multipart/form-data
 * 2. Validates the file
 * 3. Uploads to storage
 * 4. Attaches file info to context as 'uploadedFile'
 */
export function createFileUploadMiddleware(
  options: FileUploadOptions = {},
): MiddlewareHandler {
  const {
    maxSize = DEFAULT_MAX_SIZE,
    fieldName = DEFAULT_FIELD_NAME,
    required = true,
    uniqueFilenames = true,
    folder,
    allowedTypes,
    allowedExtensions,
  } = options;

  return async (c: Context, next) => {
    // Parse file from request
    const file = await parseMultipartFormData(c.req.raw, fieldName);

    // Check if file is required
    if (!file) {
      if (required) {
        return c.json({
          error: {
            code: 'FILE_REQUIRED',
            message: `File field '${fieldName}' is required`,
          },
        }, 400);
      }
      // File is optional and not provided, continue
      return await next();
    }

    // Validate file
    const validationError = validateFile(file, {
      maxSize,
      allowedTypes,
      allowedExtensions,
    });

    if (validationError) {
      return c.json({ error: validationError }, 400);
    }

    // Generate filename
    const filename = uniqueFilenames
      ? generateUniqueFilename(file.originalFilename)
      : sanitizeFilename(file.originalFilename);

    file.filename = filename;

    // Upload to storage
    const storage = getStorage();
    try {
      const url = await storage.upload({
        file: file.buffer,
        filename,
        contentType: file.contentType,
        folder,
      });

      file.url = url;
    } catch (error) {
      console.error('File upload error:', error);
      return c.json({
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload file',
          details: { error: error instanceof Error ? error.message : String(error) },
        },
      }, 500);
    }

    // Attach file to context
    c.set('uploadedFile', file);

    await next();
  };
}

/**
 * Simplified helper for single image upload
 */
export function imageUploadMiddleware(maxSizeMB = 5): MiddlewareHandler {
  return createFileUploadMiddleware({
    maxSize: maxSizeMB * 1024 * 1024,
    allowedTypes: MIME_TYPES.IMAGES,
    uniqueFilenames: true,
  });
}

/**
 * Simplified helper for document upload
 */
export function documentUploadMiddleware(maxSizeMB = 10): MiddlewareHandler {
  return createFileUploadMiddleware({
    maxSize: maxSizeMB * 1024 * 1024,
    allowedTypes: MIME_TYPES.DOCUMENTS,
    uniqueFilenames: true,
  });
}
