/**
 * Storage abstraction layer
 *
 * Provides a unified interface for file storage that works with:
 * - Local filesystem (development)
 * - S3-compatible storage (AWS S3, Cloudflare R2, MinIO)
 *
 * Features:
 * - Upload files with automatic path generation
 * - Download files as streams or buffers
 * - Delete files
 * - Generate signed URLs for temporary access
 * - List files by prefix
 *
 * @example
 * ```typescript
 * const storage = createStorage();
 *
 * // Upload a file
 * const url = await storage.upload({
 *   file: fileBuffer,
 *   filename: 'avatar.jpg',
 *   contentType: 'image/jpeg',
 *   folder: 'avatars',
 * });
 *
 * // Get a signed URL (24 hour expiry)
 * const signedUrl = await storage.getSignedUrl('avatars/avatar.jpg', 86400);
 *
 * // Delete a file
 * await storage.delete('avatars/avatar.jpg');
 * ```
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from 'npm:@aws-sdk/client-s3@^3.0.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@^3.0.0';
import { join } from 'jsr:@std/path';
import { ensureDir } from 'jsr:@std/fs';

// ============================================================================
// Types
// ============================================================================

export interface UploadOptions {
  file: Uint8Array | ArrayBuffer;
  filename: string;
  contentType: string;
  folder?: string;
  metadata?: Record<string, string>;
}

export interface StorageConfig {
  type: 'local' | 's3';
  localPath?: string;
  s3?: {
    endpoint?: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicUrl?: string; // Base URL for public access
  };
}

export interface Storage {
  upload(options: UploadOptions): Promise<string>;
  download(path: string): Promise<Uint8Array>;
  delete(path: string): Promise<void>;
  getSignedUrl(path: string, expiresIn: number): Promise<string>;
  list(prefix?: string): Promise<string[]>;
  exists(path: string): Promise<boolean>;
}

// ============================================================================
// Local Storage Implementation
// ============================================================================

class LocalStorage implements Storage {
  constructor(private basePath: string) {}

  async upload(options: UploadOptions): Promise<string> {
    const { file, filename, folder } = options;

    // Generate file path
    const filePath = folder ? join(folder, filename) : filename;
    const fullPath = join(this.basePath, filePath);

    // Ensure directory exists
    const dir = join(this.basePath, folder || '');
    await ensureDir(dir);

    // Write file
    const buffer = file instanceof ArrayBuffer
      ? new Uint8Array(file)
      : file;
    await Deno.writeFile(fullPath, buffer);

    // Return relative path
    return filePath;
  }

  async download(path: string): Promise<Uint8Array> {
    const fullPath = join(this.basePath, path);
    return await Deno.readFile(fullPath);
  }

  async delete(path: string): Promise<void> {
    const fullPath = join(this.basePath, path);
    await Deno.remove(fullPath);
  }

  async getSignedUrl(path: string, _expiresIn: number): Promise<string> {
    // For local storage, just return the path
    // In a real app, you'd serve these through your API
    return `/uploads/${path}`;
  }

  async list(prefix = ''): Promise<string[]> {
    const fullPath = join(this.basePath, prefix);
    const files: string[] = [];

    try {
      for await (const entry of Deno.readDir(fullPath)) {
        if (entry.isFile) {
          files.push(join(prefix, entry.name));
        } else if (entry.isDirectory) {
          const subFiles = await this.list(join(prefix, entry.name));
          files.push(...subFiles);
        }
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }

    return files;
  }

  async exists(path: string): Promise<boolean> {
    try {
      const fullPath = join(this.basePath, path);
      await Deno.stat(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// S3 Storage Implementation
// ============================================================================

class S3Storage implements Storage {
  private client: S3Client;
  private bucket: string;
  private publicUrl?: string;

  constructor(config: NonNullable<StorageConfig['s3']>) {
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl;

    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(options: UploadOptions): Promise<string> {
    const { file, filename, contentType, folder, metadata } = options;

    // Generate key (path in S3)
    const key = folder ? `${folder}/${filename}` : filename;

    // Convert to buffer
    const buffer = file instanceof ArrayBuffer
      ? new Uint8Array(file)
      : file;

    // Upload to S3
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
    }));

    // Return public URL or key
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    return key;
  }

  async download(path: string): Promise<Uint8Array> {
    const response = await this.client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    }));

    if (!response.Body) {
      throw new Error('No file content received');
    }

    // Convert stream to Uint8Array
    const chunks: Uint8Array[] = [];
    // @ts-ignore - AWS SDK types are complex
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }

    // Combine chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  async delete(path: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    }));
  }

  async getSignedUrl(path: string, expiresIn: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  async list(prefix = ''): Promise<string[]> {
    const response = await this.client.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    }));

    return response.Contents?.map((obj) => obj.Key || '') || [];
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      }));
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a storage instance based on configuration
 */
export function createStorage(config?: StorageConfig): Storage {
  const finalConfig = config || getDefaultConfig();

  if (finalConfig.type === 's3') {
    if (!finalConfig.s3) {
      throw new Error('S3 configuration is required when type is "s3"');
    }
    return new S3Storage(finalConfig.s3);
  }

  return new LocalStorage(finalConfig.localPath || './uploads');
}

/**
 * Get default storage configuration from environment
 */
function getDefaultConfig(): StorageConfig {
  const storageType = Deno.env.get('STORAGE_TYPE') as 'local' | 's3' || 'local';

  if (storageType === 's3') {
    return {
      type: 's3',
      s3: {
        endpoint: Deno.env.get('S3_ENDPOINT'),
        region: Deno.env.get('S3_REGION') || 'auto',
        bucket: Deno.env.get('S3_BUCKET') || '',
        accessKeyId: Deno.env.get('S3_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('S3_SECRET_ACCESS_KEY') || '',
        publicUrl: Deno.env.get('S3_PUBLIC_URL'),
      },
    };
  }

  return {
    type: 'local',
    localPath: Deno.env.get('STORAGE_PATH') || './uploads',
  };
}

// ============================================================================
// Singleton Instance
// ============================================================================

let storageInstance: Storage | null = null;

/**
 * Get the global storage instance
 */
export function getStorage(): Storage {
  if (!storageInstance) {
    storageInstance = createStorage();
  }
  return storageInstance;
}

/**
 * Set a custom storage instance (useful for testing)
 */
export function setStorage(storage: Storage): void {
  storageInstance = storage;
}
