import { useEffect, useRef } from 'react';
import { auth } from '@/src/lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes (300,000 ms)
const STORAGE_KEY = 'kj_session_last_active_at';
const THROTTLE_INTERVAL_MS = 1500; // Throttle timestamp updates to avoid unnecessary writes

/**
 * Automatically terminates only the current active Firebase authenticated session
 * if the user has been inactive or away from the site for 5 minutes or more.
 *
 * CRITICAL SAFETY NOTE:
 * This ONLY calls signOut(auth) to terminate the current session.
 * It NEVER deletes, resets, or modifies any Firebase account, Firestore document,
 * wallet balance, orders, or agent profiles.
 */
export function useSessionTimeout(user: any) {
  const lastThrottleRef = useRef<number>(0);
  const isLoggingOutRef = useRef<boolean>(false);

  useEffect(() => {
    if (!user) {
      isLoggingOutRef.current = false;
      return;
    }

    // Protect active payment verifications/redirects
    const isHandlingPayment = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        return (
          params.has('reference') ||
          params.has('trxref') ||
          params.has('orderId') ||
          params.has('order_id') ||
          window.location.pathname.includes('/payment-cancelled')
        );
      } catch {
        return false;
      }
    };

    const recordActivity = () => {
      const now = Date.now();
      if (now - lastThrottleRef.current > THROTTLE_INTERVAL_MS) {
        lastThrottleRef.current = now;
        try {
          localStorage.setItem(STORAGE_KEY, now.toString());
        } catch {
          // Ignore storage quota/security sandbox exceptions
        }
      }
    };

    const performAutomaticLogout = async (reason: string) => {
      if (isLoggingOutRef.current) return;
      if (isHandlingPayment()) {
        recordActivity();
        return;
      }

      isLoggingOutRef.current = true;
      try {
        console.log(`[Session Timeout] Auto-logging out current session due to: ${reason}`);
        localStorage.removeItem(STORAGE_KEY);
        await signOut(auth);
        toast.info("Your session timed out after 5 minutes away. Sign in with Google to continue! 👑", {
          duration: 6000,
        });
      } catch (err) {
        console.error("[Session Timeout] Error signing out:", err);
      } finally {
        isLoggingOutRef.current = false;
      }
    };

    const checkInactivity = () => {
      if (!auth.currentUser || isLoggingOutRef.current) return;
      if (isHandlingPayment()) return;

      const storedStr = localStorage.getItem(STORAGE_KEY);
      const now = Date.now();

      if (storedStr) {
        const lastActive = parseInt(storedStr, 10);
        if (!isNaN(lastActive) && now - lastActive >= INACTIVITY_TIMEOUT_MS) {
          performAutomaticLogout("5 minutes of inactivity / time away");
          return;
        }
      } else {
        localStorage.setItem(STORAGE_KEY, now.toString());
      }
    };

    // 1. Initial check when user becomes active
    const storedStr = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();
    if (storedStr) {
      const lastActive = parseInt(storedStr, 10);
      if (!isNaN(lastActive) && now - lastActive >= INACTIVITY_TIMEOUT_MS) {
        performAutomaticLogout("Previous session exceeded 5 minutes away");
        return;
      }
    }
    // Update active timestamp
    recordActivity();

    // 2. Meaningful interaction listeners
    const interactionEvents: (keyof WindowEventMap)[] = [
      'mousedown',
      'mousemove',
      'keydown',
      'touchstart',
      'scroll',
      'click',
      'pointerdown',
    ];

    const handleUserInteraction = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const lastActive = parseInt(stored, 10);
        if (!isNaN(lastActive) && Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
          performAutomaticLogout("Session expired during idle state");
          return;
        }
      }
      recordActivity();
    };

    interactionEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserInteraction, { passive: true });
    });

    // 3. Tab visibility and focus events (when user switches back to tab or awakens device)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' || document.hasFocus()) {
        checkInactivity();
        if (!isLoggingOutRef.current) {
          recordActivity();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // 4. Periodic background verification (every 10 seconds while tab is open)
    const intervalId = setInterval(checkInactivity, 10000);

    return () => {
      interactionEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserInteraction);
      });
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      clearInterval(intervalId);
    };
  }, [user]);
}
