import { useEffect, useRef, useCallback } from 'react';

export const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes
export const INACTIVITY_WARNING_MS = 60 * 1000; // aviso 1 minuto antes
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'] as const;
const THROTTLE_MS = 60_000; // Only update timestamp once per minute to reduce writes

interface Options {
  /** Chamado quando faltar `INACTIVITY_WARNING_MS` para o logout. */
  onWarning?: () => void;
  timeoutMs?: number;
  warningMs?: number;
}

/**
 * Monitors user activity, warns 1 minute before the limit and calls `onTimeout`
 * after 60 minutes of inactivity. Only active when `enabled` is true.
 * Returns a `reset` function to restart the countdown manually.
 */
export function useInactivityTimeout(
  onTimeout: () => void,
  enabled: boolean,
  { onWarning, timeoutMs = INACTIVITY_TIMEOUT_MS, warningMs = INACTIVITY_WARNING_MS }: Options = {},
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const throttleRef = useRef<number>(0);
  const pausedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    timerRef.current = null;
    warnTimerRef.current = null;
  }, []);

  const resetTimer = useCallback(() => {
    clearTimers();
    pausedRef.current = false;
    throttleRef.current = 0;
    lastActivityRef.current = Date.now();
    if (onWarning && warningMs < timeoutMs) {
      warnTimerRef.current = setTimeout(() => {
        pausedRef.current = true; // atividade não cancela o aviso: usuário decide
        onWarning();
      }, timeoutMs - warningMs);
    }
    timerRef.current = setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  }, [clearTimers, onTimeout, onWarning, timeoutMs, warningMs]);

  const handleActivity = useCallback(() => {
    if (pausedRef.current) return;
    const now = Date.now();
    if (now - throttleRef.current < THROTTLE_MS) return;
    throttleRef.current = now;
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    resetTimer();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    // Check on visibility change (tab switching)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && enabled) {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= timeoutMs) {
          onTimeout();
        } else if (elapsed >= timeoutMs - warningMs) {
          if (!pausedRef.current) {
            pausedRef.current = true;
            onWarning?.();
          }
        } else {
          resetTimer();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimers();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, resetTimer, handleActivity, onTimeout, onWarning, clearTimers, timeoutMs, warningMs]);

  return { reset: resetTimer };
}
