# API Specification: {Feature Name}

## Base URL
```
Development: http://localhost:8000/api/v1
Production: https://api.example.com/api/v1
```

## Authentication
{Describe if endpoints require authentication: Bearer token, API key, etc.}

## Endpoints

### 1. {Endpoint Name}

**Endpoint**: `{METHOD} /api/v1/resource`

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

**Response 400** (Bad Request):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "field1": "Field is required"
    }
  }
}
```

**Response 401** (Unauthorized):
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Response 404** (Not Found):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

**Response 500** (Server Error):
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

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
