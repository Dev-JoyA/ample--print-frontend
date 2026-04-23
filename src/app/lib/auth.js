import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { COOKIE_NAMES } from '../../lib/constants';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';
const VERIFY_PATH = '/auth/verify-token';
const REFRESH_PATH = '/auth/refresh-token';

const secure = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';

/**
 * Server-side: protect a route by verifying the token cookie. Redirects to sign-in if invalid.
 */
export async function protectRoute() {
  const { cookies } = await import('next/headers');
  const token = cookies().get(COOKIE_NAMES.TOKEN)?.value;

  if (!token) {
    redirect('/auth/sign-in');
  }

  try {
    const res = await fetch(`${API_BASE_URL}${VERIFY_PATH}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error('Invalid token');
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Protect route error:', error?.message);
    redirect('/auth/sign-in');
  }
}

/**
 * Client-side hook: verify token with backend and redirect if invalid.
 * This actually verifies the token with the backend.
 */
export function useAuthCheck(options = {}) {
  const router = useRouter();
  const { redirectTo = '/auth/sign-in', onError, onSuccess } = options;
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const verifyTokenWithBackend = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${COOKIE_NAMES.TOKEN}=`))
          ?.split('=')[1];

        if (!token) {
          console.warn('No token found, redirecting to sign-in page');
          router.push(redirectTo);
          setIsVerifying(false);
          return;
        }

        // Actually verify the token with the backend
        const res = await fetch(`${API_BASE_URL}${VERIFY_PATH}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(`Token verification failed with status ${res.status}`);
        }

        const data = await res.json();

        // Extract user info from response
        const userData = data.user || data.data?.user || data;
        setUser(userData);
        setIsValid(true);

        if (onSuccess) {
          onSuccess(userData);
        }
      } catch (error) {
        console.error('Authentication error:', error?.message);

        // Clear cookies on verification failure
        document.cookie = `${COOKIE_NAMES.TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${secure ? 'secure;' : ''} sameSite=strict`;
        document.cookie = `${COOKIE_NAMES.REFRESH_TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${secure ? 'secure;' : ''} sameSite=strict`;

        if (onError) {
          onError(error);
        } else {
          router.push(redirectTo);
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verifyTokenWithBackend();
  }, [router, redirectTo, onError, onSuccess]);

  return { isVerifying, isValid, user };
}

/**
 * Hook to get user info from token (client-side only)
 * Does NOT verify with backend - use useAuthCheck for verification
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${COOKIE_NAMES.TOKEN}=`))
          ?.split('=')[1];

        if (token) {
          try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            setUser(decoded);
            setIsAuthenticated(true);
            setError(null);
          } catch (e) {
            console.error('Failed to decode token:', e);
            setIsAuthenticated(false);
            setUser(null);
            setError('Invalid token format');
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setError('No token found');
        }
      } catch (e) {
        console.error('Auth check error:', e);
        setError('Authentication check failed');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { user, isAuthenticated, loading, error };
}

/**
 * Hook that combines both token verification and user info
 * This is the recommended hook to use in protected pages
 */
export function useProtectedRoute(options = {}) {
  const authCheck = useAuthCheck(options);
  const auth = useAuth();

  return {
    ...authCheck,
    ...auth,
    isLoading: authCheck.isVerifying || auth.loading,
  };
}

/**
 * Refresh access token using refresh token from cookie. Call from client when API returns 401.
 * Sets new token (and refreshToken if returned) in cookies. Redirects to sign-in on failure.
 */
export async function refreshToken() {
  const refreshTokenValue =
    typeof document !== 'undefined'
      ? document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${COOKIE_NAMES.REFRESH_TOKEN}=`))
          ?.split('=')[1]
      : null;

  if (!refreshTokenValue) {
    if (typeof window !== 'undefined') {
      document.cookie = `${COOKIE_NAMES.TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${secure ? 'secure;' : ''} sameSite=strict`;
      document.cookie = `${COOKIE_NAMES.REFRESH_TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${secure ? 'secure;' : ''} sameSite=strict`;
      window.location.href = '/auth/sign-in';
    }
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    const newToken = data.token ?? data.accessToken;
    const newRefresh = data.refreshToken;

    if (typeof document !== 'undefined' && newToken) {
      document.cookie = `${COOKIE_NAMES.TOKEN}=${encodeURIComponent(newToken)}; path=/; max-age=3600; ${secure ? 'secure;' : ''} sameSite=strict`;
      if (newRefresh) {
        document.cookie = `${COOKIE_NAMES.REFRESH_TOKEN}=${encodeURIComponent(newRefresh)}; path=/; max-age=604800; ${secure ? 'secure;' : ''} sameSite=strict`;
      }
    }

    return true;
  } catch (error) {
    console.error('Refresh token error:', error?.message);
    if (typeof document !== 'undefined') {
      document.cookie = `${COOKIE_NAMES.TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${secure ? 'secure;' : ''} sameSite=strict`;
      document.cookie = `${COOKIE_NAMES.REFRESH_TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${secure ? 'secure;' : ''} sameSite=strict`;
      window.location.href = '/auth/sign-in';
    }
    return false;
  }
}

/**
 * Set auth cookies (token and optionally refreshToken). Use after sign-in/sign-up.
 */
export function setAuthCookies(token, refreshToken) {
  if (typeof document === 'undefined') return;

  const tokenOpts = `path=/; max-age=3600; ${secure ? 'secure;' : ''} sameSite=strict`;
  document.cookie = `${COOKIE_NAMES.TOKEN}=${encodeURIComponent(token)}; ${tokenOpts}`;

  if (refreshToken) {
    const refreshOpts = `path=/; max-age=604800; ${secure ? 'secure;' : ''} sameSite=strict`;
    document.cookie = `${COOKIE_NAMES.REFRESH_TOKEN}=${encodeURIComponent(refreshToken)}; ${refreshOpts}`;
  }
}

/**
 * Clear auth cookies (logout)
 */
export function clearAuthCookies() {
  if (typeof document === 'undefined') return;

  document.cookie = `${COOKIE_NAMES.TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${secure ? 'secure;' : ''} sameSite=strict`;
  document.cookie = `${COOKIE_NAMES.REFRESH_TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${secure ? 'secure;' : ''} sameSite=strict`;
}

/**
 * Get user role from token (client-side only)
 */
export function getUserRole() {
  try {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${COOKIE_NAMES.TOKEN}=`))
      ?.split('=')[1];

    if (!token) return null;

    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded?.role || null;
  } catch (e) {
    console.error('Failed to get user role:', e);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(requiredRole) {
  const userRole = getUserRole();
  if (!userRole) return false;

  // Handle array of roles
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }

  return userRole === requiredRole;
}
