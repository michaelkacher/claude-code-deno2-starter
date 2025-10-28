# Data Models: {Feature Name}

> **Token Efficiency**: Use Zod pattern imports from `features/_templates/zod-patterns.ts` for common fields. See `ZOD_PATTERNS.md` for reference.

## Zod Schemas (for validation)

```typescript
import { z } from 'zod';
import {
  idField,
  nameField,
  descriptionField,
  statusField,
  timestampFields,
  generateCRUDSchemas,
} from '../_templates/zod-patterns.ts';

// Define base schema using pattern imports
const {ModelName}Schema = z.object({
  ...idField,           // id: UUID v4
  ...nameField,         // name: 1-100 chars
  ...descriptionField,  // description: optional, max 500 chars
  ...statusField,       // status: 'active' | 'inactive' | 'deleted'
  // Add custom fields here
  customField: z.string().max(200),
  ...timestampFields,   // createdAt, updatedAt: ISO 8601
});

// Generate CRUD schemas automatically
const { base, create, update } = generateCRUDSchemas('{ModelName}', {ModelName}Schema);

export { base as {ModelName}Schema };
export { create as Create{ModelName}Schema };
export { update as Update{ModelName}Schema };

// Export types
export type {ModelName} = z.infer<typeof {ModelName}Schema>;
export type Create{ModelName} = z.infer<typeof Create{ModelName}Schema>;
export type Update{ModelName} = z.infer<typeof Update{ModelName}Schema>;
```

**Validation Rules**:
- Standard fields: See `ZOD_PATTERNS.md` for `idField`, `nameField`, etc.
- `customField`: Required, max 200 characters
- (Only document fields unique to this feature)

---

## TypeScript Interfaces (for reference)

```typescript
interface {ModelName} {
  id: string;                    // UUID v4
  name: string;                  // 1-100 characters
  description: string | null;    // Optional, max 500 chars
  status: 'active' | 'inactive'; // Enum
  customField: string;           // Custom to this feature
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
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
