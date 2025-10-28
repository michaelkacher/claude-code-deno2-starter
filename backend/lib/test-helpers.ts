/// <reference lib="deno.unstable" />

/**
 * Test Utilities and Helpers
 *
 * Shared utilities for testing services with Deno KV
 */

/**
 * Sets up an in-memory Deno KV instance for testing
 * Returns the KV instance and a cleanup function
 */
export async function setupTestKv() {
  const kv = await Deno.openKv(":memory:");
  return {
    kv,
    cleanup: async () => await kv.close(),
  };
}

/**
 * Creates a mock user for testing
 */
export function createMockUser(overrides: Partial<{
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "user" | "admin";
  createdAt: Date;
}> = {}) {
  return {
    id: `usr_${crypto.randomUUID().split("-")[0]}`,
    email: "test@test.com",
    name: "Test User",
    passwordHash: "$2a$10$test",
    role: "user" as const,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a mock exercise for testing
 */
export function createMockExercise(overrides: Partial<{
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  skillCategories: string[];
  instructions: string;
  videoUrl: string;
  createdAt: Date;
}> = {}) {
  return {
    id: `ex_${crypto.randomUUID().split("-")[0]}`,
    name: "Test Exercise",
    description: "Test exercise description for testing purposes",
    durationMinutes: 15,
    difficulty: "medium" as const,
    skillCategories: ["agility"],
    instructions: "Test instructions for the exercise",
    videoUrl: "https://example.com/video",
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a mock workout plan for testing
 */
export function createMockWorkoutPlan(overrides: Partial<{
  id: string;
  userId: string;
  skillFocus: string;
  durationWeeks: number;
  trainingDays: string[];
  exerciseIds: string[];
  status: "active" | "completed" | "paused";
  createdAt: Date;
  startDate: Date;
  endDate: Date;
  totalSessions: number;
}> = {}) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 28); // 4 weeks default

  return {
    id: `wp_${crypto.randomUUID().split("-")[0]}`,
    userId: `usr_${crypto.randomUUID().split("-")[0]}`,
    skillFocus: "agility",
    durationWeeks: 4,
    trainingDays: ["monday", "wednesday", "friday"],
    exerciseIds: [],
    status: "active" as const,
    createdAt: new Date(),
    startDate,
    endDate,
    totalSessions: 12,
    ...overrides,
  };
}

/**
 * Creates a mock training session for testing
 */
export function createMockTrainingSession(overrides: Partial<{
  id: string;
  workoutPlanId: string;
  sessionNumber: number;
  scheduledDate: Date;
  dayOfWeek: string;
  exerciseIds: string[];
  completed: boolean;
  completedAt?: Date;
  estimatedDurationMinutes: number;
  actualDurationMinutes?: number;
}> = {}) {
  return {
    id: `ts_${crypto.randomUUID().split("-")[0]}`,
    workoutPlanId: `wp_${crypto.randomUUID().split("-")[0]}`,
    sessionNumber: 1,
    scheduledDate: new Date(),
    dayOfWeek: "monday",
    exerciseIds: [],
    completed: false,
    estimatedDurationMinutes: 45,
    ...overrides,
  };
}

/**
 * Creates a mock exercise completion for testing
 */
export function createMockExerciseCompletion(overrides: Partial<{
  id: string;
  trainingSessionId: string;
  exerciseId: string;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}> = {}) {
  return {
    id: `ec_${crypto.randomUUID().split("-")[0]}`,
    trainingSessionId: `ts_${crypto.randomUUID().split("-")[0]}`,
    exerciseId: `ex_${crypto.randomUUID().split("-")[0]}`,
    completed: false,
    ...overrides,
  };
}

/**
 * Seeds the KV database with test exercises
 */
export async function seedTestExercises(kv: Deno.Kv, count = 5) {
  const exercises = [];
  const skills = ["agility", "hitting", "blocking", "serving", "setting"];
  const difficulties = ["easy", "medium", "hard"] as const;

  for (let i = 0; i < count; i++) {
    const exercise = createMockExercise({
      name: `Test Exercise ${i + 1}`,
      skillCategories: [skills[i % skills.length]],
      difficulty: difficulties[i % difficulties.length],
    });
    exercises.push(exercise);
    await kv.set(["exercises", exercise.id], exercise);
  }

  return exercises;
}
