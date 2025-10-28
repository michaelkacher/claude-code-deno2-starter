/**
 * Workout Plan Types
 * Type definitions for the volleyball workout plan feature
 */

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

export interface Exercise {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  difficulty: Difficulty;
  skillCategories: SkillCategory[];
  instructions?: string;
  videoUrl?: string;
  createdAt: string;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  skillFocus: SkillCategory;
  durationWeeks: number;
  trainingDays: DayOfWeek[];
  exerciseIds: string[];
  exercises?: Exercise[];
  status: PlanStatus;
  createdAt: string;
  startDate: string;
  endDate: string;
  totalSessions: number;
  completedSessions: number;
  progressPercentage: number;
  estimatedSessionDuration?: number;
}

export interface TrainingSession {
  id: string;
  workoutPlanId: string;
  sessionNumber: number;
  scheduledDate: string;
  dayOfWeek: DayOfWeek;
  exerciseIds: string[];
  exercises?: Exercise[];
  completed: boolean;
  completedAt?: string;
  estimatedDurationMinutes: number;
  actualDurationMinutes?: number;
  completedExercisesCount?: number;
  totalExercisesCount?: number;
}

export interface ExerciseCompletion {
  id: string;
  trainingSessionId: string;
  exerciseId: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface WizardState {
  currentStep: 1 | 2 | 3 | 4;
  skillCategory: SkillCategory | null;
  weeks: number;
  trainingDays: DayOfWeek[];
  selectedExercises: string[];
}

export interface SkillOption {
  id: SkillCategory;
  name: string;
  icon: string;
  description: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}
