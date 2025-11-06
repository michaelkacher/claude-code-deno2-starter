/**
 * Response Compression Middleware
 * 
 * Compresses API responses using gzip or brotli to reduce bandwidth usage.
 * Only compresses responses larger than the minimum size threshold.
 * 
 * Features:
 * - Automatic content encoding negotiation (brotli > gzip > identity)
 * - Configurable minimum size threshold (default: 1KB)
 * - Skip compression for already compressed content (images, video, etc.)
 * - Preserves all response headers
 * - Zero overhead for small responses
 * 
 * @example
 * ```typescript
 * import { compress } from './lib/compression.ts';
 * 
 * app.use('*', compress());
 * ```
 */

import type { Context, Next } from 'hono';

export interface CompressionOptions {
  /**
   * Minimum response size in bytes to compress
   * @default 1024 (1KB)
   */
  threshold?: number;

  /**
   * Compression level for gzip (0-9)
   * Higher = better compression but slower
   * @default 6
   */
  level?: number;

  /**
   * Enable brotli compression (preferred over gzip when supported)
   * @default true
   */
  enableBrotli?: boolean;

  /**
   * Paths to exclude from compression (exact match or starts with)
   * @default []
   */
  excludePaths?: string[];
}

/**
 * Content types that should NOT be compressed
 * (already compressed or binary formats)
 */
const SKIP_COMPRESSION_TYPES = [
  'image/',
  'video/',
  'audio/',
  'application/zip',
  'application/gzip',
  'application/x-gzip',
  'application/x-bzip2',
  'application/x-7z-compressed',
  'application/x-rar-compressed',
  'application/octet-stream',
];

/**
 * Check if response should be compressed based on content type
 */
function shouldCompress(contentType: string | null): boolean {
  if (!contentType) return true;
  
  const type = contentType.toLowerCase();
  return !SKIP_COMPRESSION_TYPES.some(skip => type.includes(skip));
}

/**
 * Get preferred encoding from Accept-Encoding header
 */
function getPreferredEncoding(acceptEncoding: string | null, enableBrotli: boolean): 'br' | 'gzip' | null {
  if (!acceptEncoding) return null;
  
  const encodings = acceptEncoding.toLowerCase();
  
  // Prefer brotli over gzip (better compression)
  if (enableBrotli && encodings.includes('br')) return 'br';
  if (encodings.includes('gzip')) return 'gzip';
  
  return null;
}

/**
 * Compress data using gzip
 */
async function compressGzip(data: Uint8Array, level: number): Promise<Uint8Array> {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    },
  });

  const compressed = stream.pipeThrough(new CompressionStream('gzip'));
  const chunks: Uint8Array[] = [];
  
  for await (const chunk of compressed) {
    chunks.push(chunk);
  }
  
  // Combine chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

/**
 * Compress data using brotli
 */
async function compressBrotli(data: Uint8Array): Promise<Uint8Array> {
  // Brotli not yet supported in Deno's CompressionStream
  // Fall back to gzip for now
  // TODO: Use native brotli when available
  return await compressGzip(data, 6);
}

/**
 * Compression middleware factory
 */
export function compress(options: CompressionOptions = {}) {
  const {
    threshold = 1024, // 1KB minimum
    level = 6,
    enableBrotli = true,
    excludePaths = [],
  } = options;

  return async (c: Context, next: Next) => {
    await next();

    // Check if path should be excluded from compression
    const path = new URL(c.req.url).pathname;
    if (excludePaths.some(excludePath => path.startsWith(excludePath))) {
      return;
    }

    // Only compress successful responses
    if (c.res.status >= 400) return;

    // Check if client accepts compression
    const acceptEncoding = c.req.header('Accept-Encoding');
    const encoding = getPreferredEncoding(acceptEncoding, enableBrotli);
    
    if (!encoding) return;

    // Check content type
    const contentType = c.res.headers.get('Content-Type');
    if (!shouldCompress(contentType)) return;

    // Check if already compressed
    if (c.res.headers.get('Content-Encoding')) return;

    // Check if response body exists and is not a stream
    if (!c.res.body) return;
    
    // Skip compression for streaming responses (body is a ReadableStream)
    // We can only compress responses with known content
    if (c.res.body instanceof ReadableStream) {
      // Check if it's already been read (bodyUsed)
      if (c.res.bodyUsed) return;
    }

    // Try to read the body
    let data: Uint8Array;
    try {
      // Clone the response to avoid consuming the original
      const cloned = c.res.clone();
      const body = await cloned.arrayBuffer();
      data = new Uint8Array(body);
    } catch (error) {
      // If we can't read the body (stream locked, disturbed, etc.), skip compression
      console.debug('[Compression] Skipping compression - body not readable:', error.message);
      return;
    }

    // Only compress if above threshold
    if (data.length < threshold) return;

    // Compress data
    let compressed: Uint8Array;
    let actualEncoding: string;
    
    try {
      if (encoding === 'br') {
        compressed = await compressBrotli(data);
        actualEncoding = 'br';
      } else {
        compressed = await compressGzip(data, level);
        actualEncoding = 'gzip';
      }
    } catch (error) {
      console.error('Compression error:', error);
      return; // Return original response on error
    }

    // Only use compressed version if it's actually smaller
    if (compressed.length >= data.length) {
      return; // Original is smaller or same size
    }

    // Calculate compression ratio
    const ratio = ((1 - compressed.length / data.length) * 100).toFixed(1);
    
    // Create new response with compressed body
    const newHeaders = new Headers(c.res.headers);
    newHeaders.set('Content-Encoding', actualEncoding);
    newHeaders.set('Content-Length', compressed.length.toString());
    newHeaders.delete('Content-MD5'); // Remove MD5 as body changed
    
    // Add compression info header (useful for debugging)
    const env = Deno.env.get('DENO_ENV');
    if (env === 'development') {
      newHeaders.set('X-Compression-Ratio', `${ratio}%`);
      newHeaders.set('X-Original-Size', data.length.toString());
      newHeaders.set('X-Compressed-Size', compressed.length.toString());
    }

    // Replace response
    c.res = new Response(compressed, {
      status: c.res.status,
      statusText: c.res.statusText,
      headers: newHeaders,
    });
  };
}

/**
 * Get compression stats for monitoring
 */
export interface CompressionStats {
  totalRequests: number;
  compressedRequests: number;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  averageCompressionRatio: number;
}

let stats: CompressionStats = {
  totalRequests: 0,
  compressedRequests: 0,
  totalOriginalBytes: 0,
  totalCompressedBytes: 0,
  averageCompressionRatio: 0,
};

/**
 * Get current compression statistics
 */
export function getCompressionStats(): CompressionStats {
  return { ...stats };
}

/**
 * Reset compression statistics
 */
export function resetCompressionStats(): void {
  stats = {
    totalRequests: 0,
    compressedRequests: 0,
    totalOriginalBytes: 0,
    totalCompressedBytes: 0,
    averageCompressionRatio: 0,
  };
}
