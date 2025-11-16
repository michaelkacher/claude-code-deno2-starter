/**
 * Global State Store using Preact Signals
 *
 * Centralized state management for:
 * - Authentication (user, token, role)
 * - Notifications (real-time updates)
 * - WebSocket connection (singleton)
 * - Theme (light/dark mode)
 */

import { computed, signal } from '@preact/signals';
import { IS_BROWSER } from 'fresh/runtime';

// ============================================================================
// Types
// ============================================================================

export interface User {
  email: string;
  role: string;
  emailVerified?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
  readAt?: string;
}

export interface Job {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  attempts: number;
  maxRetries: number;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  priority: number;
}

export interface JobStats {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  total: number;
}

export interface Schedule {
  name: string;
  cron: string;
  enabled: boolean;
  timezone: string;
  nextRun?: string;
  lastRun?: string;
  runCount: number;
}

// ============================================================================
// Authentication State
// ============================================================================

/**
 * Current authenticated user (null if not logged in)
 */
export const user = signal<User | null>(
  IS_BROWSER && localStorage.getItem('user_email')
    ? {
        email: localStorage.getItem('user_email') || '',
        role: localStorage.getItem('user_role') || 'user',
      }
    : null
);

/**
 * Access token for API requests
 */
export const accessToken = signal<string | null>(
  IS_BROWSER ? localStorage.getItem('access_token') : null
);

/**
 * Computed: Is user authenticated?
 */
export const isAuthenticated = computed(() => user.value !== null && accessToken.value !== null);

/**
 * Update user state and persist to localStorage
 */
export function setUser(newUser: User | null) {
  user.value = newUser;

  if (IS_BROWSER) {
    if (newUser) {
      localStorage.setItem('user_email', newUser.email);
      localStorage.setItem('user_role', newUser.role);
    } else {
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_role');
    }
  }
}

/**
 * Update access token and persist to localStorage
 */
export function setAccessToken(token: string | null) {
  accessToken.value = token;

  if (IS_BROWSER) {
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }
}

/**
 * Clear all authentication state
 */
export function clearAuth() {
  user.value = null;
  accessToken.value = null;

  if (IS_BROWSER) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    sessionStorage.removeItem('wsInitialized');
    sessionStorage.removeItem('unreadCount');
    sessionStorage.removeItem('isConnected');
  }
}

// ============================================================================
// Notifications State
// ============================================================================

/**
 * List of notifications (latest 10)
 */
export const notifications = signal<Notification[]>([]);

/**
 * Unread notification count
 */
export const unreadCount = signal<number>(
  IS_BROWSER && sessionStorage.getItem('unreadCount')
    ? parseInt(sessionStorage.getItem('unreadCount')!, 10)
    : 0
);

/**
 * Update unread count and persist to sessionStorage
 */
export function setUnreadCount(count: number) {
  unreadCount.value = count;

  if (IS_BROWSER) {
    sessionStorage.setItem('unreadCount', String(count));
  }
}

/**
 * Add a new notification to the list
 */
export function addNotification(notification: Notification) {
  // Prepend the new notification
  const currentNotifications = notifications.value;
  const newList = [notification, ...currentNotifications];
  
  // Only truncate if we're in "dropdown mode" (showing <= 10 notifications)
  // This allows the full notifications page to work properly
  if (currentNotifications.length <= 10) {
    notifications.value = newList.slice(0, 10);
  } else {
    notifications.value = newList;
  }
  
  if (!notification.read) {
    setUnreadCount(unreadCount.value + 1);
  }
}

/**
 * Mark notification as read
 */
export function markNotificationAsRead(notificationId: string) {
  notifications.value = notifications.value.map(n =>
    n.id === notificationId ? { ...n, read: true } : n
  );
  setUnreadCount(Math.max(0, unreadCount.value - 1));
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead() {
  notifications.value = notifications.value.map(n => ({ ...n, read: true }));
  setUnreadCount(0);
}

/**
 * Remove notification from list
 */
export function removeNotification(notificationId: string) {
  const notification = notifications.value.find(n => n.id === notificationId);
  notifications.value = notifications.value.filter(n => n.id !== notificationId);

  if (notification && !notification.read) {
    setUnreadCount(Math.max(0, unreadCount.value - 1));
  }
}

// ============================================================================
// Job State (Admin Dashboard)
// ============================================================================

/**
 * Current jobs list
 */
export const jobs = signal<Job[]>([]);

/**
 * Job statistics
 */
export const jobStats = signal<JobStats | null>(null);

/**
 * Scheduled jobs
 */
export const schedules = signal<Schedule[]>([]);

/**
 * Update a single job in the list
 */
export function updateJob(updatedJob: Job) {
  const index = jobs.value.findIndex(j => j.id === updatedJob.id);
  if (index !== -1) {
    // Update existing job
    jobs.value = [
      ...jobs.value.slice(0, index),
      updatedJob,
      ...jobs.value.slice(index + 1),
    ];
  } else {
    // New job - add to the beginning
    jobs.value = [updatedJob, ...jobs.value];
  }
}

/**
 * Update job statistics
 */
export function updateJobStats(stats: JobStats) {
  jobStats.value = stats;
}

/**
 * Set jobs list
 */
export function setJobs(newJobs: Job[]) {
  jobs.value = newJobs;
}

/**
 * Set schedules list
 */
export function setSchedules(newSchedules: Schedule[]) {
  schedules.value = newSchedules;
}

// ============================================================================
// WebSocket State
// ============================================================================

/**
 * WebSocket connection (singleton)
 */
export const wsConnection = signal<WebSocket | null>(null);

/**
 * Is WebSocket connected?
 */
export const isWsConnected = signal<boolean>(
  IS_BROWSER && sessionStorage.getItem('isConnected') === 'true'
);

/**
 * Update WebSocket connection status
 */
export function setWsConnected(connected: boolean) {
  isWsConnected.value = connected;

  if (IS_BROWSER) {
    sessionStorage.setItem('isConnected', String(connected));
  }
}

// ============================================================================
// Theme State
// ============================================================================

/**
 * Current theme (light or dark)
 */
export const theme = signal<'light' | 'dark'>(
  IS_BROWSER && localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
);

/**
 * Computed: Is dark mode enabled?
 */
export const isDarkMode = computed(() => theme.value === 'dark');

/**
 * Toggle theme between light and dark
 */
export function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';

  if (IS_BROWSER) {
    localStorage.setItem('theme', theme.value);

    // Update document class for CSS
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

/**
 * Set theme explicitly
 */
export function setTheme(newTheme: 'light' | 'dark') {
  theme.value = newTheme;

  if (IS_BROWSER) {
    localStorage.setItem('theme', newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
