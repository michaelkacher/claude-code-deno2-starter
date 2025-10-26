# Data Models: {Feature Name}

## TypeScript Interfaces

### {Model Name}

```typescript
interface {ModelName} {
  id: string;                    // UUID v4
  name: string;                  // 1-100 characters
  description: string | null;    // Optional, max 500 chars
  status: 'active' | 'inactive'; // Enum
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

**Validation Rules**:
- `id`: Auto-generated UUID, immutable
- `name`: Required, 1-100 characters, unique
- `description`: Optional, max 500 characters
- `status`: Required, must be 'active' or 'inactive'
- `createdAt`: Auto-generated on creation
- `updatedAt`: Auto-updated on modification

**Indexes** (if using database):
- Primary: `id`
- Unique: `name`
- Index: `status`, `createdAt`

---

### {Related Model Name}

```typescript
interface {RelatedModelName} {
  id: string;
  {modelName}Id: string;  // Foreign key
  // ... other fields
}
```

---

## Zod Schemas (for validation)

```typescript
import { z } from 'zod';

export const {ModelName}Schema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  status: z.enum(['active', 'inactive']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const Create{ModelName}Schema = {ModelName}Schema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const Update{ModelName}Schema = Create{ModelName}Schema.partial();

export type {ModelName} = z.infer<typeof {ModelName}Schema>;
export type Create{ModelName} = z.infer<typeof Create{ModelName}Schema>;
export type Update{ModelName} = z.infer<typeof Update{ModelName}Schema>;
```

---

## Deno KV Key Structure

```typescript
// Primary records
['resources', resourceId] -> Resource

// Secondary indexes
['resources_by_name', name] -> resourceId
['resources_by_status', status, resourceId] -> null  // For listing

// Relationships (if applicable)
['user_resources', userId, resourceId] -> null
```

---

## PostgreSQL Schema (if using PostgreSQL instead)

```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_resources_created_at ON resources(created_at DESC);
```

---

## Relationships

### One-to-Many
- `User` → `Resource`: One user can have many resources
  - Foreign key: `Resource.userId`

### Many-to-Many
- `User` ↔ `Resource`: Users can share resources
  - Junction table: `user_resources` with `userId` and `resourceId`

---

## Business Rules

1. **Uniqueness**: Resource names must be unique across all users
2. **Soft Delete**: Resources are marked as 'inactive' instead of being deleted
3. **Cascade**: Deleting a user marks all their resources as 'inactive'
4. **Validation**: All string fields are trimmed before storage

---

## Example Data

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My First Resource",
  "description": "This is an example resource",
  "status": "active",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```
