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
      <div className={`admin-hud-editor-panel-stack${panelClassName ? ` ${panelClassName}` : ''}`}>
        {children}
      </div>
    </div>
  );
}
