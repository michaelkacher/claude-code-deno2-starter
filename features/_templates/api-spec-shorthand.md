# API Specification: {Feature Name} (Shorthand)

> **Use this template for simple CRUD features.** For complex endpoints with custom logic, use the full `api-spec.md` template.

## Endpoints

### Standard CRUD Endpoints

This feature implements standard CRUD for `{ResourceName}`:

| Endpoint | Pattern | Auth | Notes |
|----------|---------|------|-------|
| `POST /api/v1/{resources}` | `CREATE_RESOURCE` | Yes | {any unique validation} |
| `GET /api/v1/{resources}` | `LIST_RESOURCES` | Yes | {any filters/sorting} |
| `GET /api/v1/{resources}/:id` | `GET_RESOURCE` | Yes | {any special behavior} |
| `PUT /api/v1/{resources}/:id` | `UPDATE_RESOURCE` | Yes | {any special rules} |
| `DELETE /api/v1/{resources}/:id` | `DELETE_RESOURCE` | Yes | {soft/hard delete?} |

**Pattern Reference**: See `features/_templates/API_PATTERNS.md` for full pattern definitions.

**All endpoints use**: `STANDARD_ERRORS` (see API_PATTERNS.md)

---

## Resource Fields

### Request Body (Create/Update)

```json
{
  "field1": "string (required, 1-100 chars)",
  "field2": "number (optional, min: 0, max: 1000)",
  "field3": "enum ['value1', 'value2'] (required)"
}
```

**Validation**:
- `field1`: Required, 1-100 characters
- `field2`: Optional, 0-1000
- `field3`: Required, must be 'value1' or 'value2'

### Response Body (Success)

```json
{
  "data": {
    "id": "uuid",
    "field1": "value",
    "field2": 123,
    "field3": "value1",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

---

## Custom Endpoints (if any)

### {Custom Endpoint Name}

**Endpoint**: `{METHOD} /api/v1/{custom-path}`

**Description**: {What makes this endpoint special/different}

**Authentication**: Required/Optional

**Request**: {Document unique request format}

**Response**: {Document unique response format}

**Errors**: `STANDARD_ERRORS` plus:
- 409 if {specific conflict scenario}

---

## Business Rules

1. {Rule 1 - e.g., "Names must be unique per user"}
2. {Rule 2 - e.g., "Soft delete: set status='deleted' instead of removing"}
3. {Rule 3 - e.g., "Max 100 items per user"}

---

## Notes

- See `features/_templates/API_PATTERNS.md` for pattern definitions
- See `data-models.md` for TypeScript types and Zod schemas
- All standard patterns apply (UUID IDs, ISO timestamps, cursor pagination)
