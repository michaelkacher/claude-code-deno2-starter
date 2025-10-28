/**
 * Workout Plan Detail Route
 * Displays detailed information about a specific workout plan
 */

import { Head } from '$fresh/runtime.ts';
import { PageProps } from '$fresh/server.ts';
import { PageLayout, PageHeader } from '../../components/design-system/index.ts';
import WorkoutPlanDetail from '../../islands/WorkoutPlanDetail.tsx';

export default function WorkoutPlanDetailPage(props: PageProps) {
  const planId = props.params.id;

  return (
    <>
      <Head>
        <title>Workout Plan Details - Volleyball Training</title>
        <meta
          name="description"
          content="View your volleyball workout plan details and training sessions"
        />
      </Head>

      <PageLayout maxWidth="xl">
        <PageHeader
          title="Workout Plan Details"
          backButton={true}
          onBack={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/workout-plans';
            }
          }}
        />

        <WorkoutPlanDetail planId={planId} />
      </PageLayout>
    </>
  );
}
