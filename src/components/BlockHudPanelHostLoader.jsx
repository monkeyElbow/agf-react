import { lazy, Suspense } from 'react';

const LazyFrontHudPanelShell = lazy(() => import('./FrontHudPanelShell'));
const LazyFrontHudPageWorkflow = lazy(() => import('./FrontHudPageWorkflow'));
const LazyFrontHudStructureControls = lazy(() => import('./FrontHudStructureControls'));
const LazyMobileFrontHudActionTray = lazy(() => import('./MobileFrontHudActionTray'));
const LazyHeroInlineLiveEditor = lazy(async () => {
  const module = await import('./HeroHudEditorShared');
  return { default: module.HeroInlineLiveEditor };
});

export function loadBlockHudPanelHost() {
  return import('./BlockHudPanelHost');
}

export const LazyBlockHudPanelHost = lazy(loadBlockHudPanelHost);

export function preloadBlockHudPanelHost() {
  return loadBlockHudPanelHost().catch(() => null);
}

export function preloadFrontHudChrome() {
  return Promise.all([
    import('./FrontHudPanelShell'),
    import('./FrontHudPageWorkflow'),
    import('./FrontHudStructureControls'),
    import('./MobileFrontHudActionTray'),
    import('./HeroHudEditorShared'),
  ]).catch(() => null);
}

function createHudBoundary(LazyComponent, fallback = null) {
  return function HudBoundary(props) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

export const FrontHudPanelShell = createHudBoundary(LazyFrontHudPanelShell);
export const FrontHudPageWorkflow = createHudBoundary(LazyFrontHudPageWorkflow);
export const FrontHudStructureControls = createHudBoundary(LazyFrontHudStructureControls);
export const MobileFrontHudActionTray = createHudBoundary(LazyMobileFrontHudActionTray);
export const HeroInlineLiveEditor = createHudBoundary(LazyHeroInlineLiveEditor);

export function BlockHudPanelLoading({ label = 'block' }) {
  return (
    <div className="admin-front-hud-editor-loading" role="status" aria-live="polite">
      Loading {String(label || 'block').trim() || 'block'} editor…
    </div>
  );
}
