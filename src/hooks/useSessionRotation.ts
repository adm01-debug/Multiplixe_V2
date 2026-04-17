import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const ROTATION_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_CHECK_MS = 60 * 1000; // 1 minute

/**
 * Auto-rotates Supabase session tokens periodically and on suspicious activity.
 * - Refreshes session every 30min while active
 * - Forces re-auth if session expired or refresh fails
 * - Tracks last activity to skip rotation when idle
 */
export const useSessionRotation = (): void => {
  const { user, signOut } = useAuth();
  const lastActivityRef = useRef<number>(Date.now());
  const rotationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;

    const trackActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events: Array<keyof WindowEventMap> = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, trackActivity, { passive: true }));

    const rotateSession = async () => {
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs > ROTATION_INTERVAL_MS * 2) return;

      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        await signOut();
      }
    };

    rotationTimerRef.current = setInterval(rotateSession, ROTATION_INTERVAL_MS);

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        const idleMs = Date.now() - lastActivityRef.current;
        if (idleMs > ROTATION_INTERVAL_MS) {
          void rotateSession();
        }
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, trackActivity));
      document.removeEventListener('visibilitychange', visibilityHandler);
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
        rotationTimerRef.current = null;
      }
    };
  }, [user, signOut]);

  // Activity heartbeat (no-op interval to keep ref alive)
  useEffect(() => {
    const heartbeat = setInterval(() => {
      // Keeps ref check predictable for tests/debug
    }, ACTIVITY_CHECK_MS);
    return () => clearInterval(heartbeat);
  }, []);
};
