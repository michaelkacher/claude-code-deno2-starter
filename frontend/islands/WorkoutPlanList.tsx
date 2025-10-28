/**
 * Workout Plan List Island
 * Displays all workout plans for the authenticated user
 */

import { useSignal, useComputed } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import type { WorkoutPlan, SkillCategory } from '../types/workout-plan.ts';
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

export default function WorkoutPlanList() {
  const plans = useSignal<WorkoutPlan[]>([]);
  const isLoading = useSignal(true);
  const error = useSignal<string | null>(null);
  const deletingPlanId = useSignal<string | null>(null);

  const loadPlans = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get<WorkoutPlan[]>('/workout-plans');
      plans.value = response.data;
    } catch (err) {
      error.value = err instanceof Error
        ? err.message
        : 'Failed to load workout plans';
      console.error('Error loading plans:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const deletePlan = async (planId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this workout plan? This cannot be undone.'
      )
    ) {
      return;
    }

    deletingPlanId.value = planId;

    try {
      await api.delete(`/workout-plans/${planId}`);
      plans.value = plans.value.filter((p) => p.id !== planId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete plan';
      console.error('Error deleting plan:', err);
    } finally {
      deletingPlanId.value = null;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  useEffect(() => {
    loadPlans();
  }, []);

  if (isLoading.value) {
    return (
      <div class="flex justify-center items-center py-12">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error.value) {
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
              <p class="font-bold">Error loading workout plans</p>
              <p class="text-sm">{error.value}</p>
            </div>
          </div>
        </CardBody>
        <CardFooter>
          <Button onClick={loadPlans} variant="secondary" size="sm">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (plans.value.length === 0) {
    return (
      <Card variant="elevated" className="text-center">
        <CardBody>
          <div class="py-12">
            <div class="text-6xl mb-4">🏐</div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">
              No Workout Plans Yet
            </h3>
            <p class="text-gray-600 mb-6">
              Create your first personalized volleyball training plan to get started!
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                window.location.href = '/workout-plans/create';
              }}
            >
              Create Your First Plan
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div>
      <Grid cols={2} gap={6}>
        {plans.value.map((plan) => (
          <Card key={plan.id} variant="elevated" hover>
            <CardBody>
              <Stack spacing={4}>
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <span class="text-4xl">{SKILL_ICONS[plan.skillFocus]}</span>
                    <div>
                      <h3 class="text-xl font-bold text-gray-900">
                        {SKILL_NAMES[plan.skillFocus]}
                      </h3>
                      <p class="text-sm text-gray-600">
                        {plan.durationWeeks} week
                        {plan.durationWeeks !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(plan.status)}>
                    {plan.status}
                  </Badge>
                </div>

                <div>
                  <p class="text-sm text-gray-600 mb-2">
                    Training Days: {plan.trainingDays.length} days/week
                  </p>
                  <p class="text-sm text-gray-600">
                    Exercises: {plan.exerciseIds.length}
                  </p>
                </div>

                <div>
                  <div class="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>
                      {plan.completedSessions} / {plan.totalSessions} sessions
                    </span>
                  </div>
                  <ProgressBar
                    value={plan.completedSessions}
                    max={plan.totalSessions}
                    variant={
                      plan.progressPercentage === 100 ? 'success' : 'primary'
                    }
                  />
                </div>

                <div class="text-xs text-gray-500">
                  Created: {formatDate(plan.createdAt)}
                </div>
              </Stack>
            </CardBody>

            <CardFooter>
              <Stack direction="horizontal" spacing={3}>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    window.location.href = `/workout-plans/${plan.id}`;
                  }}
                >
                  View Details
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={deletingPlanId.value === plan.id}
                  onClick={() => deletePlan(plan.id)}
                >
                  Delete
                </Button>
              </Stack>
            </CardFooter>
          </Card>
        ))}
      </Grid>
    </div>
  );
}
