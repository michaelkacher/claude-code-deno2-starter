# API Specification: {Feature Name}

> **Note**: For simple CRUD features, consider using `api-spec-shorthand.md` instead for better token efficiency.

> **Token Efficiency**: Reference `API_PATTERNS.md` instead of repeating standard error responses. Use `STANDARD_ERRORS` for common error codes.

## Base URL
```
Development: http://localhost:3000/api
Production: https://api.example.com/api
```

## Authentication
{Describe if endpoints require authentication: Bearer token, API key, etc.}

## Endpoints

### 1. {Endpoint Name}

**Endpoint**: `{METHOD} /api/resource`

**Description**: {What this endpoint does}

**Authentication**: Required/Optional

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer {token}  // If required
```

**Request Body** (if applicable):
```json
{
  "field1": "string (required, 1-100 chars)",
  "field2": "number (optional, min: 0)"
}
```

**Validation Rules**:
- `field1`: Required, 1-100 characters
- `field2`: Optional, must be >= 0

**Response 200/201** (Success):
```json
{
  "data": {
    "id": "uuid",
    "field1": "value",
    "field2": 123,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

**Errors**: `STANDARD_ERRORS` (see `API_PATTERNS.md`)
- 400: Validation errors (field-specific details)
- 401: Unauthorized (if auth required)
- 404: Resource not found (for :id endpoints)
- 500: Internal server error

{Only document error responses if they differ from standard patterns}

---

### 2. {Next Endpoint}

{Repeat structure above for each endpoint}

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `CONFLICT` | 409 | Resource already exists (duplicate) |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Rate Limiting
{Describe rate limits if applicable}
- Default: 100 requests per minute per IP
- Authenticated: 1000 requests per minute per user

## Notes
- All timestamps are ISO 8601 format in UTC
- All IDs are UUIDs v4
- Pagination uses cursor-based pagination for list endpoints
