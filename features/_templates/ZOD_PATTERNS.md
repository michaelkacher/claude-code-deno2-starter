# Zod Schema Patterns

Reusable validation patterns for common fields. **Import and use these instead of rewriting** to save tokens and ensure consistency.

## Usage

```typescript
import { idField, timestampField, nameField } from '../_templates/zod-patterns.ts';

const MySchema = z.object({
  ...idField,
  ...nameField,
  ...timestampField,
  // custom fields here
});
```

## Common Field Patterns

### Pattern: `idField`
```typescript
export const idField = {
  id: z.string().uuid(),
};
```

### Pattern: `timestampFields`
```typescript
export const timestampFields = {
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
};
```

### Pattern: `nameField`
```typescript
export const nameField = {
  name: z.string().min(1).max(100),
};
```

### Pattern: `descriptionField`
```typescript
export const descriptionField = {
  description: z.string().max(500).nullable(),
};
```

### Pattern: `emailField`
```typescript
export const emailField = {
  email: z.string().email(),
};
```

### Pattern: `urlField`
```typescript
export const urlField = {
  url: z.string().url(),
};
```

### Pattern: `statusField`
```typescript
export const statusField = {
  status: z.enum(['active', 'inactive', 'deleted']),
};
```

## Validation Helpers

### Pattern: `paginationSchema`
```typescript
export const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().optional(),
});
```

### Pattern: `createFromSchema`
```typescript
// Generate create schema (omits id, timestamps)
export function createSchemaFrom<T extends z.ZodObject<any>>(schema: T) {
  return schema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });
}
```

### Pattern: `updateFromSchema`
```typescript
// Generate update schema (partial, omits id, createdAt)
export function updateSchemaFrom<T extends z.ZodObject<any>>(schema: T) {
  return schema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }).partial();
}
```

## Standard CRUD Schemas

### Pattern: `standardCRUDSchemas`

```typescript
export function generateCRUDSchemas<T extends z.ZodObject<any>>(
  name: string,
  baseSchema: T
) {
  const CreateSchema = createSchemaFrom(baseSchema);
  const UpdateSchema = updateSchemaFrom(baseSchema);

  return {
    [`${name}Schema`]: baseSchema,
    [`Create${name}Schema`]: CreateSchema,
    [`Update${name}Schema`]: UpdateSchema,
    [`${name}`]: baseSchema,
    [`Create${name}`]: CreateSchema,
    [`Update${name}`]: UpdateSchema,
  };
}
```

**Usage**:
```typescript
const UserSchema = z.object({
  ...idField,
  ...nameField,
  ...emailField,
  ...timestampFields,
});

const schemas = generateCRUDSchemas('User', UserSchema);
// Generates: UserSchema, CreateUserSchema, UpdateUserSchema
// Plus types: User, CreateUser, UpdateUser
```

## Error Response Schema

### Pattern: `errorSchema`
```typescript
export const errorSchema = z.object({
  error: z.object({
    code: z.enum([
      'VALIDATION_ERROR',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'CONFLICT',
      'INTERNAL_ERROR',
    ]),
    message: z.string(),
    details: z.record(z.any()).optional(),
  }),
});
```

## Success Response Wrappers

### Pattern: `successResponse`
```typescript
export function successResponse<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: dataSchema,
  });
}
```

### Pattern: `listResponse`
```typescript
export function listResponse<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    cursor: z.string().nullable(),
  });
}
```

## Example: Complete Feature Schema

```typescript
// features/proposed/workouts/schemas.ts
import { z } from 'zod';
import {
  idField,
  nameField,
  timestampFields,
  generateCRUDSchemas,
  successResponse,
  listResponse,
} from '../../_templates/zod-patterns.ts';

// Define base schema
const WorkoutSchema = z.object({
  ...idField,
  ...nameField,
  duration: z.number().min(1).max(300), // minutes
  exercises: z.array(z.string().uuid()).min(1).max(50),
  ...timestampFields,
});

// Generate CRUD schemas automatically
export const {
  WorkoutSchema,
  CreateWorkoutSchema,
  UpdateWorkoutSchema,
} = generateCRUDSchemas('Workout', WorkoutSchema);

// API response schemas
export const WorkoutResponseSchema = successResponse(WorkoutSchema);
export const WorkoutsListResponseSchema = listResponse(WorkoutSchema);

// Export types
export type Workout = z.infer<typeof WorkoutSchema>;
export type CreateWorkout = z.infer<typeof CreateWorkoutSchema>;
export type UpdateWorkout = z.infer<typeof UpdateWorkoutSchema>;
```

## Benefits

- **Token savings**: ~30% reduction in schema code
- **Consistency**: All fields use same validation rules
- **Type safety**: Full TypeScript inference
- **DRY**: Define once, reuse everywhere
- **Easy updates**: Change pattern once, affects all features

## Implementation File

Create `features/_templates/zod-patterns.ts` with actual implementations:

```typescript
// features/_templates/zod-patterns.ts
import { z } from 'zod';

// ... implement all patterns from above ...
```

Then import in feature data models.
