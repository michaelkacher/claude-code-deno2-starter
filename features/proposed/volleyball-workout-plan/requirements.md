# Volleyball Workout Plan - Requirements

## Feature Overview

The Volleyball Workout Plan feature allows authenticated users to create personalized volleyball training programs tailored to specific skills (Agility, Hitting, Blocking, Serving, Setting, Defensive Skills). Users can customize their training schedule, select exercises of varying difficulty levels, and track their progress through training sessions over multiple weeks.

This feature implements a 4-screen workflow as defined in the mockup, with full backend API support using Deno KV for data persistence.

## User Stories

### Plan Creation
- As a volleyball player, I want to select a specific skill to focus on so that I can improve targeted aspects of my game
- As a user, I want to customize my training duration (1-12 weeks) so that I can align my workout plan with my schedule
- As a user, I want to select which days of the week I'll train so that I can create a realistic training schedule
- As a user, I want to choose from exercises categorized by difficulty (Easy, Medium, Hard) so that I can match my current fitness level
- As a user, I want to see exercise details (duration, description) before selecting them so that I can make informed choices
- As a user, I want to review my complete training plan before finalizing it so that I can verify all selections

### Plan Management
- As a user, I want to view all my created workout plans so that I can see my training programs
- As a user, I want to delete a workout plan that I no longer need so that I can keep my plan list organized
- As a user, I want to edit my training plan if my schedule or goals change

### Progress Tracking
- As a user, I want to track completed training sessions so that I can monitor my progress
- As a user, I want to check off individual exercises as I complete them during a session
- As a user, I want to see my overall progress (e.g., 5 of 12 sessions completed) so that I stay motivated
- As a user, I want to see which training days I have completed and which are upcoming

### Authentication
- As a user, I must be logged in to create, view, or manage workout plans so that my data is secure and personalized
- As a user, I should only be able to access my own workout plans so that my training data remains private

## Functional Requirements

### Authentication & Authorization
- User must be authenticated to access any workout plan functionality
- Users can only view, edit, and delete their own workout plans
- JWT-based authentication following existing system patterns
- All API endpoints require valid authentication token

### Screen 1: Skill Focus Selection
- Display 6 skill categories with icons and descriptions:
  - Agility: Speed and movement training
  - Hitting: Spike power and technique
  - Blocking: Net defense and timing
  - Serving: Accuracy and power serves
  - Setting: Precision and hand positioning
  - Defensive Skills: Digging and receiving
- User selects exactly one skill focus
- Visual feedback on selection (hover/tap states)
- Continue button enabled only after selection
- Navigation to Screen 2 on continue

### Screen 2: Training Schedule Configuration
- Display selected skill focus at top of screen
- **Week Duration Selection:**
  - Dropdown with options: 1, 2, 3, 4, 6, 8, 12 weeks
  - Default: 4 weeks
  - Single selection required
- **Training Days Selection:**
  - Toggle buttons for each day of week (Mon-Sun)
  - Default pre-selected: Monday, Wednesday, Friday
  - Multiple selections allowed (minimum 1 day)
  - Counter displays total days selected (e.g., "Selected: 3 days per week")
- Back button returns to Screen 1 with data preserved
- Continue button enabled only after valid selections
- Navigation to Screen 3 on continue

### Screen 3: Exercise Selection
- Display selected skill focus, duration, and schedule at top
- **Exercise List:**
  - Exercises grouped by difficulty: Easy, Medium, Hard
  - Clear visual hierarchy with section headers
  - Each exercise shows:
    - Name
    - Estimated duration (minutes)
    - Brief description
    - Checkbox for selection
  - Scrollable list to accommodate all exercises
- **Exercise Selection:**
  - Multiple exercises can be selected across all difficulty levels
  - No minimum or maximum selection required (flexible)
  - Counter at bottom shows total exercises selected
- **Exercise Data:**
  - Exercises stored in database (not hardcoded)
  - Each exercise associated with one or more skill categories
  - Difficulty level stored with each exercise
- Back button returns to Screen 2 with data preserved
- Create Plan button enabled regardless of selections (allows empty plans)
- Navigation to Screen 4 on Create Plan

### Screen 4: Plan Summary & Confirmation
- **Display Summary:**
  - Skill focus with icon
  - Training duration (X weeks)
  - Training days (full day names)
  - Selected exercises grouped by difficulty level
  - Count of exercises in each difficulty category
  - Estimated training time per session (calculated from exercise durations)
  - Total number of training sessions (weeks × days per week)
- **Actions:**
  - Edit Plan button: Returns to Screen 1 with all data preserved
  - Start Training button: Saves plan and navigates to plan detail/dashboard
- **Data Persistence:**
  - On "Start Training", create workout plan in database
  - Generate individual training session records based on schedule
  - Initialize progress tracking for all sessions
  - Assign created plan to authenticated user

### Workout Plan Management Dashboard
- List view of all user's workout plans
- Display for each plan:
  - Skill focus
  - Duration (X weeks)
  - Training days
  - Progress indicator (X of Y sessions completed)
  - Created date
  - Status (active, completed, paused)
- Actions per plan:
  - View Details
  - Delete (with confirmation)
  - Edit (navigate to creation flow with pre-filled data)
- Filter/sort options:
  - By skill focus
  - By status
  - By creation date
  - By progress

### Progress Tracking
- **Session View:**
  - Display all sessions for a workout plan
  - Show date and day of week for each session
  - Mark sessions as completed/incomplete
  - Check off individual exercises within a session
- **Progress Indicators:**
  - Overall progress: X of Y sessions completed
  - Per-session progress: X of Y exercises completed
  - Visual progress bar or percentage
- **Session Completion:**
  - Mark entire session as complete
  - Mark individual exercises as complete within session
  - Track completion timestamps
  - Calculate estimated vs actual session duration

### Exercise Management (Admin/Future)
- CRUD operations for exercises
- Associate exercises with skill categories
- Set difficulty levels
- Define exercise metadata (duration, description, instructions)

## Data Requirements

### Entities

#### User
```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Unique
  passwordHash: string;          // Hashed password
  name: string;                  // Display name
  createdAt: Date;
  role: 'user' | 'admin';
}
```

#### WorkoutPlan
```typescript
interface WorkoutPlan {
  id: string;                    // UUID
  userId: string;                // FK to User
  skillFocus: SkillCategory;     // Selected skill
  durationWeeks: number;         // 1, 2, 3, 4, 6, 8, or 12
  trainingDays: DayOfWeek[];     // Selected days
  exerciseIds: string[];         // FKs to Exercise
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  startDate: Date;               // When user starts training
  endDate: Date;                 // Calculated: startDate + durationWeeks
  totalSessions: number;         // Calculated: weeks × days.length
}
```

#### Exercise
```typescript
interface Exercise {
  id: string;                    // UUID
  name: string;                  // "Ladder Drills - Basic"
  description: string;           // "Footwork fundamentals"
  durationMinutes: number;       // 15
  difficulty: 'easy' | 'medium' | 'hard';
  skillCategories: SkillCategory[]; // Can belong to multiple
  instructions?: string;         // Detailed instructions (optional)
  videoUrl?: string;             // Tutorial video (optional)
  createdAt: Date;
}
```

#### TrainingSession
```typescript
interface TrainingSession {
  id: string;                    // UUID
  workoutPlanId: string;         // FK to WorkoutPlan
  sessionNumber: number;         // 1, 2, 3... up to totalSessions
  scheduledDate: Date;           // Calculated based on training days
  dayOfWeek: DayOfWeek;          // Mon, Tue, Wed, etc.
  exerciseIds: string[];         // FKs to Exercise (copied from plan)
  completed: boolean;            // Session completion status
  completedAt?: Date;            // When session was marked complete
  estimatedDurationMinutes: number; // Sum of exercise durations
  actualDurationMinutes?: number; // User-reported or tracked
}
```

#### ExerciseCompletion
```typescript
interface ExerciseCompletion {
  id: string;                    // UUID
  trainingSessionId: string;     // FK to TrainingSession
  exerciseId: string;            // FK to Exercise
  completed: boolean;            // Individual exercise completion
  completedAt?: Date;            // Timestamp
  notes?: string;                // User notes (optional)
}
```

### Enumerations

```typescript
type SkillCategory =
  | 'agility'
  | 'hitting'
  | 'blocking'
  | 'serving'
  | 'setting'
  | 'defensive_skills';

type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

type Difficulty = 'easy' | 'medium' | 'hard';

type PlanStatus = 'active' | 'completed' | 'paused';
```

### Relationships

- **User → WorkoutPlan**: One-to-Many (one user has many workout plans)
- **WorkoutPlan → Exercise**: Many-to-Many (plan has many exercises, exercise in many plans)
- **WorkoutPlan → TrainingSession**: One-to-Many (one plan has many sessions)
- **TrainingSession → Exercise**: Many-to-Many (via exerciseIds array)
- **TrainingSession → ExerciseCompletion**: One-to-Many (one session has many exercise completions)
- **Exercise → SkillCategory**: Many-to-Many (exercise can belong to multiple skill categories)

### Deno KV Key Structure

```typescript
// Users
['users', userId]
['users_by_email', email] // Secondary index

// Workout Plans
['workout_plans', workoutPlanId]
['workout_plans_by_user', userId, workoutPlanId] // User's plans index

// Exercises
['exercises', exerciseId]
['exercises_by_skill', skillCategory, exerciseId] // Skill category index
['exercises_by_difficulty', difficulty, exerciseId] // Difficulty index

// Training Sessions
['training_sessions', trainingSessionId]
['training_sessions_by_plan', workoutPlanId, trainingSessionId] // Plan's sessions

// Exercise Completions
['exercise_completions', exerciseCompletionId]
['exercise_completions_by_session', trainingSessionId, exerciseCompletionId]
```

### Data Validation

- Email format validation
- Password strength requirements
- Week duration must be one of: 1, 2, 3, 4, 6, 8, 12
- At least one training day must be selected
- Exercise durations must be positive integers
- Dates must be valid and future dates for scheduled sessions
- Skill category must be one of the defined enum values
- Difficulty must be one of: easy, medium, hard

## Non-Functional Requirements

### Performance
- API response time: < 200ms for CRUD operations
- List workout plans: < 300ms for up to 100 plans per user
- Exercise list loading: < 200ms (cache-friendly)
- Session creation: Batch creation for multiple sessions < 500ms
- Database queries optimized with Deno KV secondary indexes

### Security
- All endpoints require authentication via JWT
- Users can only access their own workout plans and sessions
- Input validation on all API endpoints (use Zod schemas)
- XSS protection: Sanitize user-generated content (notes, names)
- Rate limiting on plan creation (prevent abuse)
- Password hashing using Web Crypto API

### Usability
- Mobile-responsive design (touch-friendly targets)
- Clear visual feedback for all user actions
- Loading states for asynchronous operations
- Error messages that are clear and actionable
- Confirmation dialogs for destructive actions (delete plan)
- Progress indicators for multi-step flows
- Preserve user data when navigating between screens

### Accessibility
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly
- Sufficient color contrast for readability
- Focus indicators for keyboard users

### Scalability
- Support up to 1000 workout plans per user
- Support up to 500 exercises in database
- Support up to 100 training sessions per workout plan
- Efficient querying using Deno KV indexes
- Pagination for large lists (50 items per page)

### Reliability
- Atomic transactions for plan creation (plan + sessions created together)
- Handle concurrent updates gracefully
- Validate data integrity (referential integrity checks)
- Graceful error handling with user-friendly messages
- Rollback mechanisms for failed multi-step operations

## API Requirements

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (returns JWT)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Workout Plan Endpoints
- `GET /api/workout-plans` - List all user's workout plans
- `GET /api/workout-plans/:id` - Get single workout plan
- `POST /api/workout-plans` - Create new workout plan
- `PUT /api/workout-plans/:id` - Update workout plan
- `DELETE /api/workout-plans/:id` - Delete workout plan
- `GET /api/workout-plans/:id/sessions` - Get all sessions for a plan

### Exercise Endpoints
- `GET /api/exercises` - List all exercises (with optional filters: skill, difficulty)
- `GET /api/exercises/:id` - Get single exercise
- `POST /api/exercises` - Create new exercise (admin only)
- `PUT /api/exercises/:id` - Update exercise (admin only)
- `DELETE /api/exercises/:id` - Delete exercise (admin only)

### Training Session Endpoints
- `GET /api/training-sessions/:id` - Get single training session
- `PUT /api/training-sessions/:id` - Update session (mark complete, etc.)
- `GET /api/training-sessions/:id/completions` - Get exercise completions for session
- `POST /api/training-sessions/:id/completions` - Mark exercise as complete
- `PUT /api/exercise-completions/:id` - Update exercise completion

### Query Parameters
- Pagination: `?page=1&limit=50`
- Filtering: `?skill=agility&difficulty=easy`
- Sorting: `?sort=createdAt&order=desc`
- Status filter: `?status=active`

### Response Format
All responses follow standard format:
```typescript
// Success
{
  "data": { /* resource or array */ },
  "meta"?: { /* pagination, etc */ }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly error message",
    "details"?: { /* field-specific errors */ }
  }
}
```

## UI/UX Requirements

### Design System Integration
- Use existing component library and design tokens
- Follow established color scheme and typography
- Consistent button styles and interactions
- Use existing form components (dropdowns, checkboxes, toggles)

### Screen Flow
1. **Skill Selection** → 2. **Schedule Configuration** → 3. **Exercise Selection** → 4. **Summary & Confirmation**
- All screens support back navigation with data preservation
- Progress indicator shows current step (1 of 4, 2 of 4, etc.)
- Cancel option available on all screens (returns to dashboard)

### Responsive Design
- Mobile-first approach (320px+)
- Tablet layout (768px+)
- Desktop layout (1024px+)
- Touch-friendly targets (minimum 44x44px)
- Stacked layout on mobile, grid layout on desktop

### Color Coding
- Easy exercises: Green tones (#4CAF50)
- Medium exercises: Orange tones (#FF9800)
- Hard exercises: Red tones (#F44336)
- Selected items: Primary brand color with checkmark
- Progress indicators: Blue/green gradient

### Loading States
- Skeleton screens for list views
- Spinner for form submissions
- Optimistic UI updates where appropriate
- Disable buttons during async operations

### Empty States
- No workout plans: Call-to-action to create first plan
- No exercises selected: Informative message about flexibility
- Completed plans: Congratulations message with options

### Error States
- Network errors: Retry button
- Validation errors: Inline field errors
- Server errors: User-friendly message with support contact

## Success Criteria

### Functional Completeness
- [ ] All 4 mockup screens implemented and functional
- [ ] User can create workout plan from start to finish
- [ ] User can view all their workout plans
- [ ] User can delete workout plans
- [ ] User can track progress on training sessions
- [ ] Exercise data stored in and retrieved from database
- [ ] Authentication fully integrated

### Technical Requirements
- [ ] All API endpoints implemented and documented
- [ ] Deno KV data model implemented with indexes
- [ ] Input validation using Zod schemas
- [ ] JWT authentication on all protected endpoints
- [ ] Service layer business logic tested (80%+ coverage)
- [ ] Type-safe TypeScript throughout
- [ ] No console errors or warnings

### User Experience
- [ ] Mobile-responsive design works on 320px+ screens
- [ ] All interactive elements have hover/focus states
- [ ] Loading states for all async operations
- [ ] Error messages are clear and actionable
- [ ] Confirmation for destructive actions
- [ ] Data preserved when navigating between screens
- [ ] Smooth transitions and animations

### Performance
- [ ] API responses < 200ms for single resource operations
- [ ] List views load < 300ms with pagination
- [ ] No blocking operations on main thread
- [ ] Images and assets optimized
- [ ] Bundle size kept minimal (Fresh islands architecture)

### Security
- [ ] All endpoints require authentication
- [ ] Users can only access their own data
- [ ] Passwords hashed, never stored in plain text
- [ ] Input sanitization prevents XSS
- [ ] CORS properly configured
- [ ] No sensitive data in client-side code

### Testing
- [ ] Service layer unit tests written and passing
- [ ] Business logic test coverage > 80%
- [ ] Integration tests for data persistence
- [ ] Manual testing of complete user flow
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile device testing (iOS, Android)

### Documentation
- [ ] API specification documented (api-spec.md)
- [ ] Data model documented
- [ ] README with setup instructions
- [ ] Code comments for complex logic
- [ ] User-facing help/instructions (if needed)

### Definition of Done
A feature is complete when:
1. All success criteria checkboxes are marked complete
2. Code reviewed and approved
3. All tests passing
4. Deployed to staging environment
5. User acceptance testing completed
6. Documentation updated
7. No critical or high-priority bugs
