import { useState, useEffect } from 'react';

const TRACKED_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'a', 'd', 'w', 's',
  'A', 'D', 'W', 'S',
]);

/**
 * Returns a live map of currently pressed keys.
 * Keys that are not in TRACKED_KEYS are ignored.
 */
export function useKeyboard() {
  const [keys, setKeys] = useState({});

  useEffect(() => {
    const onDown = (e) => {
      if (!TRACKED_KEYS.has(e.key)) return;
      e.preventDefault();
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
    };
    const onUp = (e) => {
      if (!TRACKED_KEYS.has(e.key)) return;
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }));
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
    };
  }, []);

  return keys;
}

/**
 * Helpers derived from the keys map.
 */
export function useRoverControls() {
  const keys = useKeyboard();
  return {
    left:  keys['arrowleft'] || keys['a'],
    right: keys['arrowright'] || keys['d'],
    up:    keys['arrowup']   || keys['w'],
    down:  keys['arrowdown'] || keys['s'],
  };
}
