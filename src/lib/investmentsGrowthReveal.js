export const INVESTMENTS_GROWTH_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
export const INVESTMENTS_GROWTH_REVEAL_SELECTOR = '[data-investments-growth-reveal]';
export const INVESTMENTS_GROWTH_BACKGROUND_PANEL_SELECTOR = '[data-investments-growth-background-panel]';
const INVESTMENTS_GROWTH_BACKGROUND_TONES = Object.freeze(['blue', 'mango', 'sand', 'white']);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0, edge1, value) {
  if (edge0 === edge1) {
    return value >= edge1 ? 1 : 0;
  }
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - (2 * t));
}

function clampUnitInterval(value) {
  return clamp(value, 0, 1);
}

function readGrowthRevealNumber(target, attributeName, fallback) {
  const value = target?.getAttribute(attributeName);
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number.parseFloat(String(value).trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getInvestmentsGrowthRevealProgress(target, viewportHeight) {
  if (!target || !viewportHeight) {
    return 1;
  }
  const rect = target.getBoundingClientRect();
  const startVh = readGrowthRevealNumber(target, 'data-investments-growth-start-vh', 1.02);
  const endVh = readGrowthRevealNumber(target, 'data-investments-growth-end-vh', 0.56);
  const anchorOffset = Math.min(
    rect.height * readGrowthRevealNumber(target, 'data-investments-growth-anchor-ratio', 0.32),
    readGrowthRevealNumber(target, 'data-investments-growth-anchor-max-px', 168),
  );
  const anchorY = rect.top + anchorOffset;
  const startY = viewportHeight * startVh;
  const endY = viewportHeight * endVh;
  return smoothstep(0, 1, (startY - anchorY) / Math.max(1, startY - endY));
}

export function applyInvestmentsGrowthRevealMotion(target, viewportHeight) {
  if (!target) {
    return;
  }
  const progress = getInvestmentsGrowthRevealProgress(target, viewportHeight);
  const minOpacity = readGrowthRevealNumber(target, 'data-investments-growth-min-opacity', 0.18);
  const baseScale = readGrowthRevealNumber(target, 'data-investments-growth-base-scale', 0.92);
  const shiftY = readGrowthRevealNumber(target, 'data-investments-growth-shift-y', 56);
  const opacity = minOpacity + ((1 - minOpacity) * progress);
  const scale = baseScale + ((1 - baseScale) * progress);
  const translateY = (1 - progress) * shiftY;

  target.style.setProperty('--investments-growth-reveal-opacity', opacity.toFixed(3));
  target.style.setProperty('--investments-growth-reveal-scale', scale.toFixed(3));
  target.style.setProperty('--investments-growth-reveal-shift-y', `${translateY.toFixed(2)}px`);
}

export function clearInvestmentsGrowthRevealMotion(target) {
  if (!target) {
    return;
  }
  target.style.setProperty('--investments-growth-reveal-opacity', '1');
  target.style.setProperty('--investments-growth-reveal-scale', '1');
  target.style.setProperty('--investments-growth-reveal-shift-y', '0px');
}

export function applyInvestmentsGrowthBackgroundMotion(root, panelNodes, viewportHeight) {
  if (!root || !Array.isArray(panelNodes) || !panelNodes.length || typeof window === 'undefined') {
    return;
  }

  const scrollY = window.scrollY || window.pageYOffset || 0;
  const viewportCenter = scrollY + ((viewportHeight || window.innerHeight || document.documentElement.clientHeight || 1) * 0.5);
  const centers = panelNodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return scrollY + rect.top + (rect.height * 0.5);
  });
  const weights = {
    blue: 0,
    mango: 0,
    sand: 0,
    white: 0,
  };

  if (viewportCenter <= centers[0]) {
    weights[panelNodes[0].getAttribute('data-investments-growth-background-panel') || 'blue'] = 1;
  } else if (viewportCenter >= centers[centers.length - 1]) {
    weights[panelNodes[panelNodes.length - 1].getAttribute('data-investments-growth-background-panel') || 'white'] = 1;
  } else {
    let activeIndex = 0;
    for (let index = 0; index < centers.length - 1; index += 1) {
      if (viewportCenter >= centers[index] && viewportCenter < centers[index + 1]) {
        activeIndex = index;
        break;
      }
    }

    const currentTone = panelNodes[activeIndex].getAttribute('data-investments-growth-background-panel') || 'blue';
    const nextTone = panelNodes[activeIndex + 1].getAttribute('data-investments-growth-background-panel') || 'white';
    const span = Math.max(1, centers[activeIndex + 1] - centers[activeIndex]);
    const ratio = smoothstep(0, 1, (viewportCenter - centers[activeIndex]) / span);
    weights[currentTone] = 1 - ratio;
    weights[nextTone] = ratio;
  }

  INVESTMENTS_GROWTH_BACKGROUND_TONES.forEach((tone) => {
    root.style.setProperty(`--investments-growth-${tone}-opacity`, (weights[tone] || 0).toFixed(3));
  });
}

export function clearInvestmentsGrowthBackgroundMotion(root) {
  if (!root) {
    return;
  }
  root.style.setProperty('--investments-growth-blue-opacity', '1');
  root.style.setProperty('--investments-growth-mango-opacity', '0');
  root.style.setProperty('--investments-growth-sand-opacity', '0');
  root.style.setProperty('--investments-growth-white-opacity', '0');
}

export function setupInvestmentsGrowthRevealMotion(root, { includeBackgroundMotion = true } = {}) {
  if (!root || typeof window === 'undefined') {
    return () => {};
  }

  const revealNodes = Array.from(root.querySelectorAll(INVESTMENTS_GROWTH_REVEAL_SELECTOR));
  const backgroundPanelNodes = includeBackgroundMotion
    ? Array.from(root.querySelectorAll(INVESTMENTS_GROWTH_BACKGROUND_PANEL_SELECTOR))
    : [];
  if (!revealNodes.length && !backgroundPanelNodes.length) {
    return () => {};
  }

  const mediaQuery = window.matchMedia?.(INVESTMENTS_GROWTH_REDUCED_MOTION_QUERY) || null;
  let frameId = 0;

  const updateMotion = () => {
    frameId = 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
    if (backgroundPanelNodes.length) {
      applyInvestmentsGrowthBackgroundMotion(root, backgroundPanelNodes, viewportHeight);
    }
    if (mediaQuery?.matches) {
      revealNodes.forEach(clearInvestmentsGrowthRevealMotion);
      return;
    }
    revealNodes.forEach((node) => applyInvestmentsGrowthRevealMotion(node, viewportHeight));
  };

  const requestMotion = () => {
    if (frameId) {
      return;
    }
    frameId = window.requestAnimationFrame(updateMotion);
  };

  const handleMotionPreferenceChange = () => {
    revealNodes.forEach(clearInvestmentsGrowthRevealMotion);
    clearInvestmentsGrowthBackgroundMotion(root);
    requestMotion();
  };

  requestMotion();
  window.addEventListener('scroll', requestMotion, { passive: true });
  window.addEventListener('resize', requestMotion);
  if (typeof mediaQuery?.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleMotionPreferenceChange);
  } else if (typeof mediaQuery?.addListener === 'function') {
    mediaQuery.addListener(handleMotionPreferenceChange);
  }

  return () => {
    window.removeEventListener('scroll', requestMotion);
    window.removeEventListener('resize', requestMotion);
    if (typeof mediaQuery?.removeEventListener === 'function') {
      mediaQuery.removeEventListener('change', handleMotionPreferenceChange);
    } else if (typeof mediaQuery?.removeListener === 'function') {
      mediaQuery.removeListener(handleMotionPreferenceChange);
    }
    if (frameId) {
      window.cancelAnimationFrame(frameId);
    }
    revealNodes.forEach(clearInvestmentsGrowthRevealMotion);
    clearInvestmentsGrowthBackgroundMotion(root);
  };
}
