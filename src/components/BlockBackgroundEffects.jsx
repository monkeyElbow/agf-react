import { useEffect, useMemo, useRef } from 'react';
import { getBackgroundLightMotion, normalizeBackgroundEffects } from '../lib/backgroundEffects';

const LIGHT_RGB_BY_TONE = Object.freeze({
  blue: '0, 173, 187',
  mango: '250, 163, 26',
  melon: '244, 143, 122',
  sand: '196, 190, 182',
  white: '255, 255, 255',
});

export default function BlockBackgroundEffects({ effects }) {
  const config = normalizeBackgroundEffects(effects);
  const activeLights = config.lights.filter((light) => light.enabled !== false);
  const rootRef = useRef(null);
  const scrollMotionSignature = useMemo(() => activeLights
    .map((light) => [
      light.id,
      light.enabled,
      light.motion,
      light.motionMode,
      light.motionX,
      light.motionY,
      light.motionDistance,
      light.motionSpeed,
    ].join(':'))
    .join('|'), [activeLights]);

  useEffect(() => {
    const scrollLights = config.enabled && activeLights.some((light) => (
      light.motion && light.motionMode !== 'ambient'
    ));
    if (!scrollLights || typeof window === 'undefined') {
      return undefined;
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const root = rootRef.current;
    const host = root?.parentElement;
    if (!root || !host) {
      return undefined;
    }

    let frameId = 0;
    const applyScrollMotion = () => {
      frameId = 0;
      const rect = host.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      const progress = Math.min(1, Math.max(0, (viewportHeight - rect.top) / (viewportHeight + rect.height || 1)));
      root.querySelectorAll('.block-background-light').forEach((lightNode, index) => {
        const light = activeLights[index];
        const motion = getBackgroundLightMotion(light, progress, index);
        lightNode.style.setProperty('--block-background-light-motion-x', `${motion.x.toFixed(3)}%`);
        lightNode.style.setProperty('--block-background-light-motion-y', `${motion.y.toFixed(3)}%`);
        lightNode.style.setProperty('--block-background-light-motion-scale', motion.scale.toFixed(4));
      });
    };
    const queueScrollMotion = () => {
      if (frameId) {
        return;
      }
      frameId = window.requestAnimationFrame
        ? window.requestAnimationFrame(applyScrollMotion)
        : window.setTimeout(applyScrollMotion, 0);
    };

    applyScrollMotion();
    window.addEventListener('scroll', queueScrollMotion, { passive: true });
    window.addEventListener('resize', queueScrollMotion);
    return () => {
      window.removeEventListener('scroll', queueScrollMotion);
      window.removeEventListener('resize', queueScrollMotion);
      if (frameId) {
        if (window.cancelAnimationFrame) {
          window.cancelAnimationFrame(frameId);
        } else {
          window.clearTimeout(frameId);
        }
      }
    };
  }, [config.enabled, scrollMotionSignature]);

  if (!config.enabled || !activeLights.length) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className={`block-background-effects${config.clip ? ' is-clipped' : ' is-uncropped'}`}
      aria-hidden="true"
    >
      {activeLights.map((light, index) => (
        <span
          key={light.id || `background-light-${index + 1}`}
          className={`block-background-light${light.motion && light.motionMode === 'ambient' ? ' is-animated' : ''}${light.motion && light.motionMode !== 'ambient' ? ` is-scroll-${light.motionMode}` : ''}`}
          style={{
            '--block-background-light-rgb': LIGHT_RGB_BY_TONE[light.tone] || LIGHT_RGB_BY_TONE.blue,
            '--block-background-light-strength': String(light.strength / 100),
            '--block-background-light-x': `${light.x}%`,
            '--block-background-light-y': `${light.y}%`,
            '--block-background-light-size': `${light.size}%`,
            '--block-background-light-delay': `${index * -2.4}s`,
          }}
        />
      ))}
    </div>
  );
}
