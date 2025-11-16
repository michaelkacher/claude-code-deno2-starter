/**
 * Admin Jobs Dashboard Page
 * Protected route for managing background jobs and schedules
 */

import { PageProps } from 'fresh';
import {
    ContentContainer,
    PageContainer,
    PageHeader
} from '../../components/common/index.ts';
import JobDashboard from '../../islands/admin/JobDashboard.tsx';
import AdminHeaderActions from '../../islands/AdminHeaderActions.tsx';

export default function AdminJobsPage(props: PageProps) {
  return (
    <PageContainer>
      <PageHeader
        title="Background Jobs"
        subtitle="Monitor and manage background jobs and scheduled tasks"
        actions={<AdminHeaderActions currentPage="jobs" />}
      />

      <ContentContainer>
        <JobDashboard />
      </ContentContainer>
    </PageContainer>
  );
}
