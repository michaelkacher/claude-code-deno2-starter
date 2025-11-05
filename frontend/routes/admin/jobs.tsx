/**
 * Admin Jobs Dashboard Page
 * Protected route for managing background jobs and schedules
 */

import { PageProps } from '$fresh/server.ts';
import {
  AdminNavLink,
  ContentContainer,
  PageContainer,
  PageHeader
} from '../../components/common/index.ts';
import JobDashboard from '../../islands/admin/JobDashboard.tsx';

export default function AdminJobsPage(props: PageProps) {
  return (
    <PageContainer>
      <PageHeader
        title="Background Jobs"
        subtitle="Monitor and manage background jobs and scheduled tasks"
        actions={<>
          <AdminNavLink href="/admin/users">Users</AdminNavLink>
          <AdminNavLink href="/admin/data">Data</AdminNavLink>
          <button
            onClick="document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; localStorage.clear(); window.location.href = '/login';"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </>}
      />

      <ContentContainer>
        <JobDashboard />
      </ContentContainer>
    </PageContainer>
  );
}
