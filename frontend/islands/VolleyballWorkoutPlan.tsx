/**
 * Volleyball Workout Plan Island
 * Interactive component managing the multi-screen workout plan creation flow
 */

import { useSignal } from '@preact/signals';

// Types
type SkillFocus =
  | 'agility'
  | 'hitting'
  | 'blocking'
  | 'serving'
  | 'setting'
  | 'defensive';

type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

type Exercise = {
  id: string;
  name: string;
  duration: number; // in minutes
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

type WorkoutPlan = {
  skill: SkillFocus | null;
  weeks: number;
  days: DayOfWeek[];
  exercises: string[]; // exercise IDs
};

// Skill data
const skills = [
  {
    id: 'agility' as SkillFocus,
    icon: '🏃',
    name: 'Agility',
    description: 'Speed and movement training',
  },
  {
    id: 'hitting' as SkillFocus,
    icon: '💪',
    name: 'Hitting',
    description: 'Spike power and technique',
  },
  {
    id: 'blocking' as SkillFocus,
    icon: '🙌',
    name: 'Blocking',
    description: 'Net defense and timing',
  },
  {
    id: 'serving' as SkillFocus,
    icon: '🏐',
    name: 'Serving',
    description: 'Accuracy and power serves',
  },
  {
    id: 'setting' as SkillFocus,
    icon: '🤲',
    name: 'Setting',
    description: 'Precision and hand positioning',
  },
  {
    id: 'defensive' as SkillFocus,
    icon: '🛡️',
    name: 'Defensive Skills',
    description: 'Digging and receiving',
  },
];

// Exercise data
const exercises: Exercise[] = [
  // Easy exercises
  {
    id: 'ladder-basic',
    name: 'Ladder Drills - Basic',
    duration: 15,
    description: 'Footwork fundamentals',
    difficulty: 'easy',
  },
  {
    id: 'cone-shuffle',
    name: 'Cone Shuffle',
    duration: 10,
    description: 'Lateral movement',
    difficulty: 'easy',
  },
  {
    id: 'jump-rope',
    name: 'Jump Rope',
    duration: 10,
    description: 'Coordination and endurance',
    difficulty: 'easy',
  },
  {
    id: 'high-knees',
    name: 'High Knees',
    duration: 5,
    description: 'Dynamic warm-up',
    difficulty: 'easy',
  },
  // Medium exercises
  {
    id: 'ladder-advanced',
    name: 'Ladder Drills - Advanced',
    duration: 20,
    description: 'Complex footwork patterns',
    difficulty: 'medium',
  },
  {
    id: 't-drill',
    name: 'T-Drill',
    duration: 15,
    description: 'Directional changes',
    difficulty: 'medium',
  },
  {
    id: 'box-jumps',
    name: 'Box Jumps',
    duration: 15,
    description: 'Explosive power',
    difficulty: 'medium',
  },
  {
    id: 'reaction-ball',
    name: 'Reaction Ball Training',
    duration: 15,
    description: 'Quick reflexes',
    difficulty: 'medium',
  },
  {
    id: 'suicide-sprints',
    name: 'Suicide Sprints',
    duration: 10,
    description: 'Speed and endurance',
    difficulty: 'medium',
  },
  // Hard exercises
  {
    id: 'plyometric-circuit',
    name: 'Plyometric Circuit',
    duration: 25,
    description: 'High-intensity explosive training',
    difficulty: 'hard',
  },
  {
    id: 'cone-drills-ball',
    name: 'Advanced Cone Drills with Ball',
    duration: 20,
    description: 'Multi-directional agility',
    difficulty: 'hard',
  },
  {
    id: 'resistance-sprints',
    name: 'Resistance Band Sprints',
    duration: 20,
    description: 'Power development',
    difficulty: 'hard',
  },
  {
    id: 'mirror-drill',
    name: 'Mirror Drill with Partner',
    duration: 20,
    description: 'Reactive agility',
    difficulty: 'hard',
  },
];

const weekOptions = [1, 2, 3, 4, 6, 8, 12];
const daysOfWeek: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const defaultDays: DayOfWeek[] = ['Mon', 'Wed', 'Fri'];

export default function VolleyballWorkoutPlan() {
  const currentScreen = useSignal<1 | 2 | 3 | 4>(1);
  const plan = useSignal<WorkoutPlan>({
    skill: null,
    weeks: 4,
    days: [...defaultDays],
    exercises: [],
  });

  const handleSkillSelect = (skill: SkillFocus) => {
    plan.value = { ...plan.value, skill };
    currentScreen.value = 2;
  };

  const handleWeeksChange = (weeks: number) => {
    plan.value = { ...plan.value, weeks };
  };

  const toggleDay = (day: DayOfWeek) => {
    const days = plan.value.days.includes(day)
      ? plan.value.days.filter((d) => d !== day)
      : [...plan.value.days, day];
    plan.value = { ...plan.value, days };
  };

  const toggleExercise = (exerciseId: string) => {
    const exercises = plan.value.exercises.includes(exerciseId)
      ? plan.value.exercises.filter((id) => id !== exerciseId)
      : [...plan.value.exercises, exerciseId];
    plan.value = { ...plan.value, exercises };
  };

  const goToNextScreen = () => {
    if (currentScreen.value < 4) {
      currentScreen.value = (currentScreen.value + 1) as 1 | 2 | 3 | 4;
    }
  };

  const goToPreviousScreen = () => {
    if (currentScreen.value > 1) {
      currentScreen.value = (currentScreen.value - 1) as 1 | 2 | 3 | 4;
    }
  };

  const getSelectedSkill = () => {
    return skills.find((s) => s.id === plan.value.skill);
  };

  const getExercisesByDifficulty = (difficulty: 'easy' | 'medium' | 'hard') => {
    return exercises.filter((ex) => ex.difficulty === difficulty);
  };

  const getSelectedExercises = () => {
    return exercises.filter((ex) => plan.value.exercises.includes(ex.id));
  };

  const getTotalDuration = () => {
    return getSelectedExercises().reduce((sum, ex) => sum + ex.duration, 0);
  };

  const getTotalSessions = () => {
    return plan.value.weeks * plan.value.days.length;
  };

  // Screen 1: Skill Focus Selection
  if (currentScreen.value === 1) {
    return (
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl mx-auto">
          {/* Header */}
          <div class="text-center mb-12 animate-fade-in">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <span class="text-3xl">🏐</span>
            </div>
            <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Volleyball Workout Plan
            </h1>
            <p class="text-lg text-gray-600">What would you like to focus on?</p>
            <div class="flex items-center justify-center gap-2 mt-4">
              <div class="w-2 h-2 rounded-full bg-blue-500"></div>
              <div class="w-2 h-2 rounded-full bg-gray-300"></div>
              <div class="w-2 h-2 rounded-full bg-gray-300"></div>
              <div class="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>
          </div>

          {/* Skills Grid */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {skills.map((skill, index) => (
              <button
                key={skill.id}
                onClick={() => handleSkillSelect(skill.id)}
                class="group relative bg-white p-6 rounded-2xl shadow-md hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 text-left border-2 border-transparent hover:border-blue-400"
                style={`animation: slide-up 0.5s ease-out ${index * 0.1}s both`}
              >
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span class="text-3xl">{skill.icon}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {skill.name}
                    </h3>
                    <p class="text-sm text-gray-600">{skill.description}</p>
                  </div>
                  <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Screen 2: Training Schedule Configuration
  if (currentScreen.value === 2) {
    const selectedSkill = getSelectedSkill();
    return (
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl mx-auto">
          {/* Header */}
          <div class="mb-8">
            <button
              onClick={goToPreviousScreen}
              class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6 group transition-all"
            >
              <svg class="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span class="text-2xl">{selectedSkill?.icon}</span>
                </div>
                <div>
                  <p class="text-sm text-gray-500 font-medium">Selected Focus</p>
                  <h2 class="text-2xl font-bold text-gray-900">{selectedSkill?.name}</h2>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-center gap-2 mb-8">
              <div class="w-2 h-2 rounded-full bg-gray-300"></div>
              <div class="w-2 h-2 rounded-full bg-blue-500"></div>
              <div class="w-2 h-2 rounded-full bg-gray-300"></div>
              <div class="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>
          </div>

          {/* Training Duration */}
          <div class="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
            <label class="block mb-6">
              <span class="text-lg font-bold text-gray-900 mb-2 block">
                How many weeks do you want to train?
              </span>
              <span class="text-sm text-gray-600 block mb-4">Choose your training duration</span>
              <div class="relative">
                <select
                  value={plan.value.weeks}
                  onChange={(e) =>
                    handleWeeksChange(parseInt((e.target as HTMLSelectElement).value))}
                  class="w-full p-4 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none text-lg font-semibold appearance-none bg-white cursor-pointer transition-all"
                >
                  {weekOptions.map((weeks) => (
                    <option key={weeks} value={weeks}>
                      {weeks} {weeks === 1 ? 'week' : 'weeks'}
                    </option>
                  ))}
                </select>
                <svg class="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </label>
          </div>

          {/* Training Days */}
          <div class="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
            <label class="block mb-6">
              <span class="text-lg font-bold text-gray-900 mb-2 block">
                What days of the week will you train?
              </span>
              <span class="text-sm text-gray-600 block mb-4">Select one or more days</span>
            </label>

            <div class="grid grid-cols-7 gap-2 sm:gap-3 mb-6">
              {daysOfWeek.map((day) => {
                const isSelected = plan.value.days.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    class={`relative p-3 sm:p-4 rounded-xl font-bold transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div class="text-center">
                      <div class="text-xs sm:text-sm">{day}</div>
                      {isSelected && (
                        <div class="text-base sm:text-lg mt-1">✓</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div class="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-xl">
              <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <p class="text-blue-900 font-semibold">
                {plan.value.days.length} day{plan.value.days.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              onClick={goToPreviousScreen}
              class="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              Back
            </button>
            <button
              onClick={goToNextScreen}
              disabled={plan.value.days.length === 0}
              class={`flex-1 px-6 py-4 font-bold rounded-xl transition-all duration-200 ${
                plan.value.days.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 3: Exercise Selection
  if (currentScreen.value === 3) {
    const selectedSkill = getSelectedSkill();
    return (
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
        <div class="max-w-4xl mx-auto">
          {/* Header */}
          <div class="mb-8">
            <button
              onClick={goToPreviousScreen}
              class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6 group transition-all"
            >
              <svg class="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span class="text-2xl">{selectedSkill?.icon}</span>
                </div>
                <div class="flex-1">
                  <p class="text-sm text-gray-500 font-medium">Your Plan</p>
                  <div class="flex flex-wrap items-center gap-2 mt-1">
                    <span class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {selectedSkill?.name}
                    </span>
                    <span class="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                      {plan.value.weeks} weeks
                    </span>
                    <span class="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      {plan.value.days.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-center gap-2 mb-8">
              <div class="w-2 h-2 rounded-full bg-gray-300"></div>
              <div class="w-2 h-2 rounded-full bg-gray-300"></div>
              <div class="w-2 h-2 rounded-full bg-blue-500"></div>
              <div class="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>

            <div class="text-center mb-8">
              <h2 class="text-3xl font-bold text-gray-900 mb-2">
                Choose Your Exercises
              </h2>
              <p class="text-gray-600">Select exercises that match your fitness level</p>
            </div>
          </div>

          {/* Easy Exercises */}
          <div class="mb-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex-1 h-1 bg-gradient-to-r from-green-200 to-green-400 rounded"></div>
              <h3 class="text-xl font-bold text-green-700 flex items-center gap-2">
                <span class="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg text-sm">⭐</span>
                EASY
              </h3>
              <div class="flex-1 h-1 bg-gradient-to-l from-green-200 to-green-400 rounded"></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getExercisesByDifficulty('easy').map((exercise) => {
                const isSelected = plan.value.exercises.includes(exercise.id);
                return (
                  <label
                    key={exercise.id}
                    class={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-green-50 border-2 border-green-500 shadow-md'
                        : 'bg-white border-2 border-gray-200 hover:border-green-300 hover:shadow-md'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleExercise(exercise.id)}
                      class="mt-1 w-5 h-5 text-green-500 rounded"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="font-bold text-gray-900 mb-1">
                        {exercise.name}
                      </div>
                      <div class="flex items-center gap-2 text-sm text-gray-600">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                          </svg>
                          {exercise.duration} min
                        </span>
                        <span>• {exercise.description}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Medium Exercises */}
          <div class="mb-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex-1 h-1 bg-gradient-to-r from-orange-200 to-orange-400 rounded"></div>
              <h3 class="text-xl font-bold text-orange-700 flex items-center gap-2">
                <span class="inline-flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg text-sm">⭐⭐</span>
                MEDIUM
              </h3>
              <div class="flex-1 h-1 bg-gradient-to-l from-orange-200 to-orange-400 rounded"></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getExercisesByDifficulty('medium').map((exercise) => {
                const isSelected = plan.value.exercises.includes(exercise.id);
                return (
                  <label
                    key={exercise.id}
                    class={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-orange-50 border-2 border-orange-500 shadow-md'
                        : 'bg-white border-2 border-gray-200 hover:border-orange-300 hover:shadow-md'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleExercise(exercise.id)}
                      class="mt-1 w-5 h-5 text-orange-500 rounded"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="font-bold text-gray-900 mb-1">
                        {exercise.name}
                      </div>
                      <div class="flex items-center gap-2 text-sm text-gray-600">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                          </svg>
                          {exercise.duration} min
                        </span>
                        <span>• {exercise.description}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Hard Exercises */}
          <div class="mb-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex-1 h-1 bg-gradient-to-r from-red-200 to-red-400 rounded"></div>
              <h3 class="text-xl font-bold text-red-700 flex items-center gap-2">
                <span class="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg text-sm">⭐⭐⭐</span>
                HARD
              </h3>
              <div class="flex-1 h-1 bg-gradient-to-l from-red-200 to-red-400 rounded"></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getExercisesByDifficulty('hard').map((exercise) => {
                const isSelected = plan.value.exercises.includes(exercise.id);
                return (
                  <label
                    key={exercise.id}
                    class={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-red-50 border-2 border-red-500 shadow-md'
                        : 'bg-white border-2 border-gray-200 hover:border-red-300 hover:shadow-md'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleExercise(exercise.id)}
                      class="mt-1 w-5 h-5 text-red-500 rounded"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="font-bold text-gray-900 mb-1">
                        {exercise.name}
                      </div>
                      <div class="flex items-center gap-2 text-sm text-gray-600">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                          </svg>
                          {exercise.duration} min
                        </span>
                        <span>• {exercise.description}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Selection Summary */}
          <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div class="flex items-center justify-center gap-3">
              <svg class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <p class="text-xl font-bold text-gray-900">
                {plan.value.exercises.length} exercise{plan.value.exercises.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              onClick={goToPreviousScreen}
              class="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              Back
            </button>
            <button
              onClick={goToNextScreen}
              disabled={plan.value.exercises.length === 0}
              class={`flex-1 px-6 py-4 font-bold rounded-xl transition-all duration-200 ${
                plan.value.exercises.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              Create Plan →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 4: Plan Summary
  if (currentScreen.value === 4) {
    const selectedSkill = getSelectedSkill();
    const selectedExercises = getSelectedExercises();
    const easyExercises = selectedExercises.filter((ex) =>
      ex.difficulty === 'easy'
    );
    const mediumExercises = selectedExercises.filter((ex) =>
      ex.difficulty === 'medium'
    );
    const hardExercises = selectedExercises.filter((ex) =>
      ex.difficulty === 'hard'
    );

    return (
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl mx-auto">
          {/* Header */}
          <div class="mb-8">
            <button
              onClick={goToPreviousScreen}
              class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6 group transition-all"
            >
              <svg class="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div class="flex items-center justify-center gap-2 mb-8">
              <div class="w-2 h-2 rounded-full bg-gray-300"></div>
              <div class="w-2 h-2 rounded-full bg-gray-300"></div>
              <div class="w-2 h-2 rounded-full bg-gray-300"></div>
              <div class="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>

            <div class="text-center mb-8">
              <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-4 shadow-lg">
                <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <h1 class="text-4xl font-bold text-gray-900 mb-2">
                Plan Complete!
              </h1>
              <p class="text-lg text-gray-600">Here's your customized training plan</p>
            </div>
          </div>

          {/* Plan Overview Cards */}
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div class="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span class="text-2xl">{selectedSkill?.icon}</span>
              </div>
              <p class="text-sm text-gray-500 font-medium uppercase mb-1">Focus</p>
              <p class="text-lg font-bold text-gray-900">{selectedSkill?.name}</p>
            </div>

            <div class="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg class="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                </svg>
              </div>
              <p class="text-sm text-gray-500 font-medium uppercase mb-1">Duration</p>
              <p class="text-lg font-bold text-gray-900">{plan.value.weeks} weeks</p>
            </div>

            <div class="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <p class="text-sm text-gray-500 font-medium uppercase mb-1">Days/Week</p>
              <p class="text-lg font-bold text-gray-900">{plan.value.days.length} days</p>
            </div>
          </div>

          {/* Training Schedule */}
          <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
              </svg>
              Training Schedule
            </h3>
            <div class="flex flex-wrap gap-2">
              {plan.value.days.map((day) => (
                <span key={day} class="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold">
                  {day}
                </span>
              ))}
            </div>
          </div>

          {/* Exercises List */}
          <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Exercises ({selectedExercises.length})
            </h3>

            <div class="space-y-4">
              {easyExercises.length > 0 && (
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="inline-flex items-center justify-center w-6 h-6 bg-green-100 rounded text-xs">⭐</span>
                    <h4 class="font-bold text-green-700">Easy ({easyExercises.length})</h4>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {easyExercises.map((ex) => (
                      <div key={ex.id} class="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                        <svg class="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-semibold text-gray-900">{ex.name}</p>
                          <p class="text-xs text-gray-600">{ex.duration} min</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mediumExercises.length > 0 && (
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="inline-flex items-center justify-center w-6 h-6 bg-orange-100 rounded text-xs">⭐⭐</span>
                    <h4 class="font-bold text-orange-700">Medium ({mediumExercises.length})</h4>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mediumExercises.map((ex) => (
                      <div key={ex.id} class="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                        <svg class="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-semibold text-gray-900">{ex.name}</p>
                          <p class="text-xs text-gray-600">{ex.duration} min</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hardExercises.length > 0 && (
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="inline-flex items-center justify-center w-6 h-6 bg-red-100 rounded text-xs">⭐⭐⭐</span>
                    <h4 class="font-bold text-red-700">Hard ({hardExercises.length})</h4>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {hardExercises.map((ex) => (
                      <div key={ex.id} class="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                        <svg class="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-semibold text-gray-900">{ex.name}</p>
                          <p class="text-xs text-gray-600">{ex.duration} min</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Summary */}
          <div class="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-8 mb-6 text-white">
            <h3 class="text-xl font-bold mb-6 text-center">Training Summary</h3>
            <div class="grid grid-cols-2 gap-6">
              <div class="text-center">
                <div class="text-4xl font-bold mb-2">{getTotalDuration()}</div>
                <p class="text-blue-100 text-sm">Minutes per session</p>
              </div>
              <div class="text-center">
                <div class="text-4xl font-bold mb-2">{getTotalSessions()}</div>
                <p class="text-blue-100 text-sm">Total sessions</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              onClick={goToPreviousScreen}
              class="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              ← Edit Plan
            </button>
            <button
              onClick={() => alert('Plan saved! This is a mockup.')}
              class="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Start Training 🎯
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
