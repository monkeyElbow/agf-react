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
