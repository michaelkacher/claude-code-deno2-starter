/**
 * Admin Data Browser Page
 * Protected route for viewing Deno KV storage models
 */

import {
  ContentContainer,
  PageContainer,
  PageHeader
} from '@/components/common/index.ts';
import AdminDataBrowser from '@/islands/AdminDataBrowser.tsx';
import AdminHeaderActions from '@/islands/AdminHeaderActions.tsx';
import { PageProps } from 'fresh';

export default function AdminDataPage(props: PageProps) {
  return (
    <PageContainer>
      <PageHeader
        title="Data Browser"
        subtitle="View and filter all models in Deno KV storage"
        actions={<AdminHeaderActions currentPage="data" />}
      />

      <ContentContainer>
        <AdminDataBrowser />
      </ContentContainer>
    </PageContainer>
  );
}

