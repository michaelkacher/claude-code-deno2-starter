/**
 * Zod Validation Schemas
 *
 * Data validation schemas for volleyball workout plan feature
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const SkillCategorySchema = z.enum([
  'agility',
  'hitting',
  'blocking',
  'serving',
  'setting',
  'defensive_skills',
]);

export const DayOfWeekSchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const PlanStatusSchema = z.enum(['active', 'completed', 'paused']);

export const DurationWeeksSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(6),
  z.literal(8),
  z.literal(12),
]);

// ============================================================================
// EXERCISE SCHEMAS
// ============================================================================

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
  difficulty: DifficultySchema,
  skillCategories: z.array(SkillCategorySchema)
    .min(1, "At least one skill category must be selected"),
  instructions: z.string()
    .max(2000, "Instructions must be less than 2000 characters")
    .trim()
    .optional(),
  videoUrl: z.string()
    .url("Must be a valid URL")
    .optional(),
});

export const ExerciseUpdateSchema = ExerciseCreateSchema.partial();

// ============================================================================
// WORKOUT PLAN SCHEMAS
// ============================================================================

export const WorkoutPlanCreateSchema = z.object({
  skillFocus: SkillCategorySchema,
  durationWeeks: DurationWeeksSchema,
  trainingDays: z.array(DayOfWeekSchema)
    .min(1, "At least one training day must be selected")
    .max(7, "Cannot select more than 7 days")
    .refine(
      (days) => new Set(days).size === days.length,
      { message: "Training days must be unique (no duplicates)" }
    ),
  exerciseIds: z.array(z.string())
    .optional()
    .default([]),
  startDate: z.instanceof(Date)
    .optional(),
});

export const WorkoutPlanUpdateSchema = z.object({
  trainingDays: z.array(DayOfWeekSchema)
    .min(1, "At least one training day must be selected")
    .max(7, "Cannot select more than 7 days")
    .refine(
      (days) => new Set(days).size === days.length,
      { message: "Training days must be unique" }
    )
    .optional(),
  exerciseIds: z.array(z.string()).optional(),
  status: PlanStatusSchema.optional(),
});

// ============================================================================
// TRAINING SESSION SCHEMAS
// ============================================================================

export const TrainingSessionUpdateSchema = z.object({
  completed: z.boolean(),
  actualDurationMinutes: z.number()
    .int()
    .min(1)
    .max(300)
    .optional(),
});

// ============================================================================
// EXERCISE COMPLETION SCHEMAS
// ============================================================================

export const ExerciseCompletionCreateSchema = z.object({
  exerciseId: z.string(),
  completed: z.boolean(),
  notes: z.string()
    .max(1000, "Notes must be less than 1000 characters")
    .trim()
    .optional(),
});

export const ExerciseCompletionUpdateSchema = z.object({
  completed: z.boolean().optional(),
  notes: z.string()
    .max(1000, "Notes must be less than 1000 characters")
    .trim()
    .optional(),
});
