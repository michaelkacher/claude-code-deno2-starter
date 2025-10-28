/**
 * Workout Plan Wizard Island
 * Multi-step form wizard for creating volleyball workout plans
 */

import { useSignal, useComputed } from '@preact/signals';
import type {
  WizardState,
  SkillOption,
  SkillCategory,
  DayOfWeek,
  Exercise,
} from '../types/workout-plan.ts';
import {
  Card,
  CardBody,
  Button,
  Grid,
  Stack,
  Badge,
  Select,
  Steps,
  Spinner,
} from '../components/design-system/index.ts';
import { api } from '../utils/api.ts';

const SKILL_OPTIONS: SkillOption[] = [
  {
    id: 'agility',
    name: 'Agility',
    icon: '🏃',
    description: 'Speed and movement training',
  },
  {
    id: 'hitting',
    name: 'Hitting',
    icon: '💪',
    description: 'Spike power and technique',
  },
  {
    id: 'blocking',
    name: 'Blocking',
    icon: '🙌',
    description: 'Net defense and timing',
  },
  {
    id: 'serving',
    name: 'Serving',
    icon: '🏐',
    description: 'Accuracy and power serves',
  },
  {
    id: 'setting',
    name: 'Setting',
    icon: '🤲',
    description: 'Precision and hand positioning',
  },
  {
    id: 'defensive_skills',
    name: 'Defensive Skills',
    icon: '🛡️',
    description: 'Digging and receiving',
  },
];

const WEEK_OPTIONS = [
  { value: '1', label: '1 week' },
  { value: '2', label: '2 weeks' },
  { value: '3', label: '3 weeks' },
  { value: '4', label: '4 weeks' },
  { value: '6', label: '6 weeks' },
  { value: '8', label: '8 weeks' },
  { value: '12', label: '12 weeks' },
];

const DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export default function WorkoutPlanWizard() {
  const wizardState = useSignal<WizardState>({
    currentStep: 1,
    skillCategory: null,
    weeks: 4,
    trainingDays: ['monday', 'wednesday', 'friday'],
    selectedExercises: [],
  });

  const exercises = useSignal<Exercise[]>([]);
  const isLoadingExercises = useSignal(false);
  const isCreating = useSignal(false);
  const error = useSignal<string | null>(null);

  const stepLabels = [
    { label: 'Skill Focus' },
    { label: 'Schedule' },
    { label: 'Exercises' },
    { label: 'Review' },
  ];

  const selectedSkillOption = useComputed(() => {
    return SKILL_OPTIONS.find((s) => s.id === wizardState.value.skillCategory);
  });

  const exercisesByDifficulty = useComputed(() => {
    const easy = exercises.value.filter((e) => e.difficulty === 'easy');
    const medium = exercises.value.filter((e) => e.difficulty === 'medium');
    const hard = exercises.value.filter((e) => e.difficulty === 'hard');
    return { easy, medium, hard };
  });

  const selectedExercisesList = useComputed(() => {
    return exercises.value.filter((e) =>
      wizardState.value.selectedExercises.includes(e.id)
    );
  });

  const selectedExercisesByDifficulty = useComputed(() => {
    const easy = selectedExercisesList.value.filter((e) => e.difficulty === 'easy');
    const medium = selectedExercisesList.value.filter((e) => e.difficulty === 'medium');
    const hard = selectedExercisesList.value.filter((e) => e.difficulty === 'hard');
    return { easy, medium, hard };
  });

  const estimatedSessionDuration = useComputed(() => {
    return selectedExercisesList.value.reduce((sum, ex) => sum + ex.durationMinutes, 0);
  });

  const totalSessions = useComputed(() => {
    return wizardState.value.weeks * wizardState.value.trainingDays.length;
  });

  const selectSkill = (skillId: SkillCategory) => {
    wizardState.value = { ...wizardState.value, skillCategory: skillId };
  };

  const toggleDay = (day: DayOfWeek) => {
    const days = wizardState.value.trainingDays;
    const newDays = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day];
    wizardState.value = { ...wizardState.value, trainingDays: newDays };
  };

  const toggleExercise = (exerciseId: string) => {
    const exercises = wizardState.value.selectedExercises;
    const newExercises = exercises.includes(exerciseId)
      ? exercises.filter((id) => id !== exerciseId)
      : [...exercises, exerciseId];
    wizardState.value = {
      ...wizardState.value,
      selectedExercises: newExercises,
    };
  };

  const loadExercises = async () => {
    if (!wizardState.value.skillCategory) return;

    isLoadingExercises.value = true;
    error.value = null;

    try {
      const response = await api.get<Exercise[]>(
        `/exercises?skill=${wizardState.value.skillCategory}&limit=100`
      );
      exercises.value = response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load exercises';
      console.error('Error loading exercises:', err);
    } finally {
      isLoadingExercises.value = false;
    }
  };

  const goToNext = async () => {
    if (wizardState.value.currentStep === 1 && !wizardState.value.skillCategory) {
      return;
    }
    if (wizardState.value.currentStep === 2 && wizardState.value.trainingDays.length === 0) {
      return;
    }

    if (wizardState.value.currentStep === 2) {
      await loadExercises();
    }

    wizardState.value = {
      ...wizardState.value,
      currentStep: (wizardState.value.currentStep + 1) as 1 | 2 | 3 | 4,
    };
  };

  const goToPrevious = () => {
    wizardState.value = {
      ...wizardState.value,
      currentStep: (wizardState.value.currentStep - 1) as 1 | 2 | 3 | 4,
    };
  };

  const createPlan = async () => {
    isCreating.value = true;
    error.value = null;

    try {
      const response = await api.post('/workout-plans', {
        skillFocus: wizardState.value.skillCategory,
        durationWeeks: wizardState.value.weeks,
        trainingDays: wizardState.value.trainingDays,
        exerciseIds: wizardState.value.selectedExercises,
        startDate: new Date().toISOString(),
      });

      window.location.href = `/workout-plans/${response.data.id}`;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create workout plan';
      console.error('Error creating plan:', err);
    } finally {
      isCreating.value = false;
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

  const getDifficultyLabel = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  return (
    <div class="max-w-4xl mx-auto">
      <Steps steps={stepLabels} currentStep={wizardState.value.currentStep - 1} className="mb-8" />

      {error.value && (
        <Card variant="outlined" className="mb-6 border-red-300 bg-red-50">
          <CardBody>
            <div class="flex items-center gap-3 text-red-700">
              <svg class="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
              <p>{error.value}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Screen 1: Skill Focus Selection */}
      {wizardState.value.currentStep === 1 && (
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">
            What would you like to focus on?
          </h2>

          <Grid cols={2} gap={4} className="mb-8">
            {SKILL_OPTIONS.map((skill) => (
              <Card
                key={skill.id}
                hover
                variant={
                  wizardState.value.skillCategory === skill.id ? 'elevated' : 'default'
                }
                className={
                  wizardState.value.skillCategory === skill.id
                    ? 'ring-4 ring-blue-500 ring-opacity-50'
                    : ''
                }
                onClick={() => selectSkill(skill.id)}
              >
                <CardBody>
                  <div class="text-center">
                    <div class="text-5xl mb-3">{skill.icon}</div>
                    <h3 class="text-xl font-bold mb-2">{skill.name}</h3>
                    <p class="text-gray-600">{skill.description}</p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </Grid>

          <div class="flex justify-end">
            <Button
              onClick={goToNext}
              disabled={!wizardState.value.skillCategory}
              size="lg"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Screen 2: Training Schedule */}
      {wizardState.value.currentStep === 2 && (
        <div>
          <Card variant="elevated" className="mb-6">
            <CardBody>
              <div class="flex items-center gap-3 text-lg">
                <span class="text-3xl">{selectedSkillOption.value?.icon}</span>
                <div>
                  <span class="font-bold">Focus: </span>
                  <span>{selectedSkillOption.value?.name}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            How many weeks do you want to train?
          </h2>

          <Select
            label="Training Duration"
            value={wizardState.value.weeks.toString()}
            onChange={(e) => {
              const target = e.target as HTMLSelectElement;
              wizardState.value = {
                ...wizardState.value,
                weeks: parseInt(target.value),
              };
            }}
            options={WEEK_OPTIONS}
            fullWidth
            size="lg"
            className="mb-8"
          />

          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            What days of the week will you train?
          </h2>

          <Grid cols={4} gap={3} className="mb-4">
            {DAYS.map((day) => (
              <Button
                key={day}
                variant={
                  wizardState.value.trainingDays.includes(day) ? 'primary' : 'secondary'
                }
                onClick={() => toggleDay(day)}
                size="lg"
              >
                {DAY_LABELS[day]}
              </Button>
            ))}
          </Grid>

          <p class="text-gray-600 mb-8">
            Selected: {wizardState.value.trainingDays.length} day
            {wizardState.value.trainingDays.length !== 1 ? 's' : ''} per week
          </p>

          <Stack direction="horizontal" spacing={4} className="justify-between">
            <Button variant="secondary" onClick={goToPrevious} size="lg">
              Back
            </Button>
            <Button
              onClick={goToNext}
              disabled={wizardState.value.trainingDays.length === 0}
              size="lg"
            >
              Continue
            </Button>
          </Stack>
        </div>
      )}

      {/* Screen 3: Exercise Selection */}
      {wizardState.value.currentStep === 3 && (
        <div>
          <Card variant="elevated" className="mb-6">
            <CardBody>
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{selectedSkillOption.value?.icon}</span>
                  <span class="font-bold">{selectedSkillOption.value?.name}</span>
                </div>
                <div class="text-sm text-gray-600">
                  Duration: {wizardState.value.weeks} weeks • Schedule:{' '}
                  {wizardState.value.trainingDays.map((d) => DAY_LABELS[d]).join(', ')}
                </div>
              </div>
            </CardBody>
          </Card>

          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            Select exercises for your training plan:
          </h2>

          {isLoadingExercises.value ? (
            <div class="flex justify-center items-center py-12">
              <Spinner size="xl" />
            </div>
          ) : (
            <Stack spacing={6} className="mb-8">
              {/* Easy Exercises */}
              {exercisesByDifficulty.value.easy.length > 0 && (
                <div>
                  <div class="flex items-center gap-3 mb-4">
                    <Badge variant="success" size="lg">
                      {getDifficultyLabel('easy')}
                    </Badge>
                    <div class="flex-1 h-px bg-gray-200" />
                  </div>
                  <Stack spacing={3}>
                    {exercisesByDifficulty.value.easy.map((exercise) => (
                      <Card key={exercise.id} hover variant="outlined">
                        <CardBody>
                          <label class="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={wizardState.value.selectedExercises.includes(
                                exercise.id
                              )}
                              onChange={() => toggleExercise(exercise.id)}
                              class="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div class="flex-1">
                              <div class="font-bold text-lg">{exercise.name}</div>
                              <div class="text-sm text-gray-600">
                                {exercise.durationMinutes} min • {exercise.description}
                              </div>
                            </div>
                          </label>
                        </CardBody>
                      </Card>
                    ))}
                  </Stack>
                </div>
              )}

              {/* Medium Exercises */}
              {exercisesByDifficulty.value.medium.length > 0 && (
                <div>
                  <div class="flex items-center gap-3 mb-4">
                    <Badge variant="warning" size="lg">
                      {getDifficultyLabel('medium')}
                    </Badge>
                    <div class="flex-1 h-px bg-gray-200" />
                  </div>
                  <Stack spacing={3}>
                    {exercisesByDifficulty.value.medium.map((exercise) => (
                      <Card key={exercise.id} hover variant="outlined">
                        <CardBody>
                          <label class="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={wizardState.value.selectedExercises.includes(
                                exercise.id
                              )}
                              onChange={() => toggleExercise(exercise.id)}
                              class="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div class="flex-1">
                              <div class="font-bold text-lg">{exercise.name}</div>
                              <div class="text-sm text-gray-600">
                                {exercise.durationMinutes} min • {exercise.description}
                              </div>
                            </div>
                          </label>
                        </CardBody>
                      </Card>
                    ))}
                  </Stack>
                </div>
              )}

              {/* Hard Exercises */}
              {exercisesByDifficulty.value.hard.length > 0 && (
                <div>
                  <div class="flex items-center gap-3 mb-4">
                    <Badge variant="danger" size="lg">
                      {getDifficultyLabel('hard')}
                    </Badge>
                    <div class="flex-1 h-px bg-gray-200" />
                  </div>
                  <Stack spacing={3}>
                    {exercisesByDifficulty.value.hard.map((exercise) => (
                      <Card key={exercise.id} hover variant="outlined">
                        <CardBody>
                          <label class="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={wizardState.value.selectedExercises.includes(
                                exercise.id
                              )}
                              onChange={() => toggleExercise(exercise.id)}
                              class="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div class="flex-1">
                              <div class="font-bold text-lg">{exercise.name}</div>
                              <div class="text-sm text-gray-600">
                                {exercise.durationMinutes} min • {exercise.description}
                              </div>
                            </div>
                          </label>
                        </CardBody>
                      </Card>
                    ))}
                  </Stack>
                </div>
              )}
            </Stack>
          )}

          <p class="text-gray-600 mb-6 text-center">
            {wizardState.value.selectedExercises.length} exercise
            {wizardState.value.selectedExercises.length !== 1 ? 's' : ''} selected
          </p>

          <Stack direction="horizontal" spacing={4} className="justify-between">
            <Button variant="secondary" onClick={goToPrevious} size="lg">
              Back
            </Button>
            <Button onClick={goToNext} size="lg">
              Review Plan
            </Button>
          </Stack>
        </div>
      )}

      {/* Screen 4: Plan Summary */}
      {wizardState.value.currentStep === 4 && (
        <div>
          <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">
            Your Training Plan
          </h2>

          <Card variant="elevated" className="mb-6">
            <CardBody>
              <Stack spacing={4}>
                <div class="flex items-center gap-3">
                  <span class="text-3xl">{selectedSkillOption.value?.icon}</span>
                  <div>
                    <div class="text-sm text-gray-600">Focus</div>
                    <div class="text-xl font-bold">{selectedSkillOption.value?.name}</div>
                  </div>
                </div>

                <div class="h-px bg-gray-200" />

                <div>
                  <div class="text-sm text-gray-600">Duration</div>
                  <div class="text-lg font-bold">
                    {wizardState.value.weeks} week{wizardState.value.weeks !== 1 ? 's' : ''}
                  </div>
                </div>

                <div>
                  <div class="text-sm text-gray-600">Training Days</div>
                  <div class="text-lg font-bold">
                    {wizardState.value.trainingDays
                      .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
                      .join(', ')}
                  </div>
                </div>

                <div class="h-px bg-gray-200" />

                <div>
                  <div class="text-sm text-gray-600 mb-3">
                    Selected Exercises ({wizardState.value.selectedExercises.length})
                  </div>

                  {selectedExercisesByDifficulty.value.easy.length > 0 && (
                    <div class="mb-3">
                      <Badge variant="success" className="mb-2">
                        Easy ({selectedExercisesByDifficulty.value.easy.length})
                      </Badge>
                      <ul class="list-disc list-inside space-y-1">
                        {selectedExercisesByDifficulty.value.easy.map((ex) => (
                          <li key={ex.id} class="text-gray-700">
                            {ex.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedExercisesByDifficulty.value.medium.length > 0 && (
                    <div class="mb-3">
                      <Badge variant="warning" className="mb-2">
                        Medium ({selectedExercisesByDifficulty.value.medium.length})
                      </Badge>
                      <ul class="list-disc list-inside space-y-1">
                        {selectedExercisesByDifficulty.value.medium.map((ex) => (
                          <li key={ex.id} class="text-gray-700">
                            {ex.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedExercisesByDifficulty.value.hard.length > 0 && (
                    <div class="mb-3">
                      <Badge variant="danger" className="mb-2">
                        Hard ({selectedExercisesByDifficulty.value.hard.length})
                      </Badge>
                      <ul class="list-disc list-inside space-y-1">
                        {selectedExercisesByDifficulty.value.hard.map((ex) => (
                          <li key={ex.id} class="text-gray-700">
                            {ex.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {wizardState.value.selectedExercises.length === 0 && (
                    <p class="text-gray-500 italic">No exercises selected</p>
                  )}
                </div>

                <div class="h-px bg-gray-200" />

                <div class="flex justify-between">
                  <div>
                    <div class="text-sm text-gray-600">Estimated time per session</div>
                    <div class="text-lg font-bold">
                      {estimatedSessionDuration.value > 0
                        ? `${estimatedSessionDuration.value} minutes`
                        : 'N/A'}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm text-gray-600">Total sessions</div>
                    <div class="text-lg font-bold">{totalSessions.value}</div>
                  </div>
                </div>
              </Stack>
            </CardBody>
          </Card>

          <Stack direction="horizontal" spacing={4} className="justify-between">
            <Button variant="secondary" onClick={goToPrevious} size="lg">
              Edit Plan
            </Button>
            <Button
              variant="success"
              onClick={createPlan}
              loading={isCreating.value}
              size="lg"
            >
              Start Training
            </Button>
          </Stack>
        </div>
      )}
    </div>
  );
}
