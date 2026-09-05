import { isNativeApp } from './platform';

/**
 * Production API origin used as a safe fallback when running inside native Capacitor
 * where relative /api endpoints would otherwise hit the local device scheme.
 */
const DEFAULT_PRODUCTION_API_ORIGIN = 'https://kingjdeals.site';

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

