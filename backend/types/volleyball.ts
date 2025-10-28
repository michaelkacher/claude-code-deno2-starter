/**
 * Volleyball Workout Plan Type Definitions
 *
 * TypeScript interfaces and types for the volleyball workout feature
 */

// ============================================================================
// ENUMS AND TYPES
// ============================================================================

export type SkillCategory =
  | 'agility'
  | 'hitting'
  | 'blocking'
  | 'serving'
  | 'setting'
  | 'defensive_skills';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type PlanStatus = 'active' | 'completed' | 'paused';

export type DurationWeeks = 1 | 2 | 3 | 4 | 6 | 8 | 12;

export type UserRole = 'user' | 'admin';

// ============================================================================
// INTERFACES
// ============================================================================

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  difficulty: Difficulty;
  skillCategories: SkillCategory[];
  instructions?: string;
  videoUrl?: string;
  createdAt: Date;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  skillFocus: SkillCategory;
  durationWeeks: DurationWeeks;
  trainingDays: DayOfWeek[];
  exerciseIds: string[];
  status: PlanStatus;
  createdAt: Date;
  startDate: Date;
  endDate: Date;
  totalSessions: number;
}

export interface TrainingSession {
  id: string;
  workoutPlanId: string;
  sessionNumber: number;
  scheduledDate: Date;
  dayOfWeek: DayOfWeek;
  exerciseIds: string[];
  completed: boolean;
  completedAt?: Date;
  estimatedDurationMinutes: number;
  actualDurationMinutes?: number;
}

export interface ExerciseCompletion {
  id: string;
  trainingSessionId: string;
  exerciseId: string;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}

// ============================================================================
// EXTENDED INTERFACES (WITH CALCULATED FIELDS)
// ============================================================================

export interface WorkoutPlanWithStats extends WorkoutPlan {
  completedSessions: number;
  progressPercentage: number;
  exercises?: Exercise[];
}

export interface TrainingSessionWithStats extends TrainingSession {
  completedExercisesCount: number;
  totalExercisesCount: number;
  completionPercentage: number;
  exercises?: Exercise[];
}

export interface ExerciseCompletionWithExercise extends ExerciseCompletion {
  exercise?: Exercise;
}

// ============================================================================
// CREATE/UPDATE TYPES
// ============================================================================

export interface ExerciseCreate {
  name: string;
  description: string;
  durationMinutes: number;
  difficulty: Difficulty | string;
  skillCategories: (SkillCategory | string)[];
  instructions?: string;
  videoUrl?: string;
}

export interface ExerciseUpdate {
  name?: string;
  description?: string;
  durationMinutes?: number;
  difficulty?: Difficulty;
  skillCategories?: SkillCategory[];
  instructions?: string;
  videoUrl?: string;
}

export interface WorkoutPlanCreate {
  skillFocus: SkillCategory | string;
  durationWeeks: DurationWeeks | number;
  trainingDays: (DayOfWeek | string)[];
  exerciseIds?: string[];
  startDate?: Date;
}

export interface WorkoutPlanUpdate {
  trainingDays?: (DayOfWeek | string)[];
  exerciseIds?: string[];
  status?: PlanStatus | string;
}

export interface TrainingSessionUpdate {
  completed: boolean;
  actualDurationMinutes?: number;
}

export interface ExerciseCompletionCreate {
  exerciseId: string;
  completed: boolean;
  notes?: string;
}

export interface ExerciseCompletionUpdate {
  completed?: boolean;
  notes?: string;
}

// ============================================================================
// FILTER AND PAGINATION TYPES
// ============================================================================

export interface ExerciseFilters {
  skill?: SkillCategory;
  difficulty?: Difficulty;
  page?: number;
  limit?: number;
}

export interface WorkoutPlanFilters {
  status?: PlanStatus;
  skill?: SkillCategory;
  page?: number;
  limit?: number;
}

export interface TrainingSessionFilters {
  startDate?: Date;
  endDate?: Date;
  completed?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

// Specific paginated responses
export interface ExerciseListResponse {
  exercises: Exercise[];
  total: number;
  page: number;
  totalPages: number;
}

export interface WorkoutPlanListResponse {
  plans: WorkoutPlanWithStats[];
  total: number;
  page: number;
  totalPages: number;
}

// ============================================================================
// AUTH CONTEXT TYPE
// ============================================================================

export interface AuthContext {
  userId: string;
  role: UserRole;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const SKILL_LABELS: Record<SkillCategory, string> = {
  agility: 'Agility',
  hitting: 'Hitting',
  blocking: 'Blocking',
  serving: 'Serving',
  setting: 'Setting',
  defensive_skills: 'Defensive Skills',
};

export const SKILL_DESCRIPTIONS: Record<SkillCategory, string> = {
  agility: 'Speed and movement training',
  hitting: 'Spike power and technique',
  blocking: 'Net defense and timing',
  serving: 'Accuracy and power serves',
  setting: 'Precision and hand positioning',
  defensive_skills: 'Digging and receiving',
};

export const DAYS_ORDER: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export const DURATION_OPTIONS: DurationWeeks[] = [1, 2, 3, 4, 6, 8, 12];

export const DIFFICULTY_CONFIG = {
  easy: {
    label: 'Easy',
    color: '#4CAF50',
    description: 'Beginner-friendly exercises',
  },
  medium: {
    label: 'Medium',
    color: '#FF9800',
    description: 'Intermediate challenge',
  },
  hard: {
    label: 'Hard',
    color: '#F44336',
    description: 'Advanced and demanding',
  },
};
