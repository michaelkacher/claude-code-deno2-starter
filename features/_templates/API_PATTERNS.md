# API Patterns Reference

This file contains standard API patterns to reference in feature-specific API specs. **Reference these patterns instead of repeating them** to save tokens.

## Standard Error Responses

All endpoints use these standard error formats. **Reference by pattern name** instead of documenting each error.

### Pattern: `STANDARD_ERRORS`

```json
// 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { "field": "error message" }
  }
}

// 401 Unauthorized
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}

// 403 Forbidden
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}

// 404 Not Found
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}

// 409 Conflict
{
  "error": {
    "code": "CONFLICT",
    "message": "Resource already exists"
  }
}

// 500 Internal Server Error
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Standard Success Patterns

### Pattern: `SINGLE_RESOURCE`
```json
{
  "data": { /* resource object */ }
}
```

### Pattern: `RESOURCE_LIST`
```json
{
  "data": [ /* array of resources */ ],
  "cursor": "next-cursor-token"  // null if no more results
}
```

### Pattern: `NO_CONTENT`
```
204 No Content (empty response body)
```

## CRUD Endpoint Patterns

### Pattern: `CREATE_RESOURCE`

**Endpoint**: `POST /api/{resources}`
**Auth**: Required
**Request**: JSON body with resource fields (omit id, timestamps)
**Success**: 201 with `SINGLE_RESOURCE` response
**Errors**: `STANDARD_ERRORS` (400, 401, 409, 500)

### Pattern: `LIST_RESOURCES`

**Endpoint**: `GET /api/{resources}?limit=10&cursor=abc`
**Auth**: Required/Optional
**Query Params**: `limit` (number, 1-100), `cursor` (string, optional)
**Success**: 200 with `RESOURCE_LIST` response
**Errors**: `STANDARD_ERRORS` (400, 401, 500)

### Pattern: `GET_RESOURCE`

**Endpoint**: `GET /api/{resources}/:id`
**Auth**: Required
**Success**: 200 with `SINGLE_RESOURCE` response
**Errors**: `STANDARD_ERRORS` (401, 404, 500)

### Pattern: `UPDATE_RESOURCE`

**Endpoint**: `PUT /api/{resources}/:id`
**Auth**: Required
**Request**: JSON body with partial resource fields
**Success**: 200 with `SINGLE_RESOURCE` response
**Errors**: `STANDARD_ERRORS` (400, 401, 404, 500)

### Pattern: `DELETE_RESOURCE`

**Endpoint**: `DELETE /api/{resources}/:id`
**Auth**: Required
**Success**: `NO_CONTENT` (204)
**Errors**: `STANDARD_ERRORS` (401, 404, 500)

## Usage in API Specs

Instead of documenting full endpoints, reference patterns:

```markdown
### 1. Create Workout

**Pattern**: `CREATE_RESOURCE` (see API_PATTERNS.md)

**Request Body**:
\`\`\`json
{
  "name": "string (required, 1-100 chars)",
  "exercises": "array (required, 1-50 items)"
}
\`\`\`

**Unique to this endpoint**:
- Validates exercise IDs exist
- Auto-calculates duration based on exercises
```

This saves ~200 tokens per endpoint by referencing patterns instead of repeating them.

## Notes

- All endpoints use consistent response formats
- All timestamps are ISO 8601 in UTC
- All IDs are UUID v4
- Cursor-based pagination for lists (request 1 extra to detect next page)
