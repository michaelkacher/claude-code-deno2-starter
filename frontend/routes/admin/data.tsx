/**
 * Admin Data Browser Page
 * Protected route for viewing Deno KV storage models
 */

import { PageProps } from '$fresh/server.ts';
import {
  AdminNavLink,
  ContentContainer,
  PageContainer,
  PageHeader
} from '../../components/common/index.ts';
import AdminDataBrowser from '../../islands/AdminDataBrowser.tsx';

export default function AdminDataPage(props: PageProps) {
  return (
    <PageContainer>
      <PageHeader
        title="Data Browser"
        subtitle="View and filter all models in Deno KV storage"
        actions={<>
          <AdminNavLink href="/admin/users">Users</AdminNavLink>
          <AdminNavLink href="/admin/jobs">Jobs</AdminNavLink>
          <button
            onClick="document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; localStorage.clear(); window.location.href = '/login';"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </>}
      />

      <ContentContainer>
        <AdminDataBrowser />
      </ContentContainer>
    </PageContainer>
  );
}
