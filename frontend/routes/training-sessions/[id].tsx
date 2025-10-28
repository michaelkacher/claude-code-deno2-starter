/**
 * Training Session Route
 * Page for tracking and managing a training session
 */

import { Head } from '$fresh/runtime.ts';
import { PageProps } from '$fresh/server.ts';
import { PageLayout, PageHeader } from '../../components/design-system/index.ts';
import SessionTracker from '../../islands/SessionTracker.tsx';

export default function TrainingSessionPage(props: PageProps) {
  const sessionId = props.params.id;

  return (
    <>
      <Head>
        <title>Training Session - Volleyball Training</title>
        <meta
          name="description"
          content="Track your volleyball training session progress"
        />
      </Head>

      <PageLayout maxWidth="xl">
        <PageHeader
          title="Training Session"
          backButton={true}
          onBack={() => {
            if (typeof window !== 'undefined') {
              window.history.back();
            }
          }}
        />

        <SessionTracker sessionId={sessionId} />
      </PageLayout>
    </>
  );
}
