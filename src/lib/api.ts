import { isNativeApp } from './platform';
import { auth } from './firebase';

/**
 * Production API origin used as a safe fallback when running inside native Capacitor
 * where relative /api endpoints would otherwise hit the local device scheme.
 */
const DEFAULT_PRODUCTION_API_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://kingjdeals.site';

export const getApiUrl = (endpoint: string): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // 1. Explicitly configured VITE_API_URL takes highest priority
  if (envUrl && envUrl.trim() !== '') {
    const base = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    return `${base}${cleanEndpoint}`;
  }

  // 2. In native mobile app (Capacitor Android/iOS), route to production backend
  if (isNativeApp()) {
    return `${DEFAULT_PRODUCTION_API_ORIGIN}${cleanEndpoint}`;
  }

  // 3. In standard web environment, relative endpoints resolve to the current host
  return cleanEndpoint;
};

export async function getOptionalAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.isAnonymous) {
      const token = await currentUser.getIdToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.warn('[API Auth] Could not attach optional auth token:', err);
  }
  return headers;
}

export async function getRequiredAuthHeaders(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.isAnonymous) {
    throw new Error('Authentication required. Please sign in to continue.');
  }
  const token = await currentUser.getIdToken();
  if (!token) {
    throw new Error('Could not verify your session. Please sign in again.');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}
