/**
 * Workout Plan Creation Route
 * Page for creating a new volleyball workout plan
 */

import { Head } from '$fresh/runtime.ts';
import { PageLayout, PageHeader } from '../../components/design-system/index.ts';
import WorkoutPlanWizard from '../../islands/WorkoutPlanWizard.tsx';

export default function CreateWorkoutPlanPage() {
  return (
    <>
      <Head>
        <title>Create Workout Plan - Volleyball Training</title>
        <meta
          name="description"
          content="Create your personalized volleyball workout plan"
        />
      </Head>

      <PageLayout maxWidth="xl">
        <PageHeader
          title="Volleyball Workout Plan"
          subtitle="Create your personalized training program"
          backButton={true}
          onBack={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/workout-plans';
            }
          }}
        />

        <WorkoutPlanWizard />
      </PageLayout>
    </>
  );
}
