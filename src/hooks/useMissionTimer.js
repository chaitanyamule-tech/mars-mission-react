import { useState, useEffect, useRef } from 'react';
import { formatMissionTime } from '../utils/helpers';

/**
 * Mission elapsed time ticker — starts from the moment the hook mounts.
 * Returns a formatted string like T+00:00:00:00
 */
export function useMissionTimer() {
  const epochRef = useRef(Date.now());
  const [display, setDisplay] = useState('T+00:00:00:00');

  useEffect(() => {
    const id = setInterval(() => {
      setDisplay(formatMissionTime(Date.now() - epochRef.current));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return display;
}

/**
 * Countdown from `initial` seconds, ticking at `interval` ms per decrement.
 * Calls onComplete when done.
 */
export function useCountdown(initial, intervalMs, onComplete, active) {
  const [remaining, setRemaining] = useState(initial);
  const remainingRef = useRef(initial);

  useEffect(() => {
    if (!active) return;
    remainingRef.current = initial;
    setRemaining(initial);
    const id = setInterval(() => {
      remainingRef.current -= 1;
      setRemaining(remainingRef.current);
      if (remainingRef.current <= 0) {
        clearInterval(id);
        onComplete?.();
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [active]); // eslint-disable-line

  return remaining;
}
