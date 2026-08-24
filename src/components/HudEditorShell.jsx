import { useLayoutEffect, useRef, useState } from 'react';

export function HudEditorShell({ children, className = '' }) {
  return (
    <div className={`admin-hud-editor-shell${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}

export function HudEditorHeader({ children, className = '' }) {
  return (
    <div className={`admin-hud-editor-header${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}

export function HudEditorMain({ children, className = '' }) {
  return (
    <main className={`admin-hud-editor-main${className ? ` ${className}` : ''}`}>
      {children}
    </main>
  );
}

export function HudEditorSettingsRail({ children, className = '' }) {
  return (
    <aside className={`admin-hud-editor-settings-rail${className ? ` ${className}` : ''}`}>
      {children}
    </aside>
  );
}

export function HudEditorSection({ children, className = '', label = '', labelledBy = '' }) {
  return (
    <section
      className={`admin-hud-editor-section${className ? ` ${className}` : ''}`}
      aria-label={label || undefined}
      aria-labelledby={labelledBy || undefined}
    >
      {children}
    </section>
  );
}

export function HudEditorFooter({ children, className = '' }) {
  return (
    <footer className={`admin-hud-editor-footer${className ? ` ${className}` : ''}`}>
      {children}
    </footer>
  );
}

export function HudEditorRail({ children, label = 'Editor sections' }) {
  return (
    <nav className="admin-hud-editor-rail" aria-label={label}>
      {children}
    </nav>
  );
}

export function HudEditorRailButton({ id = '', icon, label, active = false, onClick, hideLabel = false }) {
  return (
    <button
      type="button"
      className={`admin-hud-editor-rail-button${active ? ' is-active' : ''}${id === 'block' ? ' is-block-options' : ''}`}
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
    >
      <span className="admin-hud-editor-rail-icon" aria-hidden="true">{icon}</span>
      {hideLabel ? null : <span className="admin-hud-editor-rail-label">{label}</span>}
    </button>
  );
}

export const HUD_BLOCK_OPTIONS_SECTION = Object.freeze({
  id: 'block',
  label: 'Block options',
  icon: '⚙',
});

export function appendHudBlockOptionsSection(sections = [], blockOptions = null) {
  const safeSections = Array.isArray(sections) ? sections : [];
  return blockOptions ? [...safeSections, HUD_BLOCK_OPTIONS_SECTION] : safeSections;
}

export function HudEditorBlockOptionsPage({ children }) {
  if (!children) {
    return null;
  }
  return children;
}

export function HudEditorModelLayout({
  children,
  sections = [],
  activeSection = '',
  onSectionChange,
  label = 'HUD editor sections',
  className = '',
  panelClassName = '',
  hideRailLabels = false,
}) {
  const safeSections = Array.isArray(sections) ? sections.filter((section) => section?.id) : [];
  const panelStackRef = useRef(null);
  const [panelStackHeight, setPanelStackHeight] = useState(null);

  useLayoutEffect(() => {
    const panelStack = panelStackRef.current;
    if (!panelStack) {
      return undefined;
    }

    const getActivePanel = () => Array.from(panelStack.children).find((child) => {
      if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
        return true;
      }
      return window.getComputedStyle(child).display !== 'none';
    });

    let firstHeightFrame = null;
    let secondHeightFrame = null;
    const cancelHeightCommit = () => {
      if (typeof window === 'undefined' || typeof window.cancelAnimationFrame !== 'function') {
        return;
      }
      if (firstHeightFrame !== null) {
        window.cancelAnimationFrame(firstHeightFrame);
        firstHeightFrame = null;
      }
      if (secondHeightFrame !== null) {
        window.cancelAnimationFrame(secondHeightFrame);
        secondHeightFrame = null;
      }
    };

    const commitMeasuredHeight = (measuredHeight) => {
      if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
        setPanelStackHeight((currentHeight) => (
          currentHeight === measuredHeight ? currentHeight : measuredHeight
        ));
        return;
      }

      cancelHeightCommit();
      // Let the browser paint the old inline height first. The following frame
      // then gives the CSS height transition a real start and end value in
      // Edge, instead of applying both values in one layout pass.
      firstHeightFrame = window.requestAnimationFrame(() => {
        firstHeightFrame = null;
        secondHeightFrame = window.requestAnimationFrame(() => {
          secondHeightFrame = null;
          setPanelStackHeight((currentHeight) => (
            currentHeight === measuredHeight ? currentHeight : measuredHeight
          ));
        });
      });
    };

    const measureActivePanel = () => {
      const previousInlineHeight = panelStack.style.height;
      // The stack keeps the previous panel height during the transition. Read
      // the next panel's natural height with that constraint removed; Edge can
      // otherwise report the old constrained scrollHeight after a rail click.
      panelStack.style.height = 'auto';
      const activePanel = getActivePanel();
      const measuredHeight = Math.ceil(Math.max(
        activePanel?.scrollHeight || 0,
        activePanel?.getBoundingClientRect?.().height || 0,
        panelStack.scrollHeight || 0,
      ));
      panelStack.style.height = previousInlineHeight;
      if (measuredHeight > 0) {
        commitMeasuredHeight(measuredHeight);
      }
    };

    measureActivePanel();

    let resizeObserver = null;
    const activePanel = getActivePanel();
    const ResizeObserverImpl = typeof window !== 'undefined' ? window.ResizeObserver : undefined;
    if (typeof ResizeObserverImpl === 'function' && activePanel) {
      resizeObserver = new ResizeObserverImpl(measureActivePanel);
      resizeObserver.observe(activePanel);
    }

    return () => {
      resizeObserver?.disconnect();
      cancelHeightCommit();
    };
  }, [activeSection, children]);

  return (
    <div className={`admin-hud-editor-model-layout admin-hud-editor-rail-layout is-section-${activeSection}${className ? ` ${className}` : ''}`}>
      <HudEditorRail label={label}>
        {safeSections.map((section) => (
          <HudEditorRailButton
            id={section.id}
            key={section.id}
            icon={section.icon}
            label={section.label}
            active={activeSection === section.id}
            onClick={() => onSectionChange?.(section.id)}
            hideLabel={hideRailLabels}
          />
        ))}
      </HudEditorRail>
      <div
        ref={panelStackRef}
        className={`admin-hud-editor-panel-stack${panelClassName ? ` ${panelClassName}` : ''}`}
        style={panelStackHeight ? { height: `${panelStackHeight}px` } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
