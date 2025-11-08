/**
 * Image processing utilities
 *
 * Provides image manipulation features:
 * - Resize images
 * - Convert formats
 * - Generate thumbnails
 * - Optimize images
 * - Extract metadata
 *
 * Uses the Sharp library for high-performance image processing.
 *
 * @example
 * ```typescript
 * import { resizeImage, generateThumbnail } from './lib/image-processing.ts';
 *
 * // Resize an image
 * const resized = await resizeImage(imageBuffer, { width: 800, height: 600 });
 *
 * // Generate thumbnail
 * const thumbnail = await generateThumbnail(imageBuffer, 200);
 *
 * // Convert format
 * const webp = await convertFormat(imageBuffer, 'webp');
 * ```
 */

import Sharp from 'npm:sharp@^0.33.0';

// ============================================================================
// Types
// ============================================================================

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: string;
  quality?: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
  orientation?: number;
}

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif';

// ============================================================================
// Image Manipulation
// ============================================================================

/**
 * Resize an image
 */
export async function resizeImage(
  buffer: Uint8Array | ArrayBuffer,
  options: ResizeOptions,
): Promise<Uint8Array> {
  const { width, height, fit = 'cover', quality = 80 } = options;

  const sharp = Sharp(buffer);

  sharp.resize({
    width,
    height,
    fit,
  });

  // Apply quality for JPEG/WebP
  sharp.jpeg({ quality });
  sharp.webp({ quality });

  const result = await sharp.toBuffer();
  return new Uint8Array(result);
}

/**
 * Generate a thumbnail (square crop from center)
 */
export async function generateThumbnail(
  buffer: Uint8Array | ArrayBuffer,
  size: number,
  quality = 80,
): Promise<Uint8Array> {
  const sharp = Sharp(buffer);

  sharp
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality });

  const result = await sharp.toBuffer();
  return new Uint8Array(result);
}

/**
 * Convert image format
 */
export async function convertFormat(
  buffer: Uint8Array | ArrayBuffer,
  format: ImageFormat,
  quality = 80,
): Promise<Uint8Array> {
  const sharp = Sharp(buffer);

  switch (format) {
    case 'jpeg':
      sharp.jpeg({ quality });
      break;
    case 'png':
      sharp.png({ quality });
      break;
    case 'webp':
      sharp.webp({ quality });
      break;
    case 'avif':
      sharp.avif({ quality });
      break;
    case 'gif':
      sharp.gif();
      break;
  }

  const result = await sharp.toBuffer();
  return new Uint8Array(result);
}

/**
 * Optimize image (reduce file size while maintaining quality)
 */
export async function optimizeImage(
  buffer: Uint8Array | ArrayBuffer,
  quality = 85,
): Promise<Uint8Array> {
  const sharp = Sharp(buffer);
  const metadata = await sharp.metadata();

  // Optimize based on format
  switch (metadata.format) {
    case 'jpeg':
      sharp.jpeg({ quality, progressive: true, mozjpeg: true });
      break;
    case 'png':
      sharp.png({ quality, compressionLevel: 9 });
      break;
    case 'webp':
      sharp.webp({ quality });
      break;
    default:
      // Keep original format
      break;
  }

  const result = await sharp.toBuffer();
  return new Uint8Array(result);
}

/**
 * Extract image metadata
 */
export async function getImageMetadata(
  buffer: Uint8Array | ArrayBuffer,
): Promise<ImageMetadata> {
  const sharp = Sharp(buffer);
  const metadata = await sharp.metadata();

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: metadata.size || 0,
    hasAlpha: metadata.hasAlpha || false,
    orientation: metadata.orientation,
  };
}

/**
 * Auto-rotate image based on EXIF orientation
 */
export async function autoRotate(
  buffer: Uint8Array | ArrayBuffer,
): Promise<Uint8Array> {
  const sharp = Sharp(buffer);
  sharp.rotate(); // Auto-rotates based on EXIF

  const result = await sharp.toBuffer();
  return new Uint8Array(result);
}

/**
 * Generate multiple sizes for responsive images
 */
export async function generateResponsiveSizes(
  buffer: Uint8Array | ArrayBuffer,
  sizes: number[] = [320, 640, 1024, 1920],
  quality = 80,
): Promise<Map<number, Uint8Array>> {
  const results = new Map<number, Uint8Array>();

  for (const size of sizes) {
    const resized = await resizeImage(buffer, { width: size, quality });
    results.set(size, resized);
  }

  return results;
}

/**
 * Create an avatar (circular thumbnail with background)
 */
export async function createAvatar(
  buffer: Uint8Array | ArrayBuffer,
  size: number,
  backgroundColor = '#f0f0f0',
): Promise<Uint8Array> {
  const sharp = Sharp(buffer);

  // Create circular mask
  const svgMask = `<svg width="${size}" height="${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
  </svg>`;
  const mask = new TextEncoder().encode(svgMask);

  sharp
    .resize(size, size, { fit: 'cover', position: 'center' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .flatten({ background: backgroundColor })
    .png();

  const result = await sharp.toBuffer();
  return new Uint8Array(result);
}

/**
 * Validate if buffer is a valid image
 */
export async function isValidImage(
  buffer: Uint8Array | ArrayBuffer,
): Promise<boolean> {
  try {
    await Sharp(buffer).metadata();
    return true;
  } catch {
    return false;
  }
}
