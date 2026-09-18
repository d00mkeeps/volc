import { useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';

export function useScrollTracking() {
  const posthog = usePostHog();
  const trackedDepths = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!posthog) return;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY;
      const scrollPercentage = (scrollTop / scrollHeight) * 100;

      const depths = [25, 50, 75, 100];

      depths.forEach((depth) => {
        if (scrollPercentage >= depth && !trackedDepths.current.has(depth)) {
          trackedDepths.current.add(depth);
          posthog.capture('scroll_depth', { depth });
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [posthog]);
}
