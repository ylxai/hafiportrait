/**
 * Authentication Hook
 * Manages authentication state and provides auth functions
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  last_login: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const router = useRouter();

  // Helper function to get base URL with environment detection
  const getBaseUrl = useCallback(() => {
    // Client-side: use current origin (works for IP access)
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return window.location.origin;
    }
    
    // Server-side: use environment variables as fallback
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    
    // Development fallback
    return 'http://localhost:3000';
  }, []);

  // Helper function for API calls with retry and timeout
  const makeAuthRequest = useCallback(async (
    endpoint: string, 
    options: RequestInit = {}, 
    retries = 2
  ): Promise<Response> => {
    const baseUrl = getBaseUrl();
    
    for (let i = 0; i <= retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${baseUrl}${endpoint}`, {
          ...options,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        console.warn(`API request attempt ${i + 1} failed:`, error);
        
        if (i === retries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 500));
      }
    }
    
    throw new Error('All retry attempts failed');
  }, [getBaseUrl]);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 checkAuth: Starting auth check...');
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await makeAuthRequest('/api/auth/me', { method: 'GET' });
      console.log('🔍 checkAuth: Response status:', response.status);
      
      // Log auth check event for monitoring
      if (typeof window !== 'undefined') {
        fetch('/api/admin/session/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            session_id: 'current',
            user_id: 0,
            event_type: 'auth_check',
            metadata: { timestamp: new Date().toISOString() }
          })
        }).catch(() => {}); // Silent fail for monitoring
      }

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.user) {
          setState(prev => ({
            ...prev,
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          }));
        } else {
          throw new Error('Invalid response structure');
        }
      } else if (response.status === 401) {
        // Unauthorized - clear auth state
        setState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null, // Don't show error for unauthorized
        }));
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('Auth check failed:', error);
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null, // Don't show error, just set loading to false
      }));
    }
  }, [makeAuthRequest]);

  // Login function
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    // Input validation
    if (!username?.trim() || !password?.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Username and password are required',
        isLoading: false,
      }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await makeAuthRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setState(prev => ({
          ...prev,
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }));
        return true;
      } else {
        const errorMessage = data.error || `Login failed (${response.status})`;
        setState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          error: errorMessage,
          isLoading: false,
        }));
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error && error.name === 'AbortError'
        ? 'Login timeout. Please check your connection.'
        : 'Network error. Please try again.';
        
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        error: errorMessage,
        isLoading: false,
      }));
      return false;
    }
  }, [makeAuthRequest]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Try to call logout API, but don't fail if it doesn't work
      try {
        await makeAuthRequest('/api/auth/logout', { method: 'POST' }, 1); // Single retry
      } catch (error) {
        console.warn('Logout API call failed, proceeding with local logout:', error);
      }

      // Always clear local state regardless of API call result
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      // Clear any cached data or local storage if needed
      if (typeof window !== 'undefined') {
        // Clear any local storage items related to auth
        localStorage.removeItem('auth_cache');
        sessionStorage.removeItem('auth_cache');
      }

      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if logout fails, clear local state and redirect
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      
      router.push('/admin/login');
    }
  }, [router, makeAuthRequest]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []); // Remove checkAuth dependency to prevent infinite loop
  
  // Timeout fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (state.isLoading) {
        console.warn('Auth check timeout, setting loading to false');
        setState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
          error: null
        }));
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeout);
  }, [state.isLoading]);

  return {
    ...state,
    login,
    logout,
    checkAuth,
    clearError,
  };
}

/**
 * Hook for checking if user has specific permission
 */
export function usePermission(permission: string): boolean {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return false;
  }

  // Superadmin has all permissions
  if (user.role === 'superadmin') {
    return true;
  }

  // Add more role-based permission logic here
  return false;
}

/**
 * Hook for protecting components that require authentication
 */
export function useRequireAuth(redirectTo: string = '/admin/login'): AuthState & AuthActions {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    // and we're not still loading
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Add current path as redirect parameter
      const currentPath = typeof window !== 'undefined' && window.location && window.location.pathname ? window.location.pathname : '';
      
      // Don't redirect if we're already on the login page
      if (currentPath === redirectTo) {
        return;
      }
      
      const redirectUrl = currentPath && currentPath !== redirectTo 
        ? `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
        : redirectTo;
      
      console.log('useRequireAuth: Redirecting to login, current path:', currentPath);
      router.push(redirectUrl);
    }
  }, [auth.isLoading, auth.isAuthenticated, router, redirectTo]);

  return auth;
}

/**
 * Hook for components that should only be accessible to unauthenticated users
 * (like login page)
 */
export function useRequireGuest(redirectTo: string = '/admin'): AuthState & AuthActions {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect to admin
    if (!auth.isLoading && auth.isAuthenticated) {
      // Check for redirect parameter in URL
      const urlParams = typeof window !== 'undefined' && window.location && window.location.search
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();
      const redirect = urlParams.get('redirect');
      const targetUrl = redirect && redirect.startsWith('/') ? redirect : redirectTo;
      
      router.push(targetUrl);
    }
  }, [auth.isLoading, auth.isAuthenticated, router, redirectTo]);

  return auth;
}

/**
 * Hook for checking authentication status without automatic redirects
 */
export function useAuthStatus(): AuthState {
  const { user, isLoading, isAuthenticated, error } = useAuth();
  
  return {
    user,
    isLoading,
    isAuthenticated,
    error,
  };
}