/**
 * Workout Plans Dashboard Route
 * Lists all workout plans for the authenticated user
 */

import { Head } from '$fresh/runtime.ts';
import { PageLayout, PageHeader, Button } from '../../components/design-system/index.ts';
import WorkoutPlanList from '../../islands/WorkoutPlanList.tsx';

export default function WorkoutPlansDashboard() {
  return (
    <>
      <Head>
        <title>My Workout Plans - Volleyball Training</title>
        <meta
          name="description"
          content="View and manage your volleyball workout plans"
        />
      </Head>

      <PageLayout maxWidth="xl">
        <PageHeader
          title="My Workout Plans"
          subtitle="View and manage your volleyball training programs"
          action={
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/workout-plans/create';
                }
              }}
            >
              Create New Plan
            </Button>
          }
        />

        <WorkoutPlanList />
      </PageLayout>
    </>
  );
}
