import { useEffect, useState } from 'react';
import agfLogo from '../assets/agf-logo.svg';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const ICON_A_PATH = 'M113.1 102.33c-3.1-.08-3.97-.17-6.58-.17s-1.95.09-6.45.17v-.71c1.93 0-.89-4.51-1.28-5.41L80.83 63.93h-.51s-17 30.62-17.66 31.76c-1.37 2.46-3.29 5.99-1.59 5.99v.65c-3.35-.08-3.36-.17-6.63-.17s-3.72.09-6.5.17v-.65c1.35 0 2.33-2.83 4.56-6.46 1.13-2 27.81-49.47 27.81-49.47h.53l28.48 50.81c1.66 2.87 2.65 5.12 3.78 5.12z';
const FALLBACK_BRAND_HEIGHT_PX = 30;
const FALLBACK_WORDMARK_CUT_PX = 33.84;
const FALLBACK_WORDMARK_WIDTH_PX = 98.19;
const fallbackBrandShellStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
};
const fallbackBrandIconSlotStyle = {
  position: 'relative',
  display: 'inline-grid',
  placeItems: 'center',
  width: `${FALLBACK_BRAND_HEIGHT_PX}px`,
  height: `${FALLBACK_BRAND_HEIGHT_PX}px`,
  overflow: 'hidden',
  flex: '0 0 auto',
};
const fallbackBrandSquareStyle = {
  position: 'relative',
  zIndex: 1,
  display: 'block',
  width: '100%',
  height: '100%',
  background: '#00adbb',
  boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.06)',
};
const fallbackBrandMarkStyle = {
  position: 'absolute',
  inset: '0',
  zIndex: 2,
  display: 'block',
  width: '100%',
  height: '100%',
  fill: '#ffffff',
};
const fallbackBrandWordmarkShellStyle = {
  display: 'block',
  width: `${FALLBACK_WORDMARK_WIDTH_PX}px`,
  height: `${FALLBACK_BRAND_HEIGHT_PX}px`,
  overflow: 'hidden',
  flex: '0 0 auto',
};
const fallbackBrandWordmarkImageStyle = {
  display: 'block',
  width: 'auto',
  height: `${FALLBACK_BRAND_HEIGHT_PX}px`,
  maxWidth: 'none',
  transform: `translateX(-${FALLBACK_WORDMARK_CUT_PX}px)`,
};

export default function AnimatedBrandLogo() {
  const [reduceMotion, setReduceMotion] = useState(() => (
    typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia(REDUCED_MOTION_QUERY).matches
  ));
  const [introReady, setIntroReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => setReduceMotion(media.matches);
    sync();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', sync);
      return () => media.removeEventListener('change', sync);
    }

    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setIntroReady(false);
      return undefined;
    }

    const rafId = window.requestAnimationFrame(() => {
      setIntroReady(true);
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [reduceMotion]);

  return (
    <span
      className={`site-brand-animated${introReady && !reduceMotion ? ' is-intro-playing' : ''}`}
      style={fallbackBrandShellStyle}
    >
      <span className="site-brand-icon-slot" aria-hidden="true" style={fallbackBrandIconSlotStyle}>
        <span className="site-brand-icon-square" style={fallbackBrandSquareStyle} />
        <svg
          className="site-brand-icon-a"
          viewBox="29.52 25.11 100.59 99.45"
          width={FALLBACK_BRAND_HEIGHT_PX}
          height={FALLBACK_BRAND_HEIGHT_PX}
          focusable="false"
          aria-hidden="true"
          style={fallbackBrandMarkStyle}
        >
          <path d={ICON_A_PATH} />
        </svg>
      </span>

      <span className="site-brand-wordmark-shell" aria-hidden="true" style={fallbackBrandWordmarkShellStyle}>
        <img
          src={agfLogo}
          alt=""
          className="site-brand-wordmark-image"
          fetchPriority="high"
          width="510"
          height="116"
          style={fallbackBrandWordmarkImageStyle}
        />
      </span>
    </span>
  );
}
