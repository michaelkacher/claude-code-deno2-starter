/**
 * File upload routes
 *
 * Provides endpoints for:
 * - Uploading files
 * - Downloading files
 * - Deleting files
 * - Listing uploaded files
 * - Serving uploaded files
 */

import { Hono } from 'hono';
import { createFileUploadMiddleware, imageUploadMiddleware, documentUploadMiddleware, MIME_TYPES, type UploadedFile } from '../lib/file-upload.ts';
import { getStorage } from '../lib/storage.ts';
import { resizeImage, generateThumbnail, optimizeImage, getImageMetadata } from '../lib/image-processing.ts';

const app = new Hono();

// ============================================================================
// Upload Endpoints
// ============================================================================

/**
 * POST /upload - General file upload
 * Accepts any file type (with reasonable limits)
 */
app.post('/upload', createFileUploadMiddleware({
  maxSize: 10 * 1024 * 1024, // 10MB
  uniqueFilenames: true,
}), async (c) => {
  const file: UploadedFile = c.get('uploadedFile');

  return c.json({
    data: {
      url: file.url,
      filename: file.filename,
      originalFilename: file.originalFilename,
      contentType: file.contentType,
      size: file.size,
    },
  }, 201);
});

/**
 * POST /upload/image - Image upload with optional processing
 * Query params:
 *  - resize: width,height (e.g., 800,600)
 *  - thumbnail: size (e.g., 200)
 *  - optimize: true/false
 */
app.post('/upload/image', imageUploadMiddleware(5), async (c) => {
  const file: UploadedFile = c.get('uploadedFile');
  const storage = getStorage();

  // Get processing options from query params
  const resize = c.req.query('resize');
  const thumbnail = c.req.query('thumbnail');
  const optimize = c.req.query('optimize') === 'true';

  let processedBuffer = file.buffer;
  const urls: Record<string, string> = {
    original: file.url || '',
  };

  try {
    // Resize if requested
    if (resize) {
      const [width, height] = resize.split(',').map(Number);
      processedBuffer = await resizeImage(file.buffer, { width, height });

      // Upload resized version
      const resizedFilename = file.filename.replace(/(\.[^.]+)$/, '_resized$1');
      const resizedUrl = await storage.upload({
        file: processedBuffer,
        filename: resizedFilename,
        contentType: file.contentType,
        folder: 'images',
      });
      urls.resized = resizedUrl;
    }

    // Generate thumbnail if requested
    if (thumbnail) {
      const size = Number(thumbnail);
      const thumbnailBuffer = await generateThumbnail(file.buffer, size);

      // Upload thumbnail
      const thumbnailFilename = file.filename.replace(/(\.[^.]+)$/, '_thumb$1');
      const thumbnailUrl = await storage.upload({
        file: thumbnailBuffer,
        filename: thumbnailFilename,
        contentType: file.contentType,
        folder: 'thumbnails',
      });
      urls.thumbnail = thumbnailUrl;
    }

    // Optimize if requested
    if (optimize) {
      const optimizedBuffer = await optimizeImage(file.buffer);

      // Upload optimized version
      const optimizedFilename = file.filename.replace(/(\.[^.]+)$/, '_optimized$1');
      const optimizedUrl = await storage.upload({
        file: optimizedBuffer,
        filename: optimizedFilename,
        contentType: file.contentType,
        folder: 'images',
      });
      urls.optimized = optimizedUrl;
    }

    // Get metadata
    const metadata = await getImageMetadata(file.buffer);

    return c.json({
      data: {
        urls,
        filename: file.filename,
        originalFilename: file.originalFilename,
        contentType: file.contentType,
        size: file.size,
        metadata,
      },
    }, 201);
  } catch (error) {
    console.error('Image processing error:', error);
    return c.json({
      error: {
        code: 'PROCESSING_FAILED',
        message: 'Failed to process image',
        details: { error: error instanceof Error ? error.message : String(error) },
      },
    }, 500);
  }
});

/**
 * POST /upload/document - Document upload
 */
app.post('/upload/document', documentUploadMiddleware(10), async (c) => {
  const file: UploadedFile = c.get('uploadedFile');

  return c.json({
    data: {
      url: file.url,
      filename: file.filename,
      originalFilename: file.originalFilename,
      contentType: file.contentType,
      size: file.size,
    },
  }, 201);
});

/**
 * POST /upload/avatar - Avatar upload (generates circular thumbnail)
 */
app.post('/upload/avatar', imageUploadMiddleware(2), async (c) => {
  const file: UploadedFile = c.get('uploadedFile');
  const storage = getStorage();

  try {
    // Generate square thumbnail suitable for avatars
    const size = 200;
    const thumbnailBuffer = await generateThumbnail(file.buffer, size);

    // Upload avatar
    const avatarFilename = file.filename.replace(/(\.[^.]+)$/, '_avatar$1');
    const avatarUrl = await storage.upload({
      file: thumbnailBuffer,
      filename: avatarFilename,
      contentType: file.contentType,
      folder: 'avatars',
    });

    // Also generate smaller version for lists
    const smallBuffer = await generateThumbnail(file.buffer, 64);
    const smallFilename = file.filename.replace(/(\.[^.]+)$/, '_avatar_small$1');
    const smallUrl = await storage.upload({
      file: smallBuffer,
      filename: smallFilename,
      contentType: file.contentType,
      folder: 'avatars',
    });

    return c.json({
      data: {
        urls: {
          large: avatarUrl,
          small: smallUrl,
          original: file.url,
        },
        filename: file.filename,
        originalFilename: file.originalFilename,
        contentType: file.contentType,
        size: file.size,
      },
    }, 201);
  } catch (error) {
    console.error('Avatar processing error:', error);
    return c.json({
      error: {
        code: 'PROCESSING_FAILED',
        message: 'Failed to process avatar',
      },
    }, 500);
  }
});

// ============================================================================
// File Management Endpoints
// ============================================================================

/**
 * GET /files/:path - Download a file
 */
app.get('/files/*', async (c) => {
  const path = c.req.param('0'); // Get wildcard path

  if (!path) {
    return c.json({
      error: {
        code: 'INVALID_PATH',
        message: 'File path is required',
      },
    }, 400);
  }

  const storage = getStorage();

  try {
    const buffer = await storage.download(path);

    // Try to determine content type from extension
    const ext = path.split('.').pop()?.toLowerCase();
    const contentType = getContentTypeFromExtension(ext || '');
    const filename = path.split('/').pop() || 'file';

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('File download error:', error);
    return c.json({
      error: {
        code: 'FILE_NOT_FOUND',
        message: 'File not found',
      },
    }, 404);
  }
});

/**
 * DELETE /files/:path - Delete a file
 * Requires authentication (add auth middleware in main.ts)
 */
app.delete('/files/*', async (c) => {
  const path = c.req.param('0');

  if (!path) {
    return c.json({
      error: {
        code: 'INVALID_PATH',
        message: 'File path is required',
      },
    }, 400);
  }

  const storage = getStorage();

  try {
    await storage.delete(path);
    return c.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    return c.json({
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete file',
      },
    }, 500);
  }
});

/**
 * GET /files - List files
 * Query params:
 *  - prefix: Filter by prefix (folder)
 */
app.get('/files', async (c) => {
  const prefix = c.req.query('prefix') || '';
  const storage = getStorage();

  try {
    const files = await storage.list(prefix);
    return c.json({ data: { files } });
  } catch (error) {
    console.error('File list error:', error);
    return c.json({
      error: {
        code: 'LIST_FAILED',
        message: 'Failed to list files',
      },
    }, 500);
  }
});

// ============================================================================
// Utilities
// ============================================================================

function getContentTypeFromExtension(ext: string): string {
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    json: 'application/json',
    csv: 'text/csv',
  };

  return types[ext] || 'application/octet-stream';
}

export default app;
