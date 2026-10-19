import { useEffect } from 'react';
import { sendHeartbeat } from '@/lib/api';

/**
 * Hook to maintain live active user presence.
 * Sends POST /heartbeat periodically (every 45s) and on tab visibility resume.
 */
export function useHeartbeat(intervalMs: number = 45_000) {
  useEffect(() => {
    // Send initial heartbeat on mount
    sendHeartbeat();

    let timer: ReturnType<typeof setInterval> | null = null;

    const startTimer = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (typeof document === 'undefined' || document.visibilityState === 'visible') {
          sendHeartbeat();
        }
      }, intervalMs);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
        startTimer();
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    startTimer();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs]);
}
