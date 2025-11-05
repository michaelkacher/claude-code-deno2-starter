# File Upload & Storage

Complete file upload and storage system with support for local filesystem and S3-compatible storage (AWS S3, Cloudflare R2, MinIO).

**Last Updated:** 2025-01-27

---

## Quick Start

### 1. Configure Storage

Add to `.env`:

```bash
# Local storage (development)
STORAGE_TYPE=local
STORAGE_PATH=./uploads

# OR S3/R2 storage (production)
STORAGE_TYPE=s3
S3_ENDPOINT=https://your-account.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_PUBLIC_URL=https://your-bucket.domain.com  # Optional
```

### 2. Upload a File (Frontend)

```tsx
import ImageUpload from '../islands/ImageUpload.tsx';

export default function ProfilePage() {
  return (
    <ImageUpload
      endpoint="/api/uploads/upload/image"
      maxSizeMB={5}
      onUploadComplete={(url) => console.log('Uploaded:', url)}
      optimize={true}
    />
  );
}
```

### 3. Upload a File (API)

```bash
curl -X POST http://localhost:8000/api/uploads/upload \
  -F "file=@avatar.jpg"
```

---

## Features

✅ **Multiple Storage Backends**
- Local filesystem (development)
- S3-compatible (AWS S3, Cloudflare R2, MinIO)

✅ **File Validation**
- File size limits
- MIME type validation
- File extension validation
- Filename sanitization

✅ **Image Processing**
- Resize images
- Generate thumbnails
- Convert formats (JPEG, PNG, WebP, AVIF)
- Optimize file size
- Auto-rotate based on EXIF
- Create avatars (circular)

✅ **Frontend Components**
- Drag & drop support
- Image preview
- Progress indicator
- Error handling
- Avatar upload
- File upload

---

## API Endpoints

### POST /api/uploads/upload
General file upload (any type, 10MB max)

**Request:**
```bash
curl -X POST http://localhost:8000/api/uploads/upload \
  -F "file=@document.pdf"
```

**Response:**
```json
{
  "data": {
    "url": "/uploads/document_1234567890_abc123.pdf",
    "filename": "document_1234567890_abc123.pdf",
    "originalFilename": "document.pdf",
    "contentType": "application/pdf",
    "size": 102400
  }
}
```

### POST /api/uploads/upload/image
Image upload with optional processing

**Query Parameters:**
- `resize` - Resize image (e.g., `800,600`)
- `thumbnail` - Generate thumbnail (e.g., `200`)
- `optimize` - Optimize image (`true`/`false`)

**Request:**
```bash
curl -X POST "http://localhost:8000/api/uploads/upload/image?optimize=true&thumbnail=200" \
  -F "file=@photo.jpg"
```

**Response:**
```json
{
  "data": {
    "urls": {
      "original": "/uploads/photo_1234567890_abc123.jpg",
      "optimized": "/uploads/photo_1234567890_abc123_optimized.jpg",
      "thumbnail": "/uploads/photo_1234567890_abc123_thumb.jpg"
    },
    "filename": "photo_1234567890_abc123.jpg",
    "originalFilename": "photo.jpg",
    "contentType": "image/jpeg",
    "size": 512000,
    "metadata": {
      "width": 1920,
      "height": 1080,
      "format": "jpeg",
      "size": 512000,
      "hasAlpha": false
    }
  }
}
```

### POST /api/uploads/upload/avatar
Avatar upload (creates circular thumbnail)

**Request:**
```bash
curl -X POST http://localhost:8000/api/uploads/upload/avatar \
  -F "file=@avatar.jpg"
```

**Response:**
```json
{
  "data": {
    "urls": {
      "large": "/uploads/avatar_1234567890_abc123_avatar.jpg",
      "small": "/uploads/avatar_1234567890_abc123_avatar_small.jpg",
      "original": "/uploads/avatar_1234567890_abc123.jpg"
    }
  }
}
```

### POST /api/uploads/upload/document
Document upload (PDF, Word, etc., 10MB max)

### GET /api/uploads/files/:path
Download a file

**Request:**
```bash
curl http://localhost:8000/api/uploads/files/avatars/avatar.jpg
```

### DELETE /api/uploads/files/:path
Delete a file (requires authentication)

**Request:**
```bash
curl -X DELETE http://localhost:8000/api/uploads/files/avatars/avatar.jpg \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /api/uploads/files?prefix=folder
List files in a folder

---

## Frontend Components

### ImageUpload Island

Full-featured image upload with preview and drag & drop.

```tsx
import ImageUpload from '../islands/ImageUpload.tsx';

<ImageUpload
  endpoint="/api/uploads/upload/image"
  maxSizeMB={5}
  initialUrl="https://example.com/image.jpg"
  onUploadComplete={(url) => {
    console.log('Uploaded to:', url);
  }}
  resize={{ width: 800, height: 600 }}
  thumbnail={200}
  optimize={true}
/>
```

**Props:**
- `endpoint` - Upload endpoint (default: `/api/uploads/upload/image`)
- `maxSizeMB` - Max file size in MB (default: `5`)
- `initialUrl` - Initial image URL
- `onUploadComplete` - Callback when upload completes
- `resize` - Resize dimensions `{ width, height }`
- `thumbnail` - Generate thumbnail with size
- `optimize` - Optimize image (default: `true`)

### AvatarUpload Island

Specialized avatar upload with circular preview.

```tsx
import AvatarUpload from '../islands/AvatarUpload.tsx';

<AvatarUpload
  avatarUrl="https://example.com/avatar.jpg"
  userName="John Doe"
  size={120}
  onUploadComplete={({ large, small }) => {
    console.log('Avatar URLs:', large, small);
  }}
/>
```

**Props:**
- `avatarUrl` - Current avatar URL
- `userName` - User name for fallback initials
- `size` - Size in pixels (default: `120`)
- `endpoint` - Upload endpoint (default: `/api/uploads/upload/avatar`)
- `onUploadComplete` - Callback with `{ large, small }` URLs

### FileUpload Component

Generic file upload component (can be used in islands or routes).

```tsx
import { FileUpload } from '../components/FileUpload.tsx';

<FileUpload
  accept="image/*"
  maxSize={10 * 1024 * 1024}
  endpoint="/api/uploads/upload"
  onUpload={(url, file) => {
    console.log('Uploaded:', url, file);
  }}
  showPreview={true}
/>
```

---

## Backend Usage

### Using Storage in Routes

```typescript
import { getStorage } from '../lib/storage.ts';

app.post('/api/profile/avatar', async (c) => {
  const storage = getStorage();

  // Upload file
  const url = await storage.upload({
    file: imageBuffer,
    filename: 'avatar.jpg',
    contentType: 'image/jpeg',
    folder: 'avatars',
  });

  return c.json({ url });
});
```

### File Upload Middleware

```typescript
import { imageUploadMiddleware } from '../lib/file-upload.ts';

app.post('/api/upload',
  imageUploadMiddleware(5), // 5MB max
  async (c) => {
    const file = c.get('uploadedFile');
    return c.json({
      url: file.url,
      filename: file.filename,
    });
  }
);
```

### Custom File Validation

```typescript
import { createFileUploadMiddleware, MIME_TYPES } from '../lib/file-upload.ts';

app.post('/api/upload/video',
  createFileUploadMiddleware({
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: MIME_TYPES.VIDEOS,
    allowedExtensions: ['.mp4', '.webm'],
    folder: 'videos',
    uniqueFilenames: true,
  }),
  async (c) => {
    const file = c.get('uploadedFile');
    return c.json({ url: file.url });
  }
);
```

### Image Processing

```typescript
import { resizeImage, generateThumbnail, optimizeImage } from '../lib/image-processing.ts';

// Resize image
const resized = await resizeImage(imageBuffer, {
  width: 800,
  height: 600,
  fit: 'cover',
  quality: 85,
});

// Generate thumbnail
const thumbnail = await generateThumbnail(imageBuffer, 200);

// Optimize image
const optimized = await optimizeImage(imageBuffer, 85);

// Convert format
const webp = await convertFormat(imageBuffer, 'webp', 85);

// Get metadata
const metadata = await getImageMetadata(imageBuffer);
console.log(metadata.width, metadata.height, metadata.format);
```

---

## Storage Backends

### Local Storage (Development)

Files stored in `./uploads` directory.

**.env:**
```bash
STORAGE_TYPE=local
STORAGE_PATH=./uploads
```

**Features:**
- ✅ No external dependencies
- ✅ Fast for development
- ✅ Easy to inspect files
- ❌ Not suitable for production
- ❌ No CDN support

### Cloudflare R2 (Recommended for Production)

S3-compatible storage with free egress.

**.env:**
```bash
STORAGE_TYPE=s3
S3_ENDPOINT=https://your-account.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-r2-access-key
S3_SECRET_ACCESS_KEY=your-r2-secret-key
S3_PUBLIC_URL=https://your-custom-domain.com  # Optional
```

**Features:**
- ✅ Free egress bandwidth
- ✅ S3-compatible API
- ✅ Global CDN
- ✅ Affordable pricing
- ✅ Custom domains

**Setup:**
1. Create R2 bucket in Cloudflare dashboard
2. Generate API token
3. (Optional) Connect custom domain
4. Add credentials to `.env`

### AWS S3

Standard S3 storage.

**.env:**
```bash
STORAGE_TYPE=s3
S3_REGION=us-east-1
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-aws-access-key
S3_SECRET_ACCESS_KEY=your-aws-secret-key
S3_PUBLIC_URL=https://your-bucket.s3.amazonaws.com
```

---

## Security Best Practices

### 1. Validate File Types

Always validate MIME types and extensions:

```typescript
import { MIME_TYPES } from '../lib/file-upload.ts';

createFileUploadMiddleware({
  allowedTypes: MIME_TYPES.IMAGES,
  allowedExtensions: ['.jpg', '.png', '.webp'],
})
```

### 2. Limit File Sizes

Set appropriate size limits:

```typescript
createFileUploadMiddleware({
  maxSize: 5 * 1024 * 1024, // 5MB
})
```

### 3. Sanitize Filenames

Filenames are automatically sanitized to prevent:
- Directory traversal attacks
- Special character issues
- Path injection

### 4. Use Authentication

Protect upload endpoints:

```typescript
import { requireAuth } from '../middleware/auth.ts';

app.post('/api/uploads/upload',
  requireAuth, // Add auth middleware
  imageUploadMiddleware(5),
  async (c) => {
    // Only authenticated users can upload
  }
);
```

### 5. Rate Limiting

Rate limit upload endpoints to prevent abuse (already configured in `backend/main.ts`).

---

## Common Patterns

### User Avatar Upload

```typescript
// Backend route
app.post('/api/users/me/avatar',
  requireAuth,
  imageUploadMiddleware(2), // 2MB max for avatars
  async (c) => {
    const user = c.get('user');
    const file = c.get('uploadedFile');

    // Process image
    const storage = getStorage();
    const thumbnail = await generateThumbnail(file.buffer, 200);

    // Upload thumbnail
    const avatarUrl = await storage.upload({
      file: thumbnail,
      filename: `avatar_${user.id}.jpg`,
      contentType: 'image/jpeg',
      folder: 'avatars',
    });

    // Update user record
    await kv.set(['users', user.id], {
      ...user,
      avatarUrl,
    });

    return c.json({ avatarUrl });
  }
);
```

### Document Upload with Metadata

```typescript
app.post('/api/documents/upload',
  requireAuth,
  documentUploadMiddleware(10),
  async (c) => {
    const user = c.get('user');
    const file = c.get('uploadedFile');

    // Store document metadata in KV
    const documentId = crypto.randomUUID();
    await kv.set(['documents', documentId], {
      id: documentId,
      userId: user.id,
      filename: file.originalFilename,
      url: file.url,
      contentType: file.contentType,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    });

    return c.json({ documentId, url: file.url });
  }
);
```

### Multiple Image Sizes

```typescript
import { generateResponsiveSizes } from '../lib/image-processing.ts';

const sizes = await generateResponsiveSizes(imageBuffer, [320, 640, 1024, 1920]);

// Upload all sizes
const urls: Record<number, string> = {};
for (const [size, buffer] of sizes) {
  const url = await storage.upload({
    file: buffer,
    filename: `image_${size}w.jpg`,
    contentType: 'image/jpeg',
    folder: 'images',
  });
  urls[size] = url;
}
```

---

## Troubleshooting

### Upload fails with "File too large"

Increase the max size limit:

```typescript
createFileUploadMiddleware({
  maxSize: 20 * 1024 * 1024, // Increase to 20MB
})
```

### S3 connection errors

Check your credentials and endpoint:

```bash
# Verify S3 credentials
echo $S3_ACCESS_KEY_ID
echo $S3_SECRET_ACCESS_KEY
echo $S3_ENDPOINT
```

### Image processing fails

Ensure Sharp is installed (it's included via npm):

```bash
# Sharp is included in package imports
# It will auto-install on first use
```

### Files not found after upload

Check storage configuration:

```bash
# For local storage, verify path exists
ls -la ./uploads

# For S3, verify bucket exists and has correct permissions
```

---

## Performance Tips

1. **Use image optimization** - Reduces file sizes by 50-80%
2. **Generate thumbnails** - Faster page loads
3. **Use WebP format** - Better compression than JPEG
4. **Implement lazy loading** - Only load images when visible
5. **Use CDN** - Cloudflare R2 includes free CDN

---

## Next Steps

- Add virus scanning for uploaded files
- Implement background processing for large images
- Add watermarking for images
- Create image galleries
- Implement video uploads
- Add PDF preview generation

---

**Need help?** Check the examples in `backend/routes/uploads.ts` and `frontend/islands/ImageUpload.tsx`.
