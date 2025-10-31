# OpenAPI Documentation

This project includes a comprehensive OpenAPI 3.1 specification for all API endpoints.

## Accessing the Documentation

Once the server is running, you can access the API documentation at:

### Swagger UI
**URL**: http://localhost:8000/api/docs

Interactive documentation with a "Try it out" feature that lets you test API endpoints directly from your browser.

Features:
- Interactive endpoint testing
- Request/response examples
- Schema definitions
- Authentication support
- Filter and search capabilities

### ReDoc
**URL**: http://localhost:8000/api/redoc

Clean, responsive documentation with excellent readability and navigation.

Features:
- Clean, three-panel design
- Excellent for complex APIs
- Better for reading than testing
- Mobile-friendly

### OpenAPI Specification (JSON)
**URL**: http://localhost:8000/api/openapi.json

Raw OpenAPI 3.1 specification in JSON format. Use this to:
- Import into API testing tools (Postman, Insomnia, etc.)
- Generate client SDKs
- Integrate with CI/CD pipelines
- Share with API consumers

## OpenAPI File Structure

The OpenAPI specification is located at:
```
backend/openapi.json
```

### Key Components

#### 1. **Info Section**
Metadata about the API including version, description, and contact information.

#### 2. **Servers**
Defines available server environments:
- Local development: `http://localhost:8000`
- Custom server URLs with variables

#### 3. **Paths**
All API endpoints with:
- HTTP methods (GET, POST, PUT, DELETE, etc.)
- Request parameters and body schemas
- Response schemas for all status codes
- Examples for requests and responses

#### 4. **Components**
Reusable definitions:

##### Schemas
- `ApiInfo` - API information response
- `HealthCheck` - Health check response
- `ApiResponse` - Standard success response wrapper
- `Error` - Standard error response
- `User` - User entity
- `CreateUserInput` - User creation input
- `PaginationParams` - Pagination query parameters
- `SortParams` - Sorting query parameters

##### Responses
Pre-defined error responses:
- `BadRequest` (400) - Validation errors
- `Unauthorized` (401) - Authentication required
- `Forbidden` (403) - Insufficient permissions
- `NotFound` (404) - Resource not found
- `Conflict` (409) - Resource already exists
- `InternalServerError` (500) - Unexpected errors

##### Parameters
Reusable query parameters:
- `PageParam` - Page number
- `LimitParam` - Items per page
- `SortByParam` - Sort field
- `SortOrderParam` - Sort direction

##### Security Schemes
- `bearerAuth` - JWT Bearer token authentication

## Updating the OpenAPI Specification

### When Adding New Endpoints

1. **Define the path** in the `paths` section:
```json
"/api/users": {
  "get": {
    "tags": ["users"],
    "summary": "List all users",
    "operationId": "listUsers",
    "parameters": [
      { "$ref": "#/components/parameters/PageParam" },
      { "$ref": "#/components/parameters/LimitParam" }
    ],
    "responses": {
      "200": {
        "description": "Users retrieved successfully",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "data": {
                  "type": "array",
                  "items": { "$ref": "#/components/schemas/User" }
                },
                "meta": { "$ref": "#/components/schemas/ResponseMeta" }
              }
            }
          }
        }
      },
      "401": { "$ref": "#/components/responses/Unauthorized" }
    },
    "security": [{ "bearerAuth": [] }]
  }
}
```

2. **Add schemas** for new entities in `components.schemas`
3. **Add tags** if introducing new endpoint groups
4. **Update examples** to reflect real-world usage

### Best Practices

1. **Use References**: Reuse schemas, responses, and parameters with `$ref`
2. **Add Examples**: Include realistic examples for all requests and responses
3. **Document Errors**: Define all possible error responses for each endpoint
4. **Keep in Sync**: Update the spec whenever you modify endpoints
5. **Validate**: Use OpenAPI validators to ensure spec correctness

## Tools and Integration

### Import into Postman
1. Open Postman
2. Click "Import" → "Link"
3. Enter: `http://localhost:8000/api/openapi.json`
4. Postman will create a collection with all endpoints

### Import into Insomnia
1. Open Insomnia
2. Click "Create" → "Import From" → "URL"
3. Enter: `http://localhost:8000/api/openapi.json`

### Generate Client SDK
Use OpenAPI Generator to create client libraries:

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:8000/api/openapi.json \
  -g typescript-fetch \
  -o ./generated/client

# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:8000/api/openapi.json \
  -g python \
  -o ./generated/python-client
```

### Validate Spec
```bash
# Using Swagger CLI
npx @apidevtools/swagger-cli validate backend/openapi.json

# Using Redocly CLI
npx @redocly/cli lint backend/openapi.json
```

## Standard API Patterns

This API follows consistent patterns documented in `features/_templates/API_PATTERNS.md`:

### Response Formats

**Single Resource**:
```json
{
  "data": { "id": "123", "name": "John" }
}
```

**Resource List**:
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

**Error**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { "email": "Invalid format" }
  }
}
```

### Status Codes

- `200` - Success (GET, PUT, PATCH)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (auth required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Maintaining Documentation

### Automated Updates
Consider using these tools to keep OpenAPI spec in sync with code:

1. **Zod to OpenAPI**: Generate schemas from Zod validators
2. **TypeScript to OpenAPI**: Generate from TypeScript types
3. **Runtime Generation**: Use Hono's OpenAPI middleware

### Manual Updates Checklist
When adding/modifying endpoints:
- [ ] Update `paths` section with new/modified endpoints
- [ ] Add/update schemas in `components.schemas`
- [ ] Add request/response examples
- [ ] Document all possible error responses
- [ ] Update tags if needed
- [ ] Test in Swagger UI
- [ ] Validate spec with linter

## Additional Resources

- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [ReDoc Documentation](https://redocly.com/docs/redoc/)
- [OpenAPI Generator](https://openapi-generator.tech/)
