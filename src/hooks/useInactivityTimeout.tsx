import { useEffect, useRef, useCallback } from 'react';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'] as const;
const THROTTLE_MS = 60_000; // Only update timestamp once per minute to reduce writes

/**
 * Monitors user activity and calls `onTimeout` after 30 minutes of inactivity.
 * Only active when `enabled` is true (i.e., user is logged in).
 */
export function useInactivityTimeout(onTimeout: () => void, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const throttleRef = useRef<number>(0);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onTimeout();
    }, INACTIVITY_TIMEOUT_MS);
    lastActivityRef.current = Date.now();
  }, [onTimeout]);

  const handleActivity = useCallback(() => {
    const now = Date.now();
    // Throttle: only reset if enough time has passed since last reset
    if (now - throttleRef.current < THROTTLE_MS) return;
    throttleRef.current = now;
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Start the timer
    resetTimer();

    // Listen for activity
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    // Check on visibility change (tab switching)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && enabled) {
        // Check if we've been inactive too long while tab was hidden
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          onTimeout();
        } else {
          resetTimer();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, resetTimer, handleActivity, onTimeout]);
}
