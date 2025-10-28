# Volleyball Workout Plan - Data Models

## TypeScript Interfaces

### User

```typescript
interface User {
  id: string;                    // UUID format: usr_[alphanumeric]
  email: string;                 // Unique email address
  passwordHash: string;          // Hashed using Web Crypto API
  name: string;                  // Display name
  role: UserRole;                // 'user' | 'admin'
  createdAt: Date;               // Account creation timestamp
}
```

**Example:**
```typescript
{
  id: "usr_abc123xyz",
  email: "player@example.com",
  passwordHash: "$2a$10$...",
  name: "John Doe",
  role: "user",
  createdAt: new Date("2025-01-27T10:00:00.000Z")
}
```

---

### WorkoutPlan

```typescript
interface WorkoutPlan {
  id: string;                    // UUID format: wp_[alphanumeric]
  userId: string;                // FK to User
  skillFocus: SkillCategory;     // Selected skill category
  durationWeeks: DurationWeeks;  // 1, 2, 3, 4, 6, 8, or 12
  trainingDays: DayOfWeek[];     // Array of selected days
  exerciseIds: string[];         // FKs to Exercise (can be empty)
  status: PlanStatus;            // 'active' | 'completed' | 'paused'
  createdAt: Date;               // Plan creation timestamp
  startDate: Date;               // When user starts training
  endDate: Date;                 // Calculated: startDate + durationWeeks
  totalSessions: number;         // Calculated: weeks × days.length
}
```

**Calculated Fields (not stored, computed on retrieval):**
```typescript
interface WorkoutPlanWithStats extends WorkoutPlan {
  completedSessions: number;     // Count from TrainingSession
  progressPercentage: number;    // (completedSessions / totalSessions) × 100
  estimatedSessionDuration: number; // Sum of exercise durations
}
```

**Example:**
```typescript
{
  id: "wp_xyz789abc",
  userId: "usr_abc123xyz",
  skillFocus: "agility",
  durationWeeks: 4,
  trainingDays: ["monday", "wednesday", "friday"],
  exerciseIds: ["ex_abc123", "ex_def456", "ex_ghi789"],
  status: "active",
  createdAt: new Date("2025-01-27T10:00:00.000Z"),
  startDate: new Date("2025-01-29T00:00:00.000Z"),
  endDate: new Date("2025-02-26T00:00:00.000Z"),
  totalSessions: 12
}
```

---

### Exercise

```typescript
interface Exercise {
  id: string;                    // UUID format: ex_[alphanumeric]
  name: string;                  // Exercise name
  description: string;           // Brief description
  durationMinutes: number;       // Estimated duration in minutes
  difficulty: Difficulty;        // 'easy' | 'medium' | 'hard'
  skillCategories: SkillCategory[]; // Can belong to multiple skills
  instructions?: string;         // Detailed instructions (optional)
  videoUrl?: string;             // Tutorial video URL (optional)
  createdAt: Date;               // Exercise creation timestamp
}
```

**Example:**
```typescript
{
  id: "ex_abc123def",
  name: "Ladder Drills - Basic",
  description: "Footwork fundamentals using agility ladder",
  durationMinutes: 15,
  difficulty: "easy",
  skillCategories: ["agility"],
  instructions: "Set up ladder on court. Perform 5 different footwork patterns: in-and-out, side-shuffle, crossover, hop-scotch, and icky-shuffle. 2 sets each.",
  videoUrl: "https://example.com/videos/ladder-basic",
  createdAt: new Date("2025-01-20T10:00:00.000Z")
}
```

---

### TrainingSession

```typescript
interface TrainingSession {
  id: string;                    // UUID format: ts_[alphanumeric]
  workoutPlanId: string;         // FK to WorkoutPlan
  sessionNumber: number;         // Sequential: 1, 2, 3... up to totalSessions
  scheduledDate: Date;           // Calculated based on training days
  dayOfWeek: DayOfWeek;          // Day this session is scheduled
  exerciseIds: string[];         // FKs to Exercise (copied from plan)
  completed: boolean;            // Session completion status
  completedAt?: Date;            // When session was marked complete (optional)
  estimatedDurationMinutes: number; // Sum of exercise durations
  actualDurationMinutes?: number; // User-reported duration (optional)
}
```

**Calculated Fields (not stored, computed on retrieval):**
```typescript
interface TrainingSessionWithStats extends TrainingSession {
  completedExercisesCount: number;  // Count from ExerciseCompletion
  totalExercisesCount: number;      // exerciseIds.length
}
```

**Example:**
```typescript
{
  id: "ts_session123",
  workoutPlanId: "wp_xyz789abc",
  sessionNumber: 1,
  scheduledDate: new Date("2025-01-29T00:00:00.000Z"),
  dayOfWeek: "monday",
  exerciseIds: ["ex_abc123", "ex_def456", "ex_ghi789"],
  completed: true,
  completedAt: new Date("2025-01-29T18:30:00.000Z"),
  estimatedDurationMinutes: 45,
  actualDurationMinutes: 50
}
```

---

### ExerciseCompletion

```typescript
interface ExerciseCompletion {
  id: string;                    // UUID format: ec_[alphanumeric]
  trainingSessionId: string;     // FK to TrainingSession
  exerciseId: string;            // FK to Exercise
  completed: boolean;            // Individual exercise completion
  completedAt?: Date;            // Timestamp when marked complete (optional)
  notes?: string;                // User notes (optional)
}
```

**Example:**
```typescript
{
  id: "ec_comp123abc",
  trainingSessionId: "ts_session123",
  exerciseId: "ex_abc123",
  completed: true,
  completedAt: new Date("2025-01-29T18:15:00.000Z"),
  notes: "Felt great, maintained good form throughout"
}
```

---

## Enums and Types

### SkillCategory

```typescript
enum SkillCategory {
  AGILITY = 'agility',
  HITTING = 'hitting',
  BLOCKING = 'blocking',
  SERVING = 'serving',
  SETTING = 'setting',
  DEFENSIVE_SKILLS = 'defensive_skills'
}

// Type alternative
type SkillCategory =
  | 'agility'
  | 'hitting'
  | 'blocking'
  | 'serving'
  | 'setting'
  | 'defensive_skills';
```

**Display Labels:**
```typescript
const SKILL_LABELS: Record<SkillCategory, string> = {
  agility: 'Agility',
  hitting: 'Hitting',
  blocking: 'Blocking',
  serving: 'Serving',
  setting: 'Setting',
  defensive_skills: 'Defensive Skills'
};

const SKILL_DESCRIPTIONS: Record<SkillCategory, string> = {
  agility: 'Speed and movement training',
  hitting: 'Spike power and technique',
  blocking: 'Net defense and timing',
  serving: 'Accuracy and power serves',
  setting: 'Precision and hand positioning',
  defensive_skills: 'Digging and receiving'
};
```

---

### DayOfWeek

```typescript
enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

// Type alternative
type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';
```

**Utilities:**
```typescript
const DAYS_ORDER: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday',
  'friday', 'saturday', 'sunday'
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

const DAY_ABBREVIATIONS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};
```

---

### Difficulty

```typescript
enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

// Type alternative
type Difficulty = 'easy' | 'medium' | 'hard';
```

**Display Configuration:**
```typescript
const DIFFICULTY_CONFIG = {
  easy: {
    label: 'Easy',
    color: '#4CAF50',    // Green
    description: 'Beginner-friendly exercises'
  },
  medium: {
    label: 'Medium',
    color: '#FF9800',    // Orange
    description: 'Intermediate challenge'
  },
  hard: {
    label: 'Hard',
    color: '#F44336',    // Red
    description: 'Advanced and demanding'
  }
};
```

---

### PlanStatus

```typescript
enum PlanStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused'
}

// Type alternative
type PlanStatus = 'active' | 'completed' | 'paused';
```

---

### DurationWeeks

```typescript
type DurationWeeks = 1 | 2 | 3 | 4 | 6 | 8 | 12;

const DURATION_OPTIONS: DurationWeeks[] = [1, 2, 3, 4, 6, 8, 12];
```

---

### UserRole

```typescript
enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

// Type alternative
type UserRole = 'user' | 'admin';
```

---

## Deno KV Keys Structure

### Users

```typescript
// Primary keys
['users', userId]                          // User by ID
→ User

// Secondary indexes
['users_by_email', email]                  // Email lookup
→ { userId: string }
```

**Example:**
```typescript
// Store user
await kv.set(['users', 'usr_abc123'], {
  id: 'usr_abc123',
  email: 'player@example.com',
  // ... rest of user data
});

// Create email index
await kv.set(['users_by_email', 'player@example.com'], {
  userId: 'usr_abc123'
});

// Retrieve by email
const emailEntry = await kv.get(['users_by_email', 'player@example.com']);
const userId = emailEntry.value?.userId;
const user = await kv.get(['users', userId]);
```

---

### Workout Plans

```typescript
// Primary keys
['workout_plans', workoutPlanId]           // Plan by ID
→ WorkoutPlan

// Secondary indexes
['workout_plans_by_user', userId, workoutPlanId]  // User's plans
→ WorkoutPlan (denormalized for performance)

['workout_plans_by_status', userId, status, workoutPlanId]  // Filter by status
→ WorkoutPlan (denormalized)

['workout_plans_by_skill', userId, skillFocus, workoutPlanId]  // Filter by skill
→ WorkoutPlan (denormalized)
```

**Example Query Patterns:**
```typescript
// Get all plans for a user
const entries = kv.list({ prefix: ['workout_plans_by_user', userId] });

// Get active plans for a user
const entries = kv.list({
  prefix: ['workout_plans_by_status', userId, 'active']
});

// Get agility plans for a user
const entries = kv.list({
  prefix: ['workout_plans_by_skill', userId, 'agility']
});
```

---

### Exercises

```typescript
// Primary keys
['exercises', exerciseId]                  // Exercise by ID
→ Exercise

// Secondary indexes
['exercises_by_skill', skillCategory, exerciseId]  // Filter by skill
→ Exercise (denormalized)

['exercises_by_difficulty', difficulty, exerciseId]  // Filter by difficulty
→ Exercise (denormalized)

['exercises_by_skill_and_difficulty', skillCategory, difficulty, exerciseId]
→ Exercise (denormalized, for combined filters)
```

**Example Query Patterns:**
```typescript
// Get all agility exercises
const entries = kv.list({ prefix: ['exercises_by_skill', 'agility'] });

// Get easy exercises
const entries = kv.list({ prefix: ['exercises_by_difficulty', 'easy'] });

// Get easy agility exercises
const entries = kv.list({
  prefix: ['exercises_by_skill_and_difficulty', 'agility', 'easy']
});
```

---

### Training Sessions

```typescript
// Primary keys
['training_sessions', trainingSessionId]   // Session by ID
→ TrainingSession

// Secondary indexes
['training_sessions_by_plan', workoutPlanId, sessionNumber, trainingSessionId]
→ TrainingSession (denormalized, ordered by session number)

['training_sessions_by_date', workoutPlanId, scheduledDate, trainingSessionId]
→ TrainingSession (denormalized, ordered by date)
```

**Example Query Patterns:**
```typescript
// Get all sessions for a plan (ordered by session number)
const entries = kv.list({
  prefix: ['training_sessions_by_plan', workoutPlanId]
});

// Get sessions by scheduled date
const entries = kv.list({
  prefix: ['training_sessions_by_date', workoutPlanId]
});
```

---

### Exercise Completions

```typescript
// Primary keys
['exercise_completions', exerciseCompletionId]  // Completion by ID
→ ExerciseCompletion

// Secondary indexes
['exercise_completions_by_session', trainingSessionId, exerciseId]
→ ExerciseCompletion (denormalized, unique per session+exercise)
```

**Example Query Patterns:**
```typescript
// Get all completions for a session
const entries = kv.list({
  prefix: ['exercise_completions_by_session', trainingSessionId]
});

// Get specific exercise completion in session
const entry = await kv.get([
  'exercise_completions_by_session',
  trainingSessionId,
  exerciseId
]);
```

---

## Validation Schemas (Zod)

### User Schemas

```typescript
import { z } from "zod";

export const UserCreateSchema = z.object({
  email: z.string()
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, "Password must be at least 8 characters"),
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .trim()
});

export const UserLoginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, "Password is required")
});

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['user', 'admin']),
  createdAt: z.date()
});
```

---

### Workout Plan Schemas

```typescript
export const WorkoutPlanCreateSchema = z.object({
  skillFocus: z.enum([
    'agility', 'hitting', 'blocking',
    'serving', 'setting', 'defensive_skills'
  ], {
    errorMap: () => ({ message: "Invalid skill category" })
  }),
  durationWeeks: z.union([
    z.literal(1), z.literal(2), z.literal(3), z.literal(4),
    z.literal(6), z.literal(8), z.literal(12)
  ], {
    errorMap: () => ({ message: "Duration must be 1, 2, 3, 4, 6, 8, or 12 weeks" })
  }),
  trainingDays: z.array(
    z.enum([
      'monday', 'tuesday', 'wednesday', 'thursday',
      'friday', 'saturday', 'sunday'
    ])
  )
    .min(1, "At least one training day must be selected")
    .max(7, "Cannot select more than 7 days")
    .refine(
      (days) => new Set(days).size === days.length,
      { message: "Training days must be unique" }
    ),
  exerciseIds: z.array(z.string())
    .optional()
    .default([]),
  startDate: z.string()
    .datetime()
    .optional()
    .transform((val) => val ? new Date(val) : new Date())
    .refine(
      (date) => date >= new Date(new Date().setHours(0, 0, 0, 0)),
      { message: "Start date must be today or in the future" }
    )
});

export const WorkoutPlanUpdateSchema = z.object({
  trainingDays: z.array(
    z.enum([
      'monday', 'tuesday', 'wednesday', 'thursday',
      'friday', 'saturday', 'sunday'
    ])
  )
    .min(1)
    .max(7)
    .refine((days) => new Set(days).size === days.length)
    .optional(),
  exerciseIds: z.array(z.string()).optional(),
  status: z.enum(['active', 'completed', 'paused']).optional()
});

export const WorkoutPlanResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  skillFocus: z.enum([
    'agility', 'hitting', 'blocking',
    'serving', 'setting', 'defensive_skills'
  ]),
  durationWeeks: z.number(),
  trainingDays: z.array(z.string()),
  exerciseIds: z.array(z.string()),
  status: z.enum(['active', 'completed', 'paused']),
  createdAt: z.date(),
  startDate: z.date(),
  endDate: z.date(),
  totalSessions: z.number()
});
```

---

### Exercise Schemas

```typescript
export const ExerciseCreateSchema = z.object({
  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .max(200, "Name must be less than 200 characters")
    .trim(),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters")
    .trim(),
  durationMinutes: z.number()
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 minute")
    .max(180, "Duration cannot exceed 180 minutes"),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: "Difficulty must be easy, medium, or hard" })
  }),
  skillCategories: z.array(
    z.enum([
      'agility', 'hitting', 'blocking',
      'serving', 'setting', 'defensive_skills'
    ])
  )
    .min(1, "At least one skill category must be selected"),
  instructions: z.string()
    .max(2000, "Instructions must be less than 2000 characters")
    .trim()
    .optional(),
  videoUrl: z.string()
    .url("Must be a valid URL")
    .optional()
});

export const ExerciseUpdateSchema = ExerciseCreateSchema.partial();

export const ExerciseResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  durationMinutes: z.number(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  skillCategories: z.array(z.string()),
  instructions: z.string().optional(),
  videoUrl: z.string().optional(),
  createdAt: z.date()
});
```

---

### Training Session Schemas

```typescript
export const TrainingSessionUpdateSchema = z.object({
  completed: z.boolean(),
  actualDurationMinutes: z.number()
    .int()
    .min(1)
    .max(300)
    .optional()
});

export const TrainingSessionResponseSchema = z.object({
  id: z.string(),
  workoutPlanId: z.string(),
  sessionNumber: z.number(),
  scheduledDate: z.date(),
  dayOfWeek: z.enum([
    'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday'
  ]),
  exerciseIds: z.array(z.string()),
  completed: z.boolean(),
  completedAt: z.date().optional(),
  estimatedDurationMinutes: z.number(),
  actualDurationMinutes: z.number().optional()
});
```

---

### Exercise Completion Schemas

```typescript
export const ExerciseCompletionCreateSchema = z.object({
  exerciseId: z.string(),
  completed: z.boolean(),
  notes: z.string()
    .max(1000, "Notes must be less than 1000 characters")
    .trim()
    .optional()
});

export const ExerciseCompletionUpdateSchema = z.object({
  completed: z.boolean().optional(),
  notes: z.string()
    .max(1000)
    .trim()
    .optional()
});

export const ExerciseCompletionResponseSchema = z.object({
  id: z.string(),
  trainingSessionId: z.string(),
  exerciseId: z.string(),
  completed: z.boolean(),
  completedAt: z.date().optional(),
  notes: z.string().optional()
});
```

---

## Data Relationships

```
User (1) ────────── (N) WorkoutPlan
                        │
                        │ (1)
                        │
                        ├─── (N) TrainingSession
                        │         │
                        │         │ (1)
                        │         │
                        │         └─── (N) ExerciseCompletion
                        │                   │
                        │                   │ (N)
                        │                   │
                        │                   └─── (1) Exercise
                        │
                        │ (N)
                        │
                        └───────── (M) Exercise
```

**Relationship Descriptions:**

1. **User → WorkoutPlan**: One-to-Many
   - One user can have many workout plans
   - Each plan belongs to exactly one user

2. **WorkoutPlan → TrainingSession**: One-to-Many
   - One plan generates multiple training sessions
   - Each session belongs to exactly one plan

3. **WorkoutPlan → Exercise**: Many-to-Many
   - A plan can include multiple exercises (via `exerciseIds`)
   - An exercise can be used in multiple plans

4. **TrainingSession → Exercise**: Many-to-Many
   - A session includes multiple exercises (via `exerciseIds`)
   - An exercise can be in multiple sessions

5. **TrainingSession → ExerciseCompletion**: One-to-Many
   - One session has multiple exercise completion records
   - Each completion belongs to one session

6. **ExerciseCompletion → Exercise**: Many-to-One
   - Multiple completions can reference same exercise
   - Each completion references exactly one exercise

7. **Exercise → SkillCategory**: Many-to-Many
   - An exercise can belong to multiple skill categories
   - A skill category has many exercises

---

## Database Indexes

### Primary Indexes (Built-in)

All Deno KV keys are automatically indexed for exact lookups:
- `['users', userId]`
- `['workout_plans', planId]`
- `['exercises', exerciseId]`
- `['training_sessions', sessionId]`
- `['exercise_completions', completionId]`

### Secondary Indexes (Manual)

**User Indexes:**
- Email lookup: `['users_by_email', email]`

**Workout Plan Indexes:**
- By user: `['workout_plans_by_user', userId, planId]`
- By user + status: `['workout_plans_by_status', userId, status, planId]`
- By user + skill: `['workout_plans_by_skill', userId, skillFocus, planId]`

**Exercise Indexes:**
- By skill category: `['exercises_by_skill', skillCategory, exerciseId]`
- By difficulty: `['exercises_by_difficulty', difficulty, exerciseId]`
- By skill + difficulty: `['exercises_by_skill_and_difficulty', skillCategory, difficulty, exerciseId]`

**Training Session Indexes:**
- By plan + session number: `['training_sessions_by_plan', planId, sessionNumber, sessionId]`
- By plan + date: `['training_sessions_by_date', planId, scheduledDate, sessionId]`

**Exercise Completion Indexes:**
- By session: `['exercise_completions_by_session', sessionId, exerciseId]`

### Index Maintenance Strategy

**Denormalization:** To support efficient queries in Deno KV, data is denormalized across multiple keys. When updating a record, all relevant indexes must be updated atomically using Deno KV transactions.

**Example Transaction:**
```typescript
const atomic = kv.atomic();

// Update primary record
atomic.set(['workout_plans', planId], updatedPlan);

// Update all indexes
atomic.set(['workout_plans_by_user', userId, planId], updatedPlan);
atomic.set(['workout_plans_by_status', userId, plan.status, planId], updatedPlan);
atomic.set(['workout_plans_by_skill', userId, plan.skillFocus, planId], updatedPlan);

const result = await atomic.commit();
```

---

## Migration Notes

### Seeding Exercise Data

Initial exercise data should be seeded via admin endpoint or migration script.

**Example Seed Script:**
```typescript
// backend/scripts/seed-exercises.ts
const exercises = [
  {
    name: "Ladder Drills - Basic",
    description: "Footwork fundamentals using agility ladder",
    durationMinutes: 15,
    difficulty: "easy" as const,
    skillCategories: ["agility" as const],
    instructions: "Set up ladder on court...",
  },
  {
    name: "Wall Touches",
    description: "Quick explosive movements and touches",
    durationMinutes: 10,
    difficulty: "easy" as const,
    skillCategories: ["agility" as const, "blocking" as const],
    instructions: "Touch wall at maximum height...",
  },
  // ... more exercises
];

for (const exerciseData of exercises) {
  const exerciseId = `ex_${crypto.randomUUID().split('-')[0]}`;
  const exercise = { id: exerciseId, ...exerciseData, createdAt: new Date() };

  await createExercise(exercise);
}
```

### Session Generation Algorithm

When a workout plan is created, training sessions are automatically generated:

```typescript
function generateTrainingSessions(plan: WorkoutPlan): TrainingSession[] {
  const sessions: TrainingSession[] = [];
  let sessionNumber = 1;

  const startDate = new Date(plan.startDate);
  const daysPerWeek = plan.trainingDays.length;
  const totalSessions = plan.durationWeeks * daysPerWeek;

  for (let week = 0; week < plan.durationWeeks; week++) {
    for (const dayOfWeek of plan.trainingDays) {
      const scheduledDate = calculateSessionDate(startDate, week, dayOfWeek);

      sessions.push({
        id: `ts_${crypto.randomUUID().split('-')[0]}`,
        workoutPlanId: plan.id,
        sessionNumber,
        scheduledDate,
        dayOfWeek,
        exerciseIds: [...plan.exerciseIds],
        completed: false,
        estimatedDurationMinutes: calculateEstimatedDuration(plan.exerciseIds)
      });

      sessionNumber++;
    }
  }

  return sessions;
}
```

---

## Calculated Fields Guidelines

### Server-Side Calculations

The following fields should be calculated on-the-fly (not stored):

**WorkoutPlan:**
- `completedSessions`: Count completed training sessions
- `progressPercentage`: (completedSessions / totalSessions) × 100
- `estimatedSessionDuration`: Sum of exercise durations

**TrainingSession:**
- `completedExercisesCount`: Count completed exercises in session
- `totalExercisesCount`: Length of exerciseIds array

### Storage Optimizations

**Store:**
- Core entity data
- Foreign keys
- User inputs
- Timestamps

**Calculate:**
- Counts and aggregates
- Percentages
- Derived dates
- Display strings

This reduces storage redundancy and ensures data consistency.

---

## Data Integrity Rules

### Referential Integrity

Deno KV does not enforce foreign key constraints, so application logic must ensure:

1. **Exercise References**: When adding exercises to a plan, verify all `exerciseIds` exist
2. **User References**: When creating a plan, verify `userId` exists
3. **Cascade Deletes**:
   - Deleting a plan → delete all training sessions + exercise completions
   - Deleting a user → delete all workout plans + cascading deletions
4. **Prevent Orphans**: Before deleting an exercise, check if referenced in any active plans

### Data Validation

All data mutations should:
1. Validate against Zod schema
2. Check business rules (e.g., unique emails)
3. Verify authorization (user owns resource)
4. Use atomic transactions for multi-record updates
5. Handle race conditions with Deno KV optimistic locking

### Atomic Operations

Use Deno KV atomic transactions for operations affecting multiple keys:

```typescript
const atomic = kv.atomic()
  .set(['workout_plans', planId], plan)
  .set(['workout_plans_by_user', userId, planId], plan)
  .set(['training_sessions', sessionId], session)
  .set(['training_sessions_by_plan', planId, sessionNumber, sessionId], session);

const result = await atomic.commit();
if (!result.ok) {
  throw new Error("Transaction failed");
}
```

---

## Performance Considerations

### Query Patterns

**Efficient:**
- Direct key lookup: `kv.get(['users', userId])`
- Prefix scans: `kv.list({ prefix: ['workout_plans_by_user', userId] })`

**Inefficient:**
- Full table scans without prefix
- Multiple sequential queries (use batch reads instead)
- Complex filtering client-side (use indexes)

### Pagination

Always paginate list queries to limit memory usage:

```typescript
const entries = kv.list({
  prefix: ['workout_plans_by_user', userId],
  limit: 50
});
```

### Caching Strategy

**Cache candidates:**
- Exercise catalog (changes infrequently)
- User profile (cache for session duration)
- Skill category metadata (static)

**Don't cache:**
- Workout plan progress (changes frequently)
- Training session completions (real-time updates)

---

## Summary

This data model provides:
- ✅ Type-safe TypeScript interfaces
- ✅ Comprehensive Zod validation schemas
- ✅ Efficient Deno KV key structure with secondary indexes
- ✅ Clear data relationships
- ✅ Denormalization strategy for query performance
- ✅ Atomic transaction patterns
- ✅ Migration and seeding guidelines

The design balances Deno KV's key-value architecture with the need for relational-style queries through strategic denormalization and indexing.
