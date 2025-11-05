/**
 * User Profile Dropdown Island
 * Integrates user authentication, notifications, and profile management
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useEffect, useRef, useState } from 'preact/hooks';

interface Notification {
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

export default function UserProfileDropdown() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Check authentication status
  useEffect(() => {
    if (!IS_BROWSER) return;
    
    const token = localStorage.getItem('access_token');
    const email = localStorage.getItem('user_email');
    const role = localStorage.getItem('user_role');
    
    if (token && email) {
      setUserEmail(email);
      setUserRole(role);
      fetchNotifications();
      connectWebSocket();
    } else {
      // User is not authenticated, clean up any existing connections
      cleanupWebSocket();
      setUserEmail(null);
      setUserRole(null);
      setNotifications([]);
      setUnreadCount(0);
    }
    setIsLoading(false);
  }, []);

  // Cleanup WebSocket connections when component unmounts or user logs out
  useEffect(() => {
    if (!IS_BROWSER) return;

    return () => {
      cleanupWebSocket();
    };
  }, []);

  // Helper function to clean up WebSocket connections
  const cleanupWebSocket = () => {
    // Close existing WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Update connection status
    setIsConnected(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!IS_BROWSER) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // WebSocket connection for real-time notifications
  const connectWebSocket = () => {
    if (!IS_BROWSER) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      // No token available, don't attempt connection
      cleanupWebSocket();
      return;
    }

    try {
      const wsUrl = window.location.origin
        .replace('http://', 'ws://')
        .replace('https://', 'wss://')
        .replace(':3000', ':8000');
      wsRef.current = new WebSocket(`${wsUrl}/api/notifications/ws`);

      wsRef.current.onopen = () => {
        // Connection opened, wait for auth_required message
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'auth_required':
              // Server is requesting authentication - send token
              if (wsRef.current && token) {
                wsRef.current.send(JSON.stringify({
                  type: 'auth',
                  token: token,
                }));
              }
              break;
              
            case 'connected':
              // Successfully authenticated
              setIsConnected(true);
              if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
              }
              break;
              
            case 'auth_failed':
              // Authentication failed
              console.error('WebSocket authentication failed');
              cleanupWebSocket();
              break;
              
            case 'unread_count':
              // Initial unread count
              setUnreadCount(data.unreadCount || 0);
              break;
              
            case 'notification_update':
              // New notification or count update
              if (data.unreadCount !== undefined) {
                setUnreadCount(data.unreadCount);
              }
              if (data.latestNotifications) {
                setNotifications(data.latestNotifications);
              }
              break;
              
            case 'notification':
              // Single new notification (legacy support)
              setNotifications(prev => [data.notification, ...prev.slice(0, 9)]);
              setUnreadCount(prev => prev + 1);
              break;
              
            case 'notification_read':
              // Notification marked as read (legacy support)
              setNotifications(prev => 
                prev.map(n => n.id === data.notificationId ? { ...n, read: true } : n)
              );
              setUnreadCount(prev => Math.max(0, prev - 1));
              break;
              
            case 'ping':
              // Server heartbeat - respond with pong
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'pong' }));
              }
              break;
              
            case 'pong':
              // Heartbeat response (we don't send pings, only respond to them)
              break;
              
            case 'new_notification':
              // Direct notification push (used by test scripts)
              if (data.notification) {
                setNotifications(prev => [data.notification, ...prev.slice(0, 9)]);
                setUnreadCount(prev => prev + 1);
              }
              break;
              
            default:
              console.log('Unknown WebSocket message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        
        // Only attempt reconnection if user is still authenticated
        const currentToken = localStorage.getItem('access_token');
        if (currentToken && userEmail) {
          // Reconnect after delay only if user is still logged in
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        } else {
          // User is no longer authenticated, stop reconnection attempts
          cleanupWebSocket();
        }
      };

      wsRef.current.onerror = (error) => {
        setIsConnected(false);
        console.error('WebSocket error:', error);
        
        // Check if this is an authentication error (429 often indicates rate limiting due to auth issues)
        const currentToken = localStorage.getItem('access_token');
        if (!currentToken || !userEmail) {
          // Stop reconnection attempts if no auth
          cleanupWebSocket();
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!IS_BROWSER) return;
    
    const token = localStorage.getItem('access_token');
    if (!token || !userEmail) {
      // User is not authenticated, don't fetch notifications
      return;
    }
    
    setIsNotificationsLoading(true);
    try {
      const apiUrl = window.location.origin.replace(':3000', ':8000');

      const response = await fetch(`${apiUrl}/api/notifications?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else if (response.status === 401) {
        // Token is invalid, clean up auth state
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!IS_BROWSER) return;

    const token = localStorage.getItem('access_token');
    if (!token || !userEmail) {
      // User is not authenticated, don't attempt to mark as read
      return;
    }

    try {
      const apiUrl = window.location.origin.replace(':3000', ':8000');

      const response = await fetch(`${apiUrl}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else if (response.status === 401) {
        // Token is invalid, clean up auth state
        handleLogout();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (!IS_BROWSER) return;
    
    // Clean up WebSocket connections immediately
    cleanupWebSocket();
    
    try {
      const apiUrl = window.location.origin.replace(':3000', ':8000');
      
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear auth data
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    
    // Clear cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
    
    // Clear component state
    setUserEmail(null);
    setUserRole(null);
    setNotifications([]);
    setUnreadCount(0);
    
    // Redirect to home
    window.location.href = '/';
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Format time ago
  const timeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div class="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
    );
  }

  // Not logged in
  if (!userEmail) {
    return (
      <a
        href="/login"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Login
      </a>
    );
  }

  // Logged in - show profile dropdown
  return (
    <div class="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={toggleDropdown}
        class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* Avatar with notification indicator */}
        <div class="relative">
          <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          {unreadCount > 0 && (
            <div class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span class="text-xs text-white font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </div>
          )}
          {isConnected && (
            <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          )}
        </div>
        
        {/* Dropdown Arrow */}
        <svg
          class={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* User Info Header */}
          <div class="px-4 py-3 border-b border-gray-200">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
                <p class="text-xs text-gray-500 capitalize">{userRole || 'user'}</p>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div class="px-4 py-3 border-b border-gray-200">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span class="text-xs text-blue-600 font-medium">{unreadCount} unread</span>
              )}
            </div>
            
            {isNotificationsLoading ? (
              <div class="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} class="h-12 bg-gray-100 animate-pulse rounded"></div>
                ))}
              </div>
            ) : notifications.length > 0 ? (
              <div class="space-y-2 max-h-48 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    class={`p-2 rounded cursor-pointer transition-colors ${
                      notification.read 
                        ? 'bg-gray-50 hover:bg-gray-100' 
                        : 'bg-blue-50 hover:bg-blue-100 border-l-2 border-blue-500'
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      if (notification.link) {
                        window.location.href = notification.link;
                      }
                    }}
                  >
                    <div class="flex justify-between items-start">
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p class="text-xs text-gray-600 truncate">
                          {notification.message}
                        </p>
                      </div>
                      <span class="text-xs text-gray-400 ml-2">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p class="text-xs text-gray-500 text-center py-4">No notifications</p>
            )}
            
            {notifications.length > 0 && (
              <a
                href="/notifications"
                class="block text-center text-xs text-blue-600 hover:text-blue-700 mt-2 py-1"
              >
                View all notifications
              </a>
            )}
          </div>

          {/* Actions */}
          <div class="px-4 py-3">
            <div class="space-y-1">
              {userRole === 'admin' && (
                <a
                  href="/admin/users"
                  class="block w-full text-left px-3 py-2 text-sm text-purple-700 hover:bg-purple-50 rounded transition-colors"
                >
                  🛠️ Admin Panel
                </a>
              )}
              <a
                href="/profile"
                class="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
              >
                👤 Profile Settings
              </a>
              <button
                onClick={handleLogout}
                class="block w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}