/**
 * Workout Plan Detail Island
 * Displays detailed information about a workout plan and its training sessions
 */

import { useSignal, useComputed } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import type {
  WorkoutPlan,
  TrainingSession,
  SkillCategory,
  DayOfWeek,
} from '../types/workout-plan.ts';
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Grid,
  Stack,
  Badge,
  ProgressBar,
  Spinner,
} from '../components/design-system/index.ts';
import { api } from '../utils/api.ts';

const SKILL_ICONS: Record<SkillCategory, string> = {
  agility: '🏃',
  hitting: '💪',
  blocking: '🙌',
  serving: '🏐',
  setting: '🤲',
  defensive_skills: '🛡️',
};

const SKILL_NAMES: Record<SkillCategory, string> = {
  agility: 'Agility',
  hitting: 'Hitting',
  blocking: 'Blocking',
  serving: 'Serving',
  setting: 'Setting',
  defensive_skills: 'Defensive Skills',
};

const DAY_NAMES: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

interface WorkoutPlanDetailProps {
  planId: string;
}

export default function WorkoutPlanDetail({ planId }: WorkoutPlanDetailProps) {
  const plan = useSignal<WorkoutPlan | null>(null);
  const sessions = useSignal<TrainingSession[]>([]);
  const isLoading = useSignal(true);
  const error = useSignal<string | null>(null);
  const isDeleting = useSignal(false);

  const upcomingSessions = useComputed(() => {
    return sessions.value.filter((s) => !s.completed);
  });

  const completedSessions = useComputed(() => {
    return sessions.value.filter((s) => s.completed);
  });

  const loadPlanDetails = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const [planResponse, sessionsResponse] = await Promise.all([
        api.get<WorkoutPlan>(`/workout-plans/${planId}`),
        api.get<TrainingSession[]>(`/workout-plans/${planId}/sessions`),
      ]);

      plan.value = planResponse.data;
      sessions.value = sessionsResponse.data;
    } catch (err) {
      error.value = err instanceof Error
        ? err.message
        : 'Failed to load workout plan';
      console.error('Error loading plan:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const deletePlan = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this workout plan? This cannot be undone.'
      )
    ) {
      return;
    }

    isDeleting.value = true;

    try {
      await api.delete(`/workout-plans/${planId}`);
      window.location.href = '/workout-plans';
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete plan';
      console.error('Error deleting plan:', err);
      isDeleting.value = false;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'secondary';
      case 'paused':
        return 'warning';
      default:
        return 'secondary';
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  useEffect(() => {
    loadPlanDetails();
  }, [planId]);

  if (isLoading.value) {
    return (
      <div class="flex justify-center items-center py-12">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error.value || !plan.value) {
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
              <p class="font-bold">Error loading workout plan</p>
              <p class="text-sm">{error.value || 'Plan not found'}</p>
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
      {/* Plan Overview Card */}
      <Card variant="elevated" className="mb-8">
        <CardBody>
          <Stack spacing={6}>
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-4">
                <span class="text-5xl">{SKILL_ICONS[plan.value.skillFocus]}</span>
                <div>
                  <h2 class="text-3xl font-bold text-gray-900">
                    {SKILL_NAMES[plan.value.skillFocus]} Training
                  </h2>
                  <p class="text-lg text-gray-600">
                    {plan.value.durationWeeks} week
                    {plan.value.durationWeeks !== 1 ? 's' : ''} program
                  </p>
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant(plan.value.status)} size="lg">
                {plan.value.status}
              </Badge>
            </div>

            <div class="h-px bg-gray-200" />

            <Grid cols={3} gap={6}>
              <div>
                <div class="text-sm text-gray-600 mb-1">Training Days</div>
                <div class="text-lg font-bold">
                  {plan.value.trainingDays.length} days/week
                </div>
                <div class="text-sm text-gray-600 mt-1">
                  {plan.value.trainingDays.map((d) => DAY_NAMES[d]).join(', ')}
                </div>
              </div>

              <div>
                <div class="text-sm text-gray-600 mb-1">Exercises</div>
                <div class="text-lg font-bold">{plan.value.exerciseIds.length}</div>
                {plan.value.estimatedSessionDuration && (
                  <div class="text-sm text-gray-600 mt-1">
                    ~{plan.value.estimatedSessionDuration} min/session
                  </div>
                )}
              </div>

              <div>
                <div class="text-sm text-gray-600 mb-1">Duration</div>
                <div class="text-lg font-bold">
                  {formatDateShort(plan.value.startDate)} -{' '}
                  {formatDateShort(plan.value.endDate)}
                </div>
              </div>
            </Grid>

            <div>
              <div class="flex justify-between text-sm text-gray-600 mb-2">
                <span>Overall Progress</span>
                <span>
                  {plan.value.completedSessions} / {plan.value.totalSessions}{' '}
                  sessions ({Math.round(plan.value.progressPercentage)}%)
                </span>
              </div>
              <ProgressBar
                value={plan.value.completedSessions}
                max={plan.value.totalSessions}
                variant={plan.value.progressPercentage === 100 ? 'success' : 'primary'}
                size="lg"
              />
            </div>
          </Stack>
        </CardBody>

        <CardFooter>
          <Stack direction="horizontal" spacing={4}>
            <Button
              variant="danger"
              onClick={deletePlan}
              loading={isDeleting.value}
            >
              Delete Plan
            </Button>
          </Stack>
        </CardFooter>
      </Card>

      {/* Exercises Card */}
      {plan.value.exercises && plan.value.exercises.length > 0 && (
        <Card variant="elevated" className="mb-8">
          <CardBody>
            <h3 class="text-2xl font-bold text-gray-900 mb-6">Exercises</h3>

            <Stack spacing={3}>
              {plan.value.exercises.map((exercise) => (
                <Card key={exercise.id} variant="outlined">
                  <CardBody className="py-3">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex-1">
                        <div class="font-bold text-lg">{exercise.name}</div>
                        <div class="text-sm text-gray-600">
                          {exercise.description}
                        </div>
                      </div>
                      <div class="flex items-center gap-3">
                        <Badge
                          variant={getDifficultyBadgeVariant(exercise.difficulty)}
                        >
                          {exercise.difficulty}
                        </Badge>
                        <div class="text-sm text-gray-600">
                          {exercise.durationMinutes} min
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </Stack>
          </CardBody>
        </Card>
      )}

      {/* Training Sessions */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Sessions */}
        <Card variant="elevated">
          <CardBody>
            <h3 class="text-xl font-bold text-gray-900 mb-4">
              Upcoming Sessions ({upcomingSessions.value.length})
            </h3>

            {upcomingSessions.value.length === 0 ? (
              <div class="text-center py-8 text-gray-500">
                <p>No upcoming sessions</p>
              </div>
            ) : (
              <Stack spacing={3}>
                {upcomingSessions.value.slice(0, 5).map((session) => (
                  <Card
                    key={session.id}
                    variant="outlined"
                    hover
                    onClick={() => {
                      window.location.href = `/training-sessions/${session.id}`;
                    }}
                  >
                    <CardBody className="py-3">
                      <div class="flex items-center justify-between">
                        <div>
                          <div class="font-bold">
                            Session {session.sessionNumber}
                          </div>
                          <div class="text-sm text-gray-600">
                            {formatDate(session.scheduledDate)}
                          </div>
                        </div>
                        <div class="text-right">
                          <div class="text-sm text-gray-600">
                            {DAY_NAMES[session.dayOfWeek]}
                          </div>
                          <div class="text-xs text-gray-500">
                            {session.estimatedDurationMinutes} min
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </Stack>
            )}
          </CardBody>
        </Card>

        {/* Completed Sessions */}
        <Card variant="elevated">
          <CardBody>
            <h3 class="text-xl font-bold text-gray-900 mb-4">
              Completed Sessions ({completedSessions.value.length})
            </h3>

            {completedSessions.value.length === 0 ? (
              <div class="text-center py-8 text-gray-500">
                <p>No completed sessions yet</p>
              </div>
            ) : (
              <Stack spacing={3}>
                {completedSessions.value.slice(0, 5).map((session) => (
                  <Card
                    key={session.id}
                    variant="outlined"
                    hover
                    onClick={() => {
                      window.location.href = `/training-sessions/${session.id}`;
                    }}
                  >
                    <CardBody className="py-3">
                      <div class="flex items-center justify-between">
                        <div>
                          <div class="font-bold flex items-center gap-2">
                            Session {session.sessionNumber}
                            <svg
                              class="w-5 h-5 text-green-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd"
                              />
                            </svg>
                          </div>
                          <div class="text-sm text-gray-600">
                            {formatDate(session.scheduledDate)}
                          </div>
                        </div>
                        <div class="text-right">
                          <div class="text-sm text-gray-600">
                            {DAY_NAMES[session.dayOfWeek]}
                          </div>
                          {session.actualDurationMinutes && (
                            <div class="text-xs text-gray-500">
                              {session.actualDurationMinutes} min
                            </div>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </Stack>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
