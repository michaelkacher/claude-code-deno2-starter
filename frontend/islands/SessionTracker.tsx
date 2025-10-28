/**
 * Session Tracker Island
 * Track and manage training session progress
 */

import { useSignal, useComputed } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import type { TrainingSession, Exercise, DayOfWeek } from '../types/workout-plan.ts';
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Stack,
  Badge,
  Spinner,
  Input,
} from '../components/design-system/index.ts';
import { api } from '../utils/api.ts';

const DAY_NAMES: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

interface ExerciseWithCompletion extends Exercise {
  completed?: boolean;
  completedAt?: string;
  notes?: string;
}

interface SessionTrackerProps {
  sessionId: string;
}

export default function SessionTracker({ sessionId }: SessionTrackerProps) {
  const session = useSignal<TrainingSession | null>(null);
  const exercises = useSignal<ExerciseWithCompletion[]>([]);
  const isLoading = useSignal(true);
  const isSaving = useSignal(false);
  const error = useSignal<string | null>(null);
  const actualDuration = useSignal<number | null>(null);
  const exerciseNotes = useSignal<Record<string, string>>({});

  const completedExercisesCount = useComputed(() => {
    return exercises.value.filter((e) => e.completed).length;
  });

  const allExercisesCompleted = useComputed(() => {
    return (
      exercises.value.length > 0 &&
      exercises.value.every((e) => e.completed)
    );
  });

  const loadSessionDetails = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const [sessionResponse, completionsResponse] = await Promise.all([
        api.get<TrainingSession>(`/training-sessions/${sessionId}`),
        api.get<any[]>(`/training-sessions/${sessionId}/completions`),
      ]);

      session.value = sessionResponse.data;

      if (sessionResponse.data.exercises) {
        const exercisesWithCompletion = sessionResponse.data.exercises.map(
          (exercise) => {
            const completion = completionsResponse.data.find(
              (c: any) => c.exerciseId === exercise.id
            );
            return {
              ...exercise,
              completed: completion?.completed || false,
              completedAt: completion?.completedAt,
              notes: completion?.notes || '',
            };
          }
        );
        exercises.value = exercisesWithCompletion;

        const notes: Record<string, string> = {};
        exercisesWithCompletion.forEach((ex) => {
          if (ex.notes) {
            notes[ex.id] = ex.notes;
          }
        });
        exerciseNotes.value = notes;
      }

      if (sessionResponse.data.actualDurationMinutes) {
        actualDuration.value = sessionResponse.data.actualDurationMinutes;
      }
    } catch (err) {
      error.value = err instanceof Error
        ? err.message
        : 'Failed to load training session';
      console.error('Error loading session:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const toggleExerciseCompletion = async (exerciseId: string) => {
    const exercise = exercises.value.find((e) => e.id === exerciseId);
    if (!exercise) return;

    const newCompletedState = !exercise.completed;

    exercises.value = exercises.value.map((e) =>
      e.id === exerciseId ? { ...e, completed: newCompletedState } : e
    );

    try {
      await api.post(`/training-sessions/${sessionId}/completions`, {
        exerciseId,
        completed: newCompletedState,
        notes: exerciseNotes.value[exerciseId] || '',
      });
    } catch (err) {
      error.value = err instanceof Error
        ? err.message
        : 'Failed to update exercise completion';
      exercises.value = exercises.value.map((e) =>
        e.id === exerciseId ? { ...e, completed: !newCompletedState } : e
      );
    }
  };

  const updateExerciseNotes = async (exerciseId: string, notes: string) => {
    exerciseNotes.value = {
      ...exerciseNotes.value,
      [exerciseId]: notes,
    };
  };

  const saveExerciseNotes = async (exerciseId: string) => {
    try {
      await api.post(`/training-sessions/${sessionId}/completions`, {
        exerciseId,
        completed: exercises.value.find((e) => e.id === exerciseId)?.completed || false,
        notes: exerciseNotes.value[exerciseId] || '',
      });
    } catch (err) {
      error.value = err instanceof Error
        ? err.message
        : 'Failed to save notes';
    }
  };

  const completeSession = async () => {
    if (!allExercisesCompleted.value) {
      if (
        !confirm(
          'Not all exercises are marked as complete. Do you want to complete the session anyway?'
        )
      ) {
        return;
      }
    }

    isSaving.value = true;
    error.value = null;

    try {
      await api.put(`/training-sessions/${sessionId}`, {
        completed: true,
        actualDurationMinutes: actualDuration.value || undefined,
      });

      alert('Session completed! Great job!');
      window.location.href = `/workout-plans/${session.value?.workoutPlanId}`;
    } catch (err) {
      error.value = err instanceof Error
        ? err.message
        : 'Failed to complete session';
      console.error('Error completing session:', err);
    } finally {
      isSaving.value = false;
    }
  };

  const getDifficultyBadgeVariant = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  useEffect(() => {
    loadSessionDetails();
  }, [sessionId]);

  if (isLoading.value) {
    return (
      <div class="flex justify-center items-center py-12">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error.value || !session.value) {
    return (
      <Card variant="outlined" className="border-red-300 bg-red-50">
        <CardBody>
          <div class="flex items-center gap-3 text-red-700">
            <svg class="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            <div>
              <p class="font-bold">Error loading training session</p>
              <p class="text-sm">{error.value || 'Session not found'}</p>
            </div>
          </div>
        </CardBody>
        <CardFooter>
          <Button
            onClick={() => {
              window.location.href = '/workout-plans';
            }}
            variant="secondary"
            size="sm"
          >
            Back to Plans
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div>
      {/* Session Info Card */}
      <Card variant="elevated" className="mb-8">
        <CardBody>
          <Stack spacing={4}>
            <div class="flex items-start justify-between">
              <div>
                <h2 class="text-3xl font-bold text-gray-900">
                  Training Session {session.value.sessionNumber}
                </h2>
                <p class="text-lg text-gray-600">
                  {DAY_NAMES[session.value.dayOfWeek]} •{' '}
                  {formatDate(session.value.scheduledDate)}
                </p>
              </div>
              {session.value.completed && (
                <Badge variant="success" size="lg" dot>
                  Completed
                </Badge>
              )}
            </div>

            <div class="h-px bg-gray-200" />

            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-gray-600">Progress</div>
                <div class="text-2xl font-bold">
                  {completedExercisesCount.value} / {exercises.value.length}
                </div>
                <div class="text-sm text-gray-600">exercises completed</div>
              </div>

              <div>
                <div class="text-sm text-gray-600">Estimated Duration</div>
                <div class="text-2xl font-bold">
                  {session.value.estimatedDurationMinutes} min
                </div>
              </div>
            </div>

            {!session.value.completed && (
              <div>
                <Input
                  type="number"
                  label="Actual Duration (minutes)"
                  placeholder="Enter actual time taken"
                  value={actualDuration.value?.toString() || ''}
                  onChange={(e) => {
                    const target = e.target as HTMLInputElement;
                    actualDuration.value = parseInt(target.value) || null;
                  }}
                  fullWidth
                />
              </div>
            )}
          </Stack>
        </CardBody>
      </Card>

      {/* Exercises List */}
      <h3 class="text-2xl font-bold text-gray-900 mb-6">Exercises</h3>

      <Stack spacing={4} className="mb-8">
        {exercises.value.map((exercise) => (
          <Card
            key={exercise.id}
            variant={exercise.completed ? 'elevated' : 'outlined'}
            className={exercise.completed ? 'border-green-300 bg-green-50' : ''}
          >
            <CardBody>
              <div class="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={exercise.completed}
                  onChange={() => toggleExerciseCompletion(exercise.id)}
                  disabled={session.value?.completed}
                  class="mt-1 w-6 h-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                />

                <div class="flex-1">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <h4
                        class={`text-xl font-bold ${
                          exercise.completed
                            ? 'text-green-700 line-through'
                            : 'text-gray-900'
                        }`}
                      >
                        {exercise.name}
                      </h4>
                      <p class="text-gray-600">{exercise.description}</p>
                    </div>

                    <div class="flex items-center gap-2">
                      <Badge variant={getDifficultyBadgeVariant(exercise.difficulty)}>
                        {exercise.difficulty}
                      </Badge>
                      <span class="text-sm text-gray-600">
                        {exercise.durationMinutes} min
                      </span>
                    </div>
                  </div>

                  {exercise.instructions && (
                    <div class="mb-3 p-3 bg-gray-50 rounded-lg">
                      <div class="text-sm font-bold text-gray-700 mb-1">
                        Instructions:
                      </div>
                      <div class="text-sm text-gray-600">
                        {exercise.instructions}
                      </div>
                    </div>
                  )}

                  {!session.value?.completed && (
                    <div class="mt-3">
                      <Input
                        type="text"
                        placeholder="Add notes (optional)"
                        value={exerciseNotes.value[exercise.id] || ''}
                        onChange={(e) => {
                          const target = e.target as HTMLInputElement;
                          updateExerciseNotes(exercise.id, target.value);
                        }}
                        onBlur={() => saveExerciseNotes(exercise.id)}
                        fullWidth
                        size="sm"
                      />
                    </div>
                  )}

                  {session.value?.completed && exercise.notes && (
                    <div class="mt-3 p-2 bg-blue-50 rounded-lg">
                      <div class="text-xs font-bold text-blue-700 mb-1">Notes:</div>
                      <div class="text-sm text-blue-900">{exercise.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </Stack>

      {/* Action Buttons */}
      {!session.value.completed && (
        <Card variant="elevated">
          <CardBody>
            <Stack direction="horizontal" spacing={4} className="justify-between">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  window.location.href = `/workout-plans/${session.value?.workoutPlanId}`;
                }}
              >
                Back to Plan
              </Button>

              <Button
                variant="success"
                size="lg"
                onClick={completeSession}
                loading={isSaving.value}
                disabled={exercises.value.length === 0}
              >
                {allExercisesCompleted.value
                  ? 'Complete Session'
                  : 'Complete Anyway'}
              </Button>
            </Stack>
          </CardBody>
        </Card>
      )}

      {session.value.completed && (
        <Card variant="elevated" className="bg-green-50">
          <CardBody>
            <div class="text-center py-4">
              <div class="text-5xl mb-3">🎉</div>
              <h3 class="text-2xl font-bold text-green-800 mb-2">
                Session Completed!
              </h3>
              <p class="text-green-700 mb-4">
                Great work on completing this training session!
              </p>
              <Button
                variant="success"
                onClick={() => {
                  window.location.href = `/workout-plans/${session.value?.workoutPlanId}`;
                }}
              >
                Back to Workout Plan
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
