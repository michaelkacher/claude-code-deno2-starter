/**
 * Admin Header Actions Island
 * Dynamic admin navigation and logout functionality
 */

import { IS_BROWSER } from 'fresh/runtime';
import { TokenStorage } from '../lib/storage.ts';

interface AdminHeaderActionsProps {
  currentPage: 'users' | 'data' | 'jobs';
}

export default function AdminHeaderActions({ currentPage }: AdminHeaderActionsProps) {
  const handleLogout = () => {
    if (!IS_BROWSER) return;
    
    // Clear auth tokens using storage abstraction
    TokenStorage.clearAuth();
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redirect to login
    window.location.href = '/login';
  };

  const getLinkClass = (page: string) => {
    const baseClass = 'px-4 py-2 rounded-lg transition-colors font-medium';
    if (page === currentPage) {
      return `${baseClass} bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300`;
    }
    return `${baseClass} text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`;
  };

  return (
    <div class="flex gap-2 items-center">
      <a href="/admin/users" class={getLinkClass('users')}>
        Users
      </a>
      <a href="/admin/data" class={getLinkClass('data')}>
        Data Browser
      </a>
      <a href="/admin/jobs" class={getLinkClass('jobs')}>
        Jobs
      </a>
      
    </div>
  );
}

