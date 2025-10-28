# Volleyball Workout Plan - API Specification

## Base URL

- **Development:** `http://localhost:8000`
- **Production:** `https://[your-app].deno.dev`

## Authentication

All endpoints except authentication endpoints require JWT Bearer token:

```
Authorization: Bearer <token>
```

**Token Format:** JWT containing user payload:
```json
{
  "userId": "string",
  "email": "string",
  "role": "user" | "admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## HTTP Status Codes

- `200 OK` - Successful GET, PUT, DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `500 Internal Server Error` - Server error

---

## Authentication Endpoints

### POST /api/auth/register

Create a new user account.

**Authentication:** None required

**Request Body:**
```json
{
  "email": "player@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "player@example.com",
      "name": "John Doe",
      "role": "user",
      "createdAt": "2025-01-27T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation:**
- Email must be valid format and unique
- Password minimum 8 characters
- Name required, 1-100 characters

**Errors:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "email": "Email already exists"
    }
  }
}
```

---

### POST /api/auth/login

Authenticate user and receive JWT token.

**Authentication:** None required

**Request Body:**
```json
{
  "email": "player@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "player@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

---

### GET /api/auth/me

Get current authenticated user information.

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "data": {
    "id": "usr_abc123",
    "email": "player@example.com",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2025-01-27T10:00:00.000Z"
  }
}
```

---

## Exercise Endpoints

### GET /api/exercises

List all exercises with optional filtering.

**Authentication:** Required

**Query Parameters:**
- `skill` (optional): Filter by skill category - `agility`, `hitting`, `blocking`, `serving`, `setting`, `defensive_skills`
- `difficulty` (optional): Filter by difficulty - `easy`, `medium`, `hard`
- `page` (optional): Page number, default `1`
- `limit` (optional): Items per page, default `50`, max `100`

**Example Request:**
```
GET /api/exercises?skill=agility&difficulty=easy&page=1&limit=20
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "ex_abc123",
      "name": "Ladder Drills - Basic",
      "description": "Footwork fundamentals using agility ladder",
      "durationMinutes": 15,
      "difficulty": "easy",
      "skillCategories": ["agility"],
      "instructions": "Set up ladder on court. Perform 5 different footwork patterns: in-and-out, side-shuffle, crossover, hop-scotch, and icky-shuffle. 2 sets each.",
      "videoUrl": "https://example.com/videos/ladder-basic",
      "createdAt": "2025-01-20T10:00:00.000Z"
    },
    {
      "id": "ex_def456",
      "name": "Wall Touches",
      "description": "Quick explosive movements and touches",
      "durationMinutes": 10,
      "difficulty": "easy",
      "skillCategories": ["agility", "blocking"],
      "instructions": "Touch wall at maximum height, step back, repeat. 3 sets of 15 reps.",
      "createdAt": "2025-01-20T10:05:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "totalPages": 3
  }
}
```

---

### GET /api/exercises/:id

Get a single exercise by ID.

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "data": {
    "id": "ex_abc123",
    "name": "Ladder Drills - Basic",
    "description": "Footwork fundamentals using agility ladder",
    "durationMinutes": 15,
    "difficulty": "easy",
    "skillCategories": ["agility"],
    "instructions": "Set up ladder on court. Perform 5 different footwork patterns...",
    "videoUrl": "https://example.com/videos/ladder-basic",
    "createdAt": "2025-01-20T10:00:00.000Z"
  }
}
```

**Errors:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Exercise not found"
  }
}
```

---

### POST /api/exercises

Create a new exercise (admin only).

**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "name": "Spike Approach Repetition",
  "description": "Practice 4-step spike approach technique",
  "durationMinutes": 20,
  "difficulty": "medium",
  "skillCategories": ["hitting", "agility"],
  "instructions": "Mark approach line. Practice left-right-left-jump pattern. Focus on arm swing timing. 50 reps.",
  "videoUrl": "https://example.com/videos/spike-approach"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "ex_new789",
    "name": "Spike Approach Repetition",
    "description": "Practice 4-step spike approach technique",
    "durationMinutes": 20,
    "difficulty": "medium",
    "skillCategories": ["hitting", "agility"],
    "instructions": "Mark approach line. Practice left-right-left-jump pattern...",
    "videoUrl": "https://example.com/videos/spike-approach",
    "createdAt": "2025-01-27T14:30:00.000Z"
  }
}
```

**Validation:**
- Name required, 3-200 characters
- Description required, 10-500 characters
- Duration 1-180 minutes
- Difficulty must be: `easy`, `medium`, or `hard`
- At least one skill category required
- Video URL must be valid URL (optional)

---

### PUT /api/exercises/:id

Update an existing exercise (admin only).

**Authentication:** Required (Admin role)

**Request Body:** (all fields optional)
```json
{
  "name": "Spike Approach Repetition - Advanced",
  "durationMinutes": 25,
  "difficulty": "hard"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "ex_new789",
    "name": "Spike Approach Repetition - Advanced",
    "description": "Practice 4-step spike approach technique",
    "durationMinutes": 25,
    "difficulty": "hard",
    "skillCategories": ["hitting", "agility"],
    "instructions": "Mark approach line. Practice left-right-left-jump pattern...",
    "videoUrl": "https://example.com/videos/spike-approach",
    "createdAt": "2025-01-27T14:30:00.000Z"
  }
}
```

---

### DELETE /api/exercises/:id

Delete an exercise (admin only).

**Authentication:** Required (Admin role)

**Response:** `200 OK`
```json
{
  "data": {
    "message": "Exercise deleted successfully"
  }
}
```

**Note:** Should prevent deletion if exercise is referenced in active workout plans.

---

## Workout Plan Endpoints

### GET /api/workout-plans

List all workout plans for the authenticated user.

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status - `active`, `completed`, `paused`
- `skill` (optional): Filter by skill category
- `page` (optional): Page number, default `1`
- `limit` (optional): Items per page, default `50`, max `100`
- `sort` (optional): Sort field - `createdAt`, `startDate`, `skillFocus`, default `createdAt`
- `order` (optional): Sort order - `asc`, `desc`, default `desc`

**Example Request:**
```
GET /api/workout-plans?status=active&sort=createdAt&order=desc
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "wp_xyz789",
      "userId": "usr_abc123",
      "skillFocus": "agility",
      "durationWeeks": 4,
      "trainingDays": ["monday", "wednesday", "friday"],
      "exerciseIds": ["ex_abc123", "ex_def456", "ex_ghi789"],
      "status": "active",
      "createdAt": "2025-01-27T10:00:00.000Z",
      "startDate": "2025-01-29T00:00:00.000Z",
      "endDate": "2025-02-26T00:00:00.000Z",
      "totalSessions": 12,
      "completedSessions": 5,
      "progressPercentage": 41.67
    },
    {
      "id": "wp_abc456",
      "userId": "usr_abc123",
      "skillFocus": "serving",
      "durationWeeks": 2,
      "trainingDays": ["tuesday", "thursday"],
      "exerciseIds": ["ex_serve1", "ex_serve2"],
      "status": "completed",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "startDate": "2025-01-16T00:00:00.000Z",
      "endDate": "2025-01-30T00:00:00.000Z",
      "totalSessions": 4,
      "completedSessions": 4,
      "progressPercentage": 100
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 2,
    "totalPages": 1
  }
}
```

---

### GET /api/workout-plans/:id

Get a single workout plan with full details.

**Authentication:** Required (must be plan owner)

**Response:** `200 OK`
```json
{
  "data": {
    "id": "wp_xyz789",
    "userId": "usr_abc123",
    "skillFocus": "agility",
    "durationWeeks": 4,
    "trainingDays": ["monday", "wednesday", "friday"],
    "exerciseIds": ["ex_abc123", "ex_def456", "ex_ghi789"],
    "exercises": [
      {
        "id": "ex_abc123",
        "name": "Ladder Drills - Basic",
        "description": "Footwork fundamentals",
        "durationMinutes": 15,
        "difficulty": "easy"
      },
      {
        "id": "ex_def456",
        "name": "Wall Touches",
        "description": "Quick explosive movements",
        "durationMinutes": 10,
        "difficulty": "easy"
      },
      {
        "id": "ex_ghi789",
        "name": "Cone Drills",
        "description": "Change of direction training",
        "durationMinutes": 20,
        "difficulty": "medium"
      }
    ],
    "status": "active",
    "createdAt": "2025-01-27T10:00:00.000Z",
    "startDate": "2025-01-29T00:00:00.000Z",
    "endDate": "2025-02-26T00:00:00.000Z",
    "totalSessions": 12,
    "completedSessions": 5,
    "progressPercentage": 41.67,
    "estimatedSessionDuration": 45
  }
}
```

**Errors:**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this workout plan"
  }
}
```

---

### POST /api/workout-plans

Create a new workout plan.

**Authentication:** Required

**Request Body:**
```json
{
  "skillFocus": "agility",
  "durationWeeks": 4,
  "trainingDays": ["monday", "wednesday", "friday"],
  "exerciseIds": ["ex_abc123", "ex_def456", "ex_ghi789"],
  "startDate": "2025-01-29T00:00:00.000Z"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "wp_xyz789",
    "userId": "usr_abc123",
    "skillFocus": "agility",
    "durationWeeks": 4,
    "trainingDays": ["monday", "wednesday", "friday"],
    "exerciseIds": ["ex_abc123", "ex_def456", "ex_ghi789"],
    "status": "active",
    "createdAt": "2025-01-27T10:00:00.000Z",
    "startDate": "2025-01-29T00:00:00.000Z",
    "endDate": "2025-02-26T00:00:00.000Z",
    "totalSessions": 12,
    "completedSessions": 0,
    "progressPercentage": 0
  }
}
```

**Validation:**
- `skillFocus` required, must be valid enum value
- `durationWeeks` required, must be: 1, 2, 3, 4, 6, 8, or 12
- `trainingDays` required, array with at least 1 day, max 7 unique days
- `exerciseIds` optional, array of valid exercise IDs
- `startDate` optional, defaults to today if not provided, must be present or future

**Business Logic:**
- Automatically creates training sessions based on schedule
- Calculates `endDate` from `startDate + durationWeeks`
- Calculates `totalSessions` from `durationWeeks × trainingDays.length`
- Sets initial `status` to `active`
- Validates all exercise IDs exist in database

---

### PUT /api/workout-plans/:id

Update an existing workout plan.

**Authentication:** Required (must be plan owner)

**Request Body:** (all fields optional)
```json
{
  "trainingDays": ["monday", "wednesday", "friday", "saturday"],
  "exerciseIds": ["ex_abc123", "ex_def456", "ex_ghi789", "ex_new111"],
  "status": "paused"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "wp_xyz789",
    "userId": "usr_abc123",
    "skillFocus": "agility",
    "durationWeeks": 4,
    "trainingDays": ["monday", "wednesday", "friday", "saturday"],
    "exerciseIds": ["ex_abc123", "ex_def456", "ex_ghi789", "ex_new111"],
    "status": "paused",
    "createdAt": "2025-01-27T10:00:00.000Z",
    "startDate": "2025-01-29T00:00:00.000Z",
    "endDate": "2025-02-26T00:00:00.000Z",
    "totalSessions": 16,
    "completedSessions": 5,
    "progressPercentage": 31.25
  }
}
```

**Business Logic:**
- Changing `trainingDays` or `durationWeeks` recalculates sessions
- Only allows editing if no sessions completed yet (or implement session regeneration)
- Cannot change `skillFocus` (create new plan instead)
- Cannot modify `startDate` once plan is started

---

### DELETE /api/workout-plans/:id

Delete a workout plan and all associated sessions.

**Authentication:** Required (must be plan owner)

**Response:** `200 OK`
```json
{
  "data": {
    "message": "Workout plan and all sessions deleted successfully"
  }
}
```

**Business Logic:**
- Cascades delete to all training sessions
- Cascades delete to all exercise completions
- Requires confirmation if plan has completed sessions

---

### GET /api/workout-plans/:id/sessions

Get all training sessions for a workout plan.

**Authentication:** Required (must be plan owner)

**Query Parameters:**
- `status` (optional): Filter by completion - `completed`, `incomplete`
- `sort` (optional): Sort by - `sessionNumber`, `scheduledDate`, default `sessionNumber`
- `order` (optional): Sort order - `asc`, `desc`, default `asc`

**Example Request:**
```
GET /api/workout-plans/wp_xyz789/sessions?status=incomplete&sort=scheduledDate&order=asc
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "ts_session1",
      "workoutPlanId": "wp_xyz789",
      "sessionNumber": 1,
      "scheduledDate": "2025-01-29T00:00:00.000Z",
      "dayOfWeek": "monday",
      "exerciseIds": ["ex_abc123", "ex_def456", "ex_ghi789"],
      "completed": true,
      "completedAt": "2025-01-29T18:30:00.000Z",
      "estimatedDurationMinutes": 45,
      "actualDurationMinutes": 50,
      "completedExercisesCount": 3,
      "totalExercisesCount": 3
    },
    {
      "id": "ts_session2",
      "workoutPlanId": "wp_xyz789",
      "sessionNumber": 2,
      "scheduledDate": "2025-01-31T00:00:00.000Z",
      "dayOfWeek": "wednesday",
      "exerciseIds": ["ex_abc123", "ex_def456", "ex_ghi789"],
      "completed": false,
      "estimatedDurationMinutes": 45,
      "completedExercisesCount": 0,
      "totalExercisesCount": 3
    }
  ],
  "meta": {
    "total": 12,
    "completed": 5,
    "incomplete": 7
  }
}
```

---

## Training Session Endpoints

### GET /api/training-sessions/:id

Get a single training session with exercise details.

**Authentication:** Required (must be session owner via plan)

**Response:** `200 OK`
```json
{
  "data": {
    "id": "ts_session1",
    "workoutPlanId": "wp_xyz789",
    "sessionNumber": 1,
    "scheduledDate": "2025-01-29T00:00:00.000Z",
    "dayOfWeek": "monday",
    "exerciseIds": ["ex_abc123", "ex_def456", "ex_ghi789"],
    "exercises": [
      {
        "id": "ex_abc123",
        "name": "Ladder Drills - Basic",
        "description": "Footwork fundamentals",
        "durationMinutes": 15,
        "difficulty": "easy",
        "completed": true,
        "completedAt": "2025-01-29T18:15:00.000Z"
      },
      {
        "id": "ex_def456",
        "name": "Wall Touches",
        "description": "Quick explosive movements",
        "durationMinutes": 10,
        "difficulty": "easy",
        "completed": true,
        "completedAt": "2025-01-29T18:25:00.000Z"
      },
      {
        "id": "ex_ghi789",
        "name": "Cone Drills",
        "description": "Change of direction training",
        "durationMinutes": 20,
        "difficulty": "medium",
        "completed": true,
        "completedAt": "2025-01-29T18:45:00.000Z"
      }
    ],
    "completed": true,
    "completedAt": "2025-01-29T18:45:00.000Z",
    "estimatedDurationMinutes": 45,
    "actualDurationMinutes": 50
  }
}
```

---

### PUT /api/training-sessions/:id

Update training session (mark as complete, add duration, etc.).

**Authentication:** Required (must be session owner via plan)

**Request Body:**
```json
{
  "completed": true,
  "actualDurationMinutes": 50
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "ts_session1",
    "workoutPlanId": "wp_xyz789",
    "sessionNumber": 1,
    "scheduledDate": "2025-01-29T00:00:00.000Z",
    "dayOfWeek": "monday",
    "exerciseIds": ["ex_abc123", "ex_def456", "ex_ghi789"],
    "completed": true,
    "completedAt": "2025-01-29T18:45:00.000Z",
    "estimatedDurationMinutes": 45,
    "actualDurationMinutes": 50
  }
}
```

**Business Logic:**
- When marking session as `completed: true`, auto-sets `completedAt` to current timestamp
- When marking session as `completed: false`, clears `completedAt` and all exercise completions
- Updates workout plan's `completedSessions` count and `progressPercentage`

---

### GET /api/training-sessions/:id/completions

Get exercise completions for a training session.

**Authentication:** Required (must be session owner via plan)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "ec_comp1",
      "trainingSessionId": "ts_session1",
      "exerciseId": "ex_abc123",
      "completed": true,
      "completedAt": "2025-01-29T18:15:00.000Z",
      "notes": "Felt great, good form"
    },
    {
      "id": "ec_comp2",
      "trainingSessionId": "ts_session1",
      "exerciseId": "ex_def456",
      "completed": true,
      "completedAt": "2025-01-29T18:25:00.000Z"
    },
    {
      "id": "ec_comp3",
      "trainingSessionId": "ts_session1",
      "exerciseId": "ex_ghi789",
      "completed": false
    }
  ]
}
```

---

### POST /api/training-sessions/:id/completions

Mark an exercise as complete within a session.

**Authentication:** Required (must be session owner via plan)

**Request Body:**
```json
{
  "exerciseId": "ex_abc123",
  "completed": true,
  "notes": "Felt great, good form"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "ec_comp1",
    "trainingSessionId": "ts_session1",
    "exerciseId": "ex_abc123",
    "completed": true,
    "completedAt": "2025-01-29T18:15:00.000Z",
    "notes": "Felt great, good form"
  }
}
```

**Validation:**
- `exerciseId` must be in session's `exerciseIds` array
- `completed` boolean required
- `notes` optional, max 1000 characters

**Business Logic:**
- If all exercises completed, auto-mark session as completed
- Creates or updates existing completion record (upsert)

---

### PUT /api/exercise-completions/:id

Update an existing exercise completion (toggle, add notes).

**Authentication:** Required (must be completion owner via plan)

**Request Body:**
```json
{
  "completed": false,
  "notes": "Need to retry with better form"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "ec_comp1",
    "trainingSessionId": "ts_session1",
    "exerciseId": "ex_abc123",
    "completed": false,
    "completedAt": null,
    "notes": "Need to retry with better form"
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Field-specific error message"
    }
  }
}
```

### Error Codes

**Authentication Errors:**
- `INVALID_CREDENTIALS` - Email/password incorrect
- `UNAUTHORIZED` - Missing or invalid JWT token
- `TOKEN_EXPIRED` - JWT token has expired
- `FORBIDDEN` - Insufficient permissions

**Validation Errors:**
- `VALIDATION_ERROR` - Input validation failed
- `INVALID_FORMAT` - Data format incorrect
- `MISSING_REQUIRED_FIELD` - Required field not provided

**Resource Errors:**
- `NOT_FOUND` - Resource doesn't exist
- `DUPLICATE_RESOURCE` - Resource already exists (e.g., email)
- `CONFLICT` - Resource state conflict

**Server Errors:**
- `INTERNAL_ERROR` - Unexpected server error
- `DATABASE_ERROR` - Database operation failed

### Example Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid workout plan data",
    "details": {
      "durationWeeks": "Must be one of: 1, 2, 3, 4, 6, 8, 12",
      "trainingDays": "At least one day must be selected"
    }
  }
}
```

---

## Request/Response Examples

### Complete Workflow: Creating a Workout Plan

**1. Get exercises for skill category**
```
GET /api/exercises?skill=agility&limit=100
```

**2. Create workout plan**
```
POST /api/workout-plans

{
  "skillFocus": "agility",
  "durationWeeks": 4,
  "trainingDays": ["monday", "wednesday", "friday"],
  "exerciseIds": ["ex_abc123", "ex_def456", "ex_ghi789"],
  "startDate": "2025-01-29T00:00:00.000Z"
}
```

**3. Get plan details with sessions**
```
GET /api/workout-plans/wp_xyz789
GET /api/workout-plans/wp_xyz789/sessions
```

**4. Mark exercise as complete in session**
```
POST /api/training-sessions/ts_session1/completions

{
  "exerciseId": "ex_abc123",
  "completed": true,
  "notes": "Great workout!"
}
```

**5. Mark session as complete**
```
PUT /api/training-sessions/ts_session1

{
  "completed": true,
  "actualDurationMinutes": 50
}
```

---

## Validation Rules

### Workout Plan Validation
- `skillFocus`: Required, must be one of: `agility`, `hitting`, `blocking`, `serving`, `setting`, `defensive_skills`
- `durationWeeks`: Required, must be one of: `1`, `2`, `3`, `4`, `6`, `8`, `12`
- `trainingDays`: Required array, 1-7 unique days, must be valid day names
- `exerciseIds`: Optional array, each ID must reference existing exercise
- `startDate`: Optional ISO date string, must be present or future date

### Exercise Validation
- `name`: Required, 3-200 characters
- `description`: Required, 10-500 characters
- `durationMinutes`: Required, integer 1-180
- `difficulty`: Required, one of: `easy`, `medium`, `hard`
- `skillCategories`: Required array, at least 1 valid skill category
- `instructions`: Optional, max 2000 characters
- `videoUrl`: Optional, valid URL format

### User Validation
- `email`: Required, valid email format, unique
- `password`: Required, minimum 8 characters
- `name`: Required, 1-100 characters

---

## Rate Limiting

**Limits:**
- **Anonymous requests:** 100 requests per hour
- **Authenticated requests:** 1000 requests per hour
- **Plan creation:** 10 plans per hour per user

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1640995200
```

**Rate limit exceeded response:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 3600
  }
}
```

---

## Pagination

All list endpoints support pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)

**Response Meta:**
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 247,
    "totalPages": 5
  }
}
```

---

## CORS Configuration

**Allowed Origins:**
- Development: `http://localhost:3000`
- Production: `https://[your-app].deno.dev`

**Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers:** Authorization, Content-Type

---

## Versioning

**Current Version:** v1 (implicit in base URL)

**Future versioning strategy:** URL-based versioning
- `/api/v1/workout-plans`
- `/api/v2/workout-plans`

For v1, no version prefix is required.
