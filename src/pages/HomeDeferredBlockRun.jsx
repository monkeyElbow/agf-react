import { useEffect, useRef, useState } from 'react';

const HOME_DEFER_ROOT_MARGIN = '1000px 0px';

export default function HomeDeferredBlockRun({ children, enabled = true }) {
  const sentinelRef = useRef(null);
  const [isReady, setIsReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setIsReady(true);
      return undefined;
    }

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsReady(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) {
        return;
      }
      setIsReady(true);
      observer.disconnect();
    }, { rootMargin: HOME_DEFER_ROOT_MARGIN });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [enabled]);

  if (isReady) {
    return children;
  }

  return <div ref={sentinelRef} className="home-deferred-block-sentinel" aria-hidden="true" />;
}
