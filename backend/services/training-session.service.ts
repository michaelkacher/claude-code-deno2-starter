/**
 * Training Session Service
 *
 * Business logic for managing training sessions and exercise completions
 */

import type {
  Exercise,
  ExerciseCompletion,
  ExerciseCompletionCreate,
  ExerciseCompletionUpdate,
  TrainingSession,
  TrainingSessionFilters,
  TrainingSessionUpdate,
  TrainingSessionWithStats,
  WorkoutPlan,
} from "../types/volleyball.ts";
import {
  ExerciseCompletionCreateSchema,
  ExerciseCompletionUpdateSchema,
  TrainingSessionUpdateSchema,
} from "../lib/validation/volleyball-schemas.ts";

export class TrainingSessionService {
  constructor(private kv: Deno.Kv) {}

  /**
   * Get training session by ID
   */
  async getById(
    id: string,
    userId: string,
  ): Promise<TrainingSessionWithStats | null> {
    const entry = await this.kv.get<TrainingSession>(["training_sessions", id]);
    if (!entry.value) {
      return null;
    }

    const session = entry.value;

    // Verify user owns the plan
    const plan = await this.kv.get<WorkoutPlan>([
      "workout_plans",
      session.workoutPlanId,
    ]);
    if (!plan.value) {
      throw new Error("Associated workout plan not found");
    }

    if (plan.value.userId !== userId) {
      throw new Error("You do not have permission to access this session");
    }

    // Fetch exercise details
    const exercises: Exercise[] = [];
    for (const exerciseId of session.exerciseIds) {
      const exerciseEntry = await this.kv.get<Exercise>([
        "exercises",
        exerciseId,
      ]);
      if (exerciseEntry.value) {
        exercises.push(exerciseEntry.value);
      }
    }

    // Calculate completion stats
    const completionStats = await this.calculateCompletionStats(session);

    return {
      ...session,
      ...completionStats,
      exercises,
    };
  }

  /**
   * Calculate completion statistics for a session
   */
  private async calculateCompletionStats(session: TrainingSession): Promise<{
    completedExercisesCount: number;
    totalExercisesCount: number;
    completionPercentage: number;
  }> {
    const totalExercisesCount = session.exerciseIds.length;

    // Get exercise completions for this session
    const completionsPrefix = this.kv.list<ExerciseCompletion>({
      prefix: ["exercise_completions_by_session", session.id],
    });

    let completedExercisesCount = 0;
    for await (const entry of completionsPrefix) {
      if (entry.value.completed) {
        completedExercisesCount++;
      }
    }

    const completionPercentage = totalExercisesCount > 0
      ? Math.round((completedExercisesCount / totalExercisesCount) * 100)
      : 0;

    return {
      completedExercisesCount,
      totalExercisesCount,
      completionPercentage,
    };
  }

  /**
   * Get training sessions by plan
   */
  async getByPlan(
    planId: string,
    userId: string,
    filters?: TrainingSessionFilters,
  ): Promise<TrainingSession[]> {
    // Verify user owns the plan
    const plan = await this.kv.get<WorkoutPlan>(["workout_plans", planId]);
    if (!plan.value) {
      throw new Error("Workout plan not found");
    }

    if (plan.value.userId !== userId) {
      throw new Error("You do not have permission to access this plan");
    }

    // Get all sessions for the plan - need to get from primary key since indexes might be stale
    const sessionsPrefix = this.kv.list<TrainingSession>({
      prefix: ["training_sessions"],
    });

    const sessions: TrainingSession[] = [];
    for await (const entry of sessionsPrefix) {
      if (entry.value.workoutPlanId === planId) {
        sessions.push(entry.value);
      }
    }

    // Apply filters
    let filteredSessions = sessions;

    if (filters?.completed !== undefined) {
      filteredSessions = filteredSessions.filter(
        (s) => s.completed === filters.completed,
      );
    }

    if (filters?.startDate || filters?.endDate) {
      filteredSessions = filteredSessions.filter((s) => {
        const sessionDate = s.scheduledDate.getTime();
        const afterStart = !filters.startDate ||
          sessionDate >= filters.startDate.getTime();
        const beforeEnd = !filters.endDate ||
          sessionDate <= filters.endDate.getTime();
        return afterStart && beforeEnd;
      });
    }

    // Sort by session number
    filteredSessions.sort((a, b) => a.sessionNumber - b.sessionNumber);

    return filteredSessions;
  }

  /**
   * Update session completion status
   */
  async updateCompletion(
    id: string,
    userId: string,
    data: TrainingSessionUpdate,
  ): Promise<TrainingSession> {
    // Validate data
    const validated = TrainingSessionUpdateSchema.parse(data);

    // Get existing session
    const existing = await this.kv.get<TrainingSession>([
      "training_sessions",
      id,
    ]);
    if (!existing.value) {
      throw new Error("Training session not found");
    }

    const session = existing.value;

    // Verify user owns the plan
    const plan = await this.kv.get<WorkoutPlan>([
      "workout_plans",
      session.workoutPlanId,
    ]);
    if (!plan.value) {
      throw new Error("Associated workout plan not found");
    }

    if (plan.value.userId !== userId) {
      throw new Error("You do not have permission to update this session");
    }

    // Update session
    const updated: TrainingSession = {
      ...session,
      completed: validated.completed,
    };

    if (validated.completed) {
      updated.completedAt = new Date();
      if (validated.actualDurationMinutes) {
        updated.actualDurationMinutes = validated.actualDurationMinutes;
      }
    } else {
      // Clear completion data if marking as incomplete
      updated.completedAt = undefined;
      updated.actualDurationMinutes = undefined;
    }

    // Start atomic transaction
    const atomic = this.kv.atomic();

    // Update all session keys
    atomic.set(["training_sessions", id], updated);
    atomic.set(
      ["training_sessions_by_plan", session.workoutPlanId, session.sessionNumber, id],
      updated,
    );
    atomic.set(
      ["training_sessions_by_date", session.workoutPlanId, session.scheduledDate.getTime(), id],
      updated,
    );

    // Commit transaction
    const result = await atomic.commit();
    if (!result.ok) {
      throw new Error("Failed to update training session");
    }

    return updated;
  }

  /**
   * Mark an exercise as complete in a session
   */
  async markExerciseComplete(
    sessionId: string,
    userId: string,
    data: ExerciseCompletionCreate,
  ): Promise<ExerciseCompletion> {
    // Validate data
    const validated = ExerciseCompletionCreateSchema.parse(data);

    // Get session
    const session = await this.kv.get<TrainingSession>([
      "training_sessions",
      sessionId,
    ]);
    if (!session.value) {
      throw new Error("Training session not found");
    }

    // Verify user owns the plan
    const plan = await this.kv.get<WorkoutPlan>([
      "workout_plans",
      session.value.workoutPlanId,
    ]);
    if (!plan.value) {
      throw new Error("Associated workout plan not found");
    }

    if (plan.value.userId !== userId) {
      throw new Error("You do not have permission to update this session");
    }

    // Verify exercise is in the session
    if (!session.value.exerciseIds.includes(validated.exerciseId)) {
      throw new Error("Exercise not in session");
    }

    // Check if completion already exists
    const existingCompletion = await this.kv.get<ExerciseCompletion>([
      "exercise_completions_by_session",
      sessionId,
      validated.exerciseId,
    ]);

    let completion: ExerciseCompletion;

    if (existingCompletion.value) {
      // Update existing completion
      completion = {
        ...existingCompletion.value,
        completed: validated.completed,
        completedAt: validated.completed ? new Date() : undefined,
        notes: validated.notes,
      };
    } else {
      // Create new completion
      completion = {
        id: `ec_${crypto.randomUUID().split("-")[0]}`,
        trainingSessionId: sessionId,
        exerciseId: validated.exerciseId,
        completed: validated.completed,
        completedAt: validated.completed ? new Date() : undefined,
        notes: validated.notes,
      };
    }

    // Save completion
    const atomic = this.kv.atomic();
    atomic.set(["exercise_completions", completion.id], completion);
    atomic.set(
      ["exercise_completions_by_session", sessionId, validated.exerciseId],
      completion,
    );

    // Check if all exercises are complete
    const allComplete = await this.checkAllExercisesComplete(
      session.value,
      validated.exerciseId,
      validated.completed,
    );

    // Auto-complete session if all exercises are done
    if (allComplete && !session.value.completed) {
      const updatedSession: TrainingSession = {
        ...session.value,
        completed: true,
        completedAt: new Date(),
      };

      atomic.set(["training_sessions", sessionId], updatedSession);
      atomic.set(
        ["training_sessions_by_plan", session.value.workoutPlanId, session.value.sessionNumber, sessionId],
        updatedSession,
      );
      atomic.set(
        ["training_sessions_by_date", session.value.workoutPlanId, session.value.scheduledDate.getTime(), sessionId],
        updatedSession,
      );
    }

    const result = await atomic.commit();
    if (!result.ok) {
      throw new Error("Failed to update exercise completion");
    }

    return completion;
  }

  /**
   * Check if all exercises in a session are complete
   */
  private async checkAllExercisesComplete(
    session: TrainingSession,
    currentExerciseId: string,
    currentCompleted: boolean,
  ): Promise<boolean> {
    const completionsPrefix = this.kv.list<ExerciseCompletion>({
      prefix: ["exercise_completions_by_session", session.id],
    });

    const completions = new Map<string, boolean>();

    for await (const entry of completionsPrefix) {
      completions.set(entry.value.exerciseId, entry.value.completed);
    }

    // Add/update the current exercise
    completions.set(currentExerciseId, currentCompleted);

    // Check if all exercises have completions and are completed
    for (const exerciseId of session.exerciseIds) {
      if (!completions.get(exerciseId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get exercise completions for a session
   */
  async getExerciseCompletions(
    sessionId: string,
    userId: string,
  ): Promise<ExerciseCompletion[]> {
    // Get session
    const session = await this.kv.get<TrainingSession>([
      "training_sessions",
      sessionId,
    ]);
    if (!session.value) {
      throw new Error("Training session not found");
    }

    // Verify user owns the plan
    const plan = await this.kv.get<WorkoutPlan>([
      "workout_plans",
      session.value.workoutPlanId,
    ]);
    if (!plan.value) {
      throw new Error("Associated workout plan not found");
    }

    if (plan.value.userId !== userId) {
      throw new Error("You do not have permission to access this session");
    }

    // Get all completions for this session
    const completionsPrefix = this.kv.list<ExerciseCompletion>({
      prefix: ["exercise_completions_by_session", sessionId],
    });

    const completionsMap = new Map<string, ExerciseCompletion>();
    for await (const entry of completionsPrefix) {
      completionsMap.set(entry.value.exerciseId, entry.value);
    }

    // Create completions array with all exercises, marking missing ones as incomplete
    const completions: ExerciseCompletion[] = [];
    for (const exerciseId of session.value.exerciseIds) {
      if (completionsMap.has(exerciseId)) {
        completions.push(completionsMap.get(exerciseId)!);
      } else {
        // Create a placeholder for incomplete exercises
        completions.push({
          id: `ec_placeholder_${exerciseId}`,
          trainingSessionId: sessionId,
          exerciseId,
          completed: false,
        });
      }
    }

    return completions;
  }

  /**
   * Update an exercise completion
   */
  async updateExerciseCompletion(
    completionId: string,
    userId: string,
    data: ExerciseCompletionUpdate,
  ): Promise<ExerciseCompletion> {
    // Validate data
    const validated = ExerciseCompletionUpdateSchema.parse(data);

    // Get existing completion
    const existing = await this.kv.get<ExerciseCompletion>([
      "exercise_completions",
      completionId,
    ]);
    if (!existing.value) {
      throw new Error("Exercise completion not found");
    }

    const completion = existing.value;

    // Get session to verify ownership
    const session = await this.kv.get<TrainingSession>([
      "training_sessions",
      completion.trainingSessionId,
    ]);
    if (!session.value) {
      throw new Error("Training session not found");
    }

    // Verify user owns the plan
    const plan = await this.kv.get<WorkoutPlan>([
      "workout_plans",
      session.value.workoutPlanId,
    ]);
    if (!plan.value) {
      throw new Error("Associated workout plan not found");
    }

    if (plan.value.userId !== userId) {
      throw new Error(
        "You do not have permission to update this completion",
      );
    }

    // Update completion
    const updated: ExerciseCompletion = {
      ...completion,
      ...validated,
    };

    // Update completedAt if completed status changed
    if (validated.completed !== undefined) {
      updated.completedAt = validated.completed ? new Date() : undefined;
    }

    // Save updated completion
    const atomic = this.kv.atomic();
    atomic.set(["exercise_completions", completionId], updated);
    atomic.set(
      [
        "exercise_completions_by_session",
        completion.trainingSessionId,
        completion.exerciseId,
      ],
      updated,
    );

    const result = await atomic.commit();
    if (!result.ok) {
      throw new Error("Failed to update exercise completion");
    }

    return updated;
  }
}
