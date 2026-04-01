import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Reads the system reduce motion preference so animations can degrade globally.
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => {
        if (mounted) {
          setReduceMotion(false);
        }
      });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
