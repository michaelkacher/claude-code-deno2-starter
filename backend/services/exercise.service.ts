/**
 * Exercise Service
 *
 * Business logic for managing exercises
 */

import type {
  Exercise,
  ExerciseCreate,
  ExerciseFilters,
  ExerciseListResponse,
  ExerciseUpdate,
  AuthContext,
} from "../types/volleyball.ts";
import {
  ExerciseCreateSchema,
  ExerciseUpdateSchema,
} from "../lib/validation/volleyball-schemas.ts";

export class ExerciseService {
  constructor(private kv: Deno.Kv) {}

  /**
   * Create a new exercise (admin only)
   */
  async create(
    data: ExerciseCreate,
    auth?: AuthContext,
  ): Promise<Exercise> {
    // Check admin permission
    if (auth && auth.role !== "admin") {
      throw new Error("Only admin users can create exercises");
    }

    // Validate data
    const validated = ExerciseCreateSchema.parse(data);

    // Generate exercise ID
    const id = `ex_${crypto.randomUUID().split("-")[0]}`;

    // Create exercise object
    const exercise: Exercise = {
      id,
      ...validated,
      createdAt: new Date(),
    };

    // Start atomic transaction
    const atomic = this.kv.atomic();

    // Save to primary key
    atomic.set(["exercises", id], exercise);

    // Create secondary indexes for each skill category
    for (const skill of exercise.skillCategories) {
      atomic.set(["exercises_by_skill", skill, id], exercise);

      // Combined skill + difficulty index
      atomic.set(
        ["exercises_by_skill_and_difficulty", skill, exercise.difficulty, id],
        exercise,
      );
    }

    // Create difficulty index
    atomic.set(["exercises_by_difficulty", exercise.difficulty, id], exercise);

    // Commit transaction
    const result = await atomic.commit();
    if (!result.ok) {
      throw new Error("Failed to create exercise");
    }

    return exercise;
  }

  /**
   * List exercises with optional filters
   */
  async list(
    filters: ExerciseFilters,
    _auth?: AuthContext,
  ): Promise<ExerciseListResponse> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    let prefix: Deno.KvKey;

    // Determine which index to use based on filters
    if (filters.skill && filters.difficulty) {
      prefix = [
        "exercises_by_skill_and_difficulty",
        filters.skill,
        filters.difficulty,
      ];
    } else if (filters.skill) {
      prefix = ["exercises_by_skill", filters.skill];
    } else if (filters.difficulty) {
      prefix = ["exercises_by_difficulty", filters.difficulty];
    } else {
      prefix = ["exercises"];
    }

    // Get all matching entries
    const entries = this.kv.list<Exercise>({ prefix });
    const exercises: Exercise[] = [];

    for await (const entry of entries) {
      exercises.push(entry.value);
    }

    // Remove duplicates (can happen due to multiple skill categories)
    const uniqueExercises = Array.from(
      new Map(exercises.map((ex) => [ex.id, ex])).values(),
    );

    const total = uniqueExercises.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedExercises = uniqueExercises.slice(start, end);

    return {
      exercises: paginatedExercises,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Get exercise by ID
   */
  async getById(id: string): Promise<Exercise | null> {
    const entry = await this.kv.get<Exercise>(["exercises", id]);
    return entry.value;
  }

  /**
   * Update exercise (admin only)
   */
  async update(
    id: string,
    data: ExerciseUpdate,
    auth?: AuthContext,
  ): Promise<Exercise> {
    // Check admin permission
    if (auth && auth.role !== "admin") {
      throw new Error("Only admin users can update exercises");
    }

    // Validate data
    const validated = ExerciseUpdateSchema.parse(data);

    // Get existing exercise
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("Exercise not found");
    }

    // Merge updates
    const updated: Exercise = {
      ...existing,
      ...validated,
    };

    // Start atomic transaction to update all indexes
    const atomic = this.kv.atomic();

    // Update primary key
    atomic.set(["exercises", id], updated);

    // Delete old indexes
    for (const skill of existing.skillCategories) {
      atomic.delete(["exercises_by_skill", skill, id]);
      atomic.delete([
        "exercises_by_skill_and_difficulty",
        skill,
        existing.difficulty,
        id,
      ]);
    }
    atomic.delete(["exercises_by_difficulty", existing.difficulty, id]);

    // Create new indexes
    for (const skill of updated.skillCategories) {
      atomic.set(["exercises_by_skill", skill, id], updated);
      atomic.set(
        ["exercises_by_skill_and_difficulty", skill, updated.difficulty, id],
        updated,
      );
    }
    atomic.set(["exercises_by_difficulty", updated.difficulty, id], updated);

    // Commit transaction
    const result = await atomic.commit();
    if (!result.ok) {
      throw new Error("Failed to update exercise");
    }

    return updated;
  }

  /**
   * Delete exercise (admin only)
   */
  async delete(
    id: string,
    authOrOptions?: AuthContext | { userId?: string; role?: string; checkReferences?: boolean },
  ): Promise<void> {
    // Handle both auth context and options object
    let auth: AuthContext | undefined;
    let checkReferences = false;

    if (authOrOptions) {
      if ('checkReferences' in authOrOptions) {
        checkReferences = authOrOptions.checkReferences || false;
        if (authOrOptions.userId && authOrOptions.role) {
          auth = { userId: authOrOptions.userId, role: authOrOptions.role as 'user' | 'admin' };
        }
      } else {
        auth = authOrOptions;
      }
    }

    // Check admin permission
    if (auth && auth.role !== "admin") {
      throw new Error("Only admin users can delete exercises");
    }

    // Get existing exercise
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("Exercise not found");
    }

    // Check if exercise is referenced in active plans
    if (checkReferences) {
      const plansPrefix = this.kv.list({ prefix: ["workout_plans"] });
      for await (const entry of plansPrefix) {
        const plan = entry.value as any;
        if (
          plan.status === "active" &&
          plan.exerciseIds &&
          plan.exerciseIds.includes(id)
        ) {
          throw new Error("Cannot delete exercise that is in use in active workout plans");
        }
      }
    }

    // Start atomic transaction
    const atomic = this.kv.atomic();

    // Delete primary key
    atomic.delete(["exercises", id]);

    // Delete all indexes
    for (const skill of existing.skillCategories) {
      atomic.delete(["exercises_by_skill", skill, id]);
      atomic.delete([
        "exercises_by_skill_and_difficulty",
        skill,
        existing.difficulty,
        id,
      ]);
    }
    atomic.delete(["exercises_by_difficulty", existing.difficulty, id]);

    // Commit transaction
    const result = await atomic.commit();
    if (!result.ok) {
      throw new Error("Failed to delete exercise");
    }
  }
}
