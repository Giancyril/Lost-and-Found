import { useRef } from 'react';

/**
 * Returns a click handler.
 * Fires `onTripleTap` when the attached element is clicked 3 times within 600ms.
 *
 * Usage:
 *   const handleTripleTap = useTripleTap(() => navigate('/admin'));
 *   <div onClick={handleTripleTap}>...</div>
 */
export const useTripleTap = (onTripleTap: () => void) => {
  const tapCount = useRef(0);
  const timer    = useRef<ReturnType<typeof setTimeout>>();

  return () => {
    tapCount.current += 1;
    clearTimeout(timer.current);

    if (tapCount.current >= 3) {
      tapCount.current = 0;
      onTripleTap();
      return;
    }

    timer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 600);
  };
};