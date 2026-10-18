import { useEffect } from 'react';

/**
 * Session timeout hook - 5-minute inactivity auto-logout has been completely removed.
 * Customers remain signed in until they explicitly click sign out or log out.
 */
export function useSessionTimeout(_user?: any) {
  useEffect(() => {
    // Clean up any legacy inactivity tracking key from browser storage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('kj_session_last_active_at');
      } catch {
        // Ignore storage exceptions
      }
    }
  }, []);
}
